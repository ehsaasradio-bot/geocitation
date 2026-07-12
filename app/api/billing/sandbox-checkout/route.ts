import { getChatGPTUser } from "../../../chatgpt-auth";
import { completeSandboxOrder, createSandboxOrder, isSandboxPlan } from "../../../../lib/billing/sandbox";

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
  const payload = await request.json().catch(() => null) as { action?: unknown; plan?: unknown; orderId?: unknown; reportId?: unknown } | null;
  if (payload?.action === "complete") {
    if (typeof payload.orderId !== "string" || !payload.orderId) return Response.json({ error: "Unknown sandbox order." }, { status: 400 });
    const order = await completeSandboxOrder(user.email, payload.orderId);
    return Response.json({ order, message: "Sandbox payment confirmed. No money was processed." }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
  if (payload?.action !== "create" || !isSandboxPlan(payload.plan)) return Response.json({ error: "Unknown sandbox plan." }, { status: 400 });
  const reportId = typeof payload.reportId === "string" && /^[a-f0-9]{32}$/.test(payload.reportId) ? payload.reportId : undefined;
  const order = await createSandboxOrder(user.email, payload.plan, reportId);
  return Response.json({ order, message: "Sandbox order created. Review and confirm the test payment." }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
