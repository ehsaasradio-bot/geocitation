import { getChatGPTUser } from "../../chatgpt-auth";
import type { AuditResult } from "../../audit-types";
import { listReports, saveReport } from "../../../lib/reports/store";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to view saved reports." }, { status: 401 });
  return Response.json({ reports: await listReports(user.email) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to save reports." }, { status: 401 });
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== requestUrl.origin) || (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))) {
    return Response.json({ error: "Cross-origin report requests are not allowed." }, { status: 403 });
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return Response.json({ error: "Reports must use JSON." }, { status: 415 });
  }
  const raw = await request.text();
  if (raw.length > 1_000_000) return Response.json({ error: "Report is too large." }, { status: 413 });
  let result: AuditResult;
  try {
    result = JSON.parse(raw) as AuditResult;
  } catch {
    return Response.json({ error: "Invalid report." }, { status: 400 });
  }
  if (!result || typeof result.domain !== "string" || typeof result.target !== "string" || typeof result.score !== "number" || !Array.isArray(result.findings)) {
    return Response.json({ error: "Incomplete report." }, { status: 400 });
  }
  try {
    const target = new URL(result.target);
    if (!/^https?:$/.test(target.protocol) || target.hostname !== result.domain || result.score < 0 || result.score > 100) throw new Error("invalid");
  } catch {
    return Response.json({ error: "Invalid report target." }, { status: 400 });
  }
  const id = await saveReport(user.email, result);
  return Response.json({ id }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
