import { getChatGPTUser } from "../../chatgpt-auth";
import { hasFullAuditAccess } from "../../../lib/billing/sandbox";
import { getReport } from "../../../lib/reports/store";
import { listObservations, saveObservation, type ObservationState } from "../../../lib/lab/store";
import { openAIAvailability } from "../../../lib/providers/openai";

const platforms = new Set(["chatgpt", "perplexity", "gemini", "claude", "copilot"]);
const states = new Set<ObservationState>(["not_run", "cited", "mentioned", "not_found"]);

export async function authorizedUser() {
  const user = await getChatGPTUser();
  if (!user) return { error: Response.json({ error: "Sign in to use the visibility lab." }, { status: 401 }) };
  if (!(await hasFullAuditAccess(user.email))) return { error: Response.json({ error: "A Full Audit sandbox entitlement is required." }, { status: 402 }) };
  return { user };
}

export async function GET(request: Request) {
  const auth = await authorizedUser();
  if (auth.error) return auth.error;
  const reportId = new URL(request.url).searchParams.get("reportId") ?? "";
  if (!/^[a-f0-9]{32}$/.test(reportId)) return Response.json({ error: "Choose a saved report." }, { status: 400 });
  const report = await getReport(auth.user.email, reportId);
  if (!report) return Response.json({ error: "Report not found." }, { status: 404 });
  const observations = await listObservations(auth.user.email, reportId);
  const providers = [await openAIAvailability(), { key: "perplexity", name: "Perplexity", connected: false }, { key: "gemini", name: "Gemini", connected: false }, { key: "anthropic", name: "Claude", connected: false }, { key: "copilot", name: "Copilot", connected: false }];
  return Response.json({ report, observations, providers }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const auth = await authorizedUser();
  if (auth.error) return auth.error;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== requestUrl.origin) || (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))) return Response.json({ error: "Cross-origin lab requests are not allowed." }, { status: 403 });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) return Response.json({ error: "Lab requests must use JSON." }, { status: 415 });
  const raw = await request.text();
  if (raw.length > 12_000) return Response.json({ error: "Observation is too large." }, { status: 413 });
  let input: { reportId?: unknown; platform?: unknown; promptKey?: unknown; promptText?: unknown; resultState?: unknown; sourceUrl?: unknown; notes?: unknown };
  try { input = JSON.parse(raw) as typeof input; } catch { return Response.json({ error: "Invalid observation." }, { status: 400 }); }
  if (typeof input.reportId !== "string" || !/^[a-f0-9]{32}$/.test(input.reportId) || typeof input.platform !== "string" || !platforms.has(input.platform) || typeof input.promptKey !== "string" || !/^[a-z0-9-]{1,40}$/.test(input.promptKey) || typeof input.promptText !== "string" || input.promptText.length > 500 || typeof input.resultState !== "string" || !states.has(input.resultState as ObservationState)) return Response.json({ error: "Invalid observation." }, { status: 400 });
  const report = await getReport(auth.user.email, input.reportId);
  if (!report) return Response.json({ error: "Report not found." }, { status: 404 });
  let sourceUrl = "";
  if (typeof input.sourceUrl === "string" && input.sourceUrl.trim()) {
    try { const parsed = new URL(input.sourceUrl); if (!/^https?:$/.test(parsed.protocol)) throw new Error(); sourceUrl = parsed.toString(); } catch { return Response.json({ error: "Source URL must be public HTTP or HTTPS." }, { status: 400 }); }
  }
  const notes = typeof input.notes === "string" ? input.notes.slice(0, 1000) : "";
  const id = await saveObservation(auth.user.email, { reportId: input.reportId, platform: input.platform, promptKey: input.promptKey, promptText: input.promptText, resultState: input.resultState as ObservationState, sourceUrl, notes });
  return Response.json({ id, updatedAt: Date.now() }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
