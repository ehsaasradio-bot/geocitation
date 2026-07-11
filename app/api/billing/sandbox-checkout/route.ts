import { getChatGPTUser } from "../../../chatgpt-auth";
import { completeSandboxOrder, isSandboxPlan } from "../../../../lib/billing/sandbox";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to use sandbox checkout." }, { status: 401 });
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== requestUrl.origin) || (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))) {
    return Response.json({ error: "Cross-origin checkout requests are not allowed." }, { status: 403 });
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return Response.json({ error: "Checkout requests must use JSON." }, { status: 415 });
  }
  const payload = await request.json().catch(() => null) as { plan?: unknown } | null;
  if (!isSandboxPlan(payload?.plan)) return Response.json({ error: "Unknown sandbox plan." }, { status: 400 });
  const order = await completeSandboxOrder(user.email, payload.plan);
  return Response.json({ order, message: "Sandbox order completed. No payment was processed." }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
