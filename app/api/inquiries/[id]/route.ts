import { currentAdminUser } from "../../../../lib/admin/access";
import { isInquiryPriority, isInquiryStatus, updateProjectInquiryReview } from "../../../../lib/inquiries/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await currentAdminUser();
  if (!admin) return Response.json({ error: "Admin access required." }, { status: 403 });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return Response.json({ error: "Inquiry updates must use JSON." }, { status: 415 });
  }
  const raw = await request.text();
  if (raw.length > 4_000) return Response.json({ error: "Inquiry update is too large." }, { status: 413 });

  let payload: { status?: unknown; priority?: unknown; adminNote?: unknown };
  try {
    payload = JSON.parse(raw) as { status?: unknown; priority?: unknown; adminNote?: unknown };
  } catch {
    return Response.json({ error: "Invalid inquiry update." }, { status: 400 });
  }
  if (!isInquiryStatus(payload.status)) {
    return Response.json({ error: "Unknown inquiry status." }, { status: 400 });
  }
  if (!isInquiryPriority(payload.priority)) {
    return Response.json({ error: "Unknown inquiry priority." }, { status: 400 });
  }
  if (typeof payload.adminNote !== "string") {
    return Response.json({ error: "Internal notes must be text." }, { status: 400 });
  }

  const { id } = await context.params;
  const updated = await updateProjectInquiryReview(id, {
    status: payload.status,
    priority: payload.priority,
    adminNote: payload.adminNote.slice(0, 2_000),
  }, admin.email);
  if (!updated) return Response.json({ error: "Inquiry not found." }, { status: 404 });
  return Response.json({ ok: true, inquiry: updated }, { headers: { "Cache-Control": "no-store" } });
}
