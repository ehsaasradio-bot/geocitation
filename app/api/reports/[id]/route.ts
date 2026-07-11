import { getChatGPTUser } from "../../../chatgpt-auth";
import { deleteReport, getReport } from "../../../../lib/reports/store";

type RouteContext = { params: Promise<{ id: string }> };

function validId(id: string) {
  return /^[a-f0-9]{32}$/.test(id);
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to view this report." }, { status: 401 });
  const { id } = await context.params;
  if (!validId(id)) return Response.json({ error: "Invalid report id." }, { status: 400 });
  const report = await getReport(user.email, id);
  if (!report) return Response.json({ error: "Report not found." }, { status: 404 });
  return Response.json({ report }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to delete this report." }, { status: 401 });
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== requestUrl.origin) || (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))) {
    return Response.json({ error: "Cross-origin report requests are not allowed." }, { status: 403 });
  }
  const { id } = await context.params;
  if (!validId(id)) return Response.json({ error: "Invalid report id." }, { status: 400 });
  const deleted = await deleteReport(user.email, id);
  return deleted ? new Response(null, { status: 204 }) : Response.json({ error: "Report not found." }, { status: 404 });
}
