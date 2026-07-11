/** Cloudflare Worker entry point for AI SIGNAL°. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { enforceAuditRateLimit, RateLimitUnavailableError } from "../lib/audit/rate-limit";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  RATE_LIMIT_SALT?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    let response: Response | undefined;
    let rateLimitHeaders: Record<string, string> = {};

    if (url.pathname === "/api/audit" && request.method === "POST") {
      let targetHostname = "invalid-target";
      try {
        const body = await request.clone().text();
        if (body.length <= 4_096) {
          const payload = JSON.parse(body) as { url?: unknown };
          if (typeof payload.url === "string" && payload.url.length <= 2_048) {
            targetHostname = new URL(/^https?:\/\//i.test(payload.url) ? payload.url : `https://${payload.url}`).hostname || targetHostname;
          }
        }
      } catch {
        // Invalid input is still visitor-limited and will be rejected by the route.
      }

      try {
        const rateLimit = await enforceAuditRateLimit(request, targetHostname, env);
        rateLimitHeaders = rateLimit.headers;
        if (!rateLimit.allowed) {
          const scope = rateLimit.reason === "target" ? "This website" : "This visitor";
          response = Response.json(
            { error: `${scope} has reached the free audit limit. Try again after the cooldown.` },
            {
              status: 429,
              headers: {
                ...rateLimit.headers,
                "Cache-Control": "no-store",
                "Retry-After": String(rateLimit.retryAfter),
              },
            },
          );
        }
      } catch (error) {
        if (error instanceof RateLimitUnavailableError) {
          response = Response.json(
            { error: "Audit protection is temporarily unavailable. Please try again shortly." },
            { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } },
          );
        } else {
          throw error;
        }
      }
    }

    if (response) {
      // A protection response was produced before application routing.
    } else if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    } else {
      response = await handler.fetch(request, env, ctx);
    }

    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Content-Security-Policy", "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'");
    if (url.pathname.startsWith("/api/")) headers.set("X-Robots-Tag", "noindex, nofollow");
    for (const [name, value] of Object.entries(rateLimitHeaders)) headers.set(name, value);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

export default worker;
