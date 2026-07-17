import { authorizedUser } from "../lab/route";
import { getReport, ownerKey } from "../../../lib/reports/store";
import { visibilityPromptPack } from "../../../lib/lab/prompts";
import { countRecentAutomatedRuns, saveAutomatedRun } from "../../../lib/lab/store";
import { openAIAvailability, runOpenAIVisibilityTest } from "../../../lib/providers/openai";
import { kimiAvailability, runKimiCitationTest } from "../../../lib/providers/kimi";

export async function POST(request: Request) {
  const auth = await authorizedUser();
  if (auth.error) return auth.error;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== requestUrl.origin) || (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))) return Response.json({ error: "Cross-origin provider runs are not allowed." }, { status: 403 });
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) return Response.json({ error: "Provider runs must use JSON." }, { status: 415 });
  const payload = await request.json().catch(() => null) as { reportId?: unknown; promptKey?: unknown; provider?: unknown } | null;
  if (typeof payload?.reportId !== "string" || !/^[a-f0-9]{32}$/.test(payload.reportId) || typeof payload.promptKey !== "string" || (payload.provider !== "openai" && payload.provider !== "kimi")) return Response.json({ error: "Invalid provider run." }, { status: 400 });
  const availability = payload.provider === "openai" ? await openAIAvailability() : await kimiAvailability();
  if (!availability.connected) return Response.json({ error: `${availability.name} credentials are not configured.` }, { status: 503 });
  if (await countRecentAutomatedRuns(auth.user.email) >= 10) return Response.json({ error: "Daily automated-run limit reached." }, { status: 429, headers: { "Retry-After": "3600" } });
  const report = await getReport(auth.user.email, payload.reportId);
  if (!report) return Response.json({ error: "Report not found." }, { status: 404 });
  const prompt = visibilityPromptPack(report).find((item) => item.key === payload.promptKey);
  if (!prompt) return Response.json({ error: "Unknown prompt." }, { status: 400 });
  try {
    const run = payload.provider === "openai"
      ? await runOpenAIVisibilityTest(report, prompt.text, (await ownerKey(auth.user.email)).slice(0, 64))
      : await runKimiCitationTest(report, prompt.text);
    const stored = await saveAutomatedRun(auth.user.email, { reportId: payload.reportId, provider: run.provider, model: run.model, promptKey: prompt.key, promptText: prompt.text, answerText: run.answer, citations: run.citations, targetCited: run.targetCited });
    return Response.json({ run: { ...run, ...stored } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const notConfigured = error instanceof Error && error.message === "OPENAI_PROVIDER_NOT_CONFIGURED";
    const kimiNotConfigured = error instanceof Error && error.message === "KIMI_PROVIDER_NOT_CONFIGURED";
    return Response.json({ error: notConfigured || kimiNotConfigured ? `${availability.name} credentials are not configured.` : "The provider run failed without producing evidence." }, { status: notConfigured || kimiNotConfigured ? 503 : 502 });
  }
}
