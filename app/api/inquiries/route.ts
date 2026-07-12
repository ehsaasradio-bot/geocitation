import { createProjectInquiry, listProjectInquiries } from "../../../lib/inquiries/store";
import { getChatGPTUser } from "../../chatgpt-auth";

function clean(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to view project inquiries." }, { status: 401 });
  return Response.json({ inquiries: await listProjectInquiries(user.email) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== requestUrl.origin) || (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))) {
    return Response.json({ error: "Cross-origin inquiry requests are not allowed." }, { status: 403 });
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return Response.json({ error: "Project inquiries must use JSON." }, { status: 415 });
  }

  const raw = await request.text();
  if (raw.length > 25_000) return Response.json({ error: "Project inquiry is too large." }, { status: 413 });

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid project inquiry." }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const name = clean(body.name, 120);
  const email = clean(body.email, 160).toLowerCase();
  const website = clean(body.website, 240);
  const market = clean(body.market, 160);
  const services = clean(body.services, 400);
  const notes = clean(body.notes, 4_000);
  const orderId = clean(body.orderId, 120) || null;

  if (!name || !email || !website || !market || !services || !notes) {
    return Response.json({ error: "Every intake field is required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Use a valid email address." }, { status: 400 });
  }

  try {
    const target = new URL(website.startsWith("http") ? website : `https://${website}`);
    if (!/^https?:$/.test(target.protocol) || !target.hostname) throw new Error("invalid");
  } catch {
    return Response.json({ error: "Use a valid website URL." }, { status: 400 });
  }

  let inquiry;
  try {
    inquiry = await createProjectInquiry({
      accountEmail: user?.email ?? null,
      name,
      email,
      website,
      market,
      services,
      notes,
      orderId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNKNOWN_CONSULTATION_ORDER") {
      return Response.json({ error: "Use a valid consultation order before linking intake." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "ORDER_LINK_REQUIRES_SIGN_IN") {
      return Response.json({ error: "Sign in before linking an order to intake." }, { status: 401 });
    }
    throw error;
  }
  return Response.json({ inquiry }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
