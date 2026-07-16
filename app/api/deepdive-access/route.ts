import {
  DEEPDIVE_ACCESS_COOKIE,
  DEEPDIVE_ACCESS_TOKEN,
  isDeepdiveKey,
} from "../../../lib/deepdive/access";

// Magic-link exchange: /api/deepdive-access?key=<KEY> — validates the shared
// secret, drops the HttpOnly access cookie, and bounces back to /deepdive
// (always to a clean URL, so the key never lingers in the address bar).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const secure = url.protocol === "https:" ? "; Secure" : "";

  if (!(await isDeepdiveKey(key))) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/deepdive", "Cache-Control": "no-store" },
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/deepdive",
      "Cache-Control": "no-store",
      "Set-Cookie": `${DEEPDIVE_ACCESS_COOKIE}=${DEEPDIVE_ACCESS_TOKEN}; Path=/deepdive; Max-Age=604800; HttpOnly; SameSite=Lax${secure}`,
    },
  });
}
