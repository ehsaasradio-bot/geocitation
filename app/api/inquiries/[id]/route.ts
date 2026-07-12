import { currentAdminUser } from "../../../../lib/admin/access";
import { isInquiryStatus, updateProjectInquiryStatus } from "../../../../lib/inquiries/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await currentAdminUser();
  if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return Response.json({ error: "Inquiry updates must use JSON." }, { status: 415 });
  }
  const raw = await request.text();
  if (raw.length > 4_000) return Response.json({ error: "Inquiry update is too large." }, { status: 413 });

  let payload: { status?: unknown };
  try {
    payload = JSON.parse(raw) as { status?: unknown };
  } catch {
    return Response.json({ error: "Invalid inquiry update." }, { status: 400 });
  }
  if (!isInquiryStatus(payload.status)) {
    return Response.json({ error: "Unknown inquiry status." }, { status: 400 });
  }

  const { id } = await context.params;
  const updated = await updateProjectInquiryStatus(id, payload.status, admin.email);
  if (!updated) return Response.json({ error: "Inquiry not found." }, { status: 404 });
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
