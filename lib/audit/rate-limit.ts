export type AuditRuntimeEnv = {
  DB?: D1Database;
  RATE_LIMIT_SALT?: string;
};

type RateBucket = {
  kind: "visitor" | "target";
  value: string;
  limit: number;
  windowSeconds: number;
};

type BucketResult = RateBucket & {
  count: number;
  remaining: number;
  resetSeconds: number;
};

export type AuditRateLimitDecision = {
  allowed: boolean;
  reason: "visitor" | "target" | null;
  retryAfter: number;
  headers: Record<string, string>;
};

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Audit protection is temporarily unavailable.");
    this.name = "RateLimitUnavailableError";
  }
}

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function getClientAddress(request: Request) {
  const cloudflareAddress = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareAddress) return cloudflareAddress;

  if (isLocalRequest(request)) {
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local-development";
  }

  return "";
}

async function hashIdentifier(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeBucket(db: D1Database, salt: string, bucket: RateBucket, now: number): Promise<BucketResult> {
  const windowStart = Math.floor(now / bucket.windowSeconds) * bucket.windowSeconds;
  const expiresAt = windowStart + bucket.windowSeconds + 60;
  const key = await hashIdentifier(`${salt}:${bucket.kind}:${bucket.value}:${windowStart}:${bucket.windowSeconds}`);
  const row = await db
    .prepare(`
      INSERT INTO audit_rate_limits (key, window_start, request_count, expires_at, updated_at)
      VALUES (?1, ?2, 1, ?3, ?4)
      ON CONFLICT(key) DO UPDATE SET
        request_count = request_count + 1,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at
      RETURNING request_count
    `)
    .bind(key, windowStart, expiresAt, now)
    .first<{ request_count: number }>();

  if (!row || typeof row.request_count !== "number") throw new RateLimitUnavailableError();
  return {
    ...bucket,
    count: row.request_count,
    remaining: Math.max(0, bucket.limit - row.request_count),
    resetSeconds: Math.max(1, windowStart + bucket.windowSeconds - now),
  };
}

export async function enforceAuditRateLimit(request: Request, targetHostname: string, runtime: AuditRuntimeEnv): Promise<AuditRateLimitDecision> {
  const clientAddress = getClientAddress(request);

  if ((!runtime.DB || !runtime.RATE_LIMIT_SALT || !clientAddress) && isLocalRequest(request)) {
    return {
      allowed: true,
      reason: null,
      retryAfter: 0,
      headers: {
        "X-RateLimit-Limit": "local",
        "X-RateLimit-Remaining": "local",
        "X-RateLimit-Policy": "development-bypass",
      },
    };
  }

  if (!runtime.DB || !runtime.RATE_LIMIT_SALT || !clientAddress) throw new RateLimitUnavailableError();

  const now = Math.floor(Date.now() / 1000);
  const buckets: RateBucket[] = [
    { kind: "visitor", value: clientAddress, limit: 5, windowSeconds: 600 },
    { kind: "visitor", value: clientAddress, limit: 30, windowSeconds: 86_400 },
    { kind: "target", value: targetHostname.toLowerCase(), limit: 20, windowSeconds: 3_600 },
  ];
  const results = await Promise.all(buckets.map((bucket) => consumeBucket(runtime.DB!, runtime.RATE_LIMIT_SALT!, bucket, now)));
  const blocked = results
    .filter((bucket) => bucket.count > bucket.limit)
    .sort((a, b) => b.resetSeconds - a.resetSeconds)[0];
  const mostRestrictive = [...results].sort((a, b) => a.remaining - b.remaining)[0];

  if (crypto.getRandomValues(new Uint8Array(1))[0] < 3) {
    runtime.DB.prepare("DELETE FROM audit_rate_limits WHERE expires_at < ?1").bind(now).run().catch(() => undefined);
  }

  const retryAfter = blocked?.resetSeconds ?? 0;
  return {
    allowed: !blocked,
    reason: blocked?.kind ?? null,
    retryAfter,
    headers: {
      "X-RateLimit-Limit": String(mostRestrictive.limit),
      "X-RateLimit-Remaining": String(mostRestrictive.remaining),
      "X-RateLimit-Reset": String(mostRestrictive.resetSeconds),
      "X-RateLimit-Policy": "5;w=600, 30;w=86400, 20;w=3600",
    },
  };
}
