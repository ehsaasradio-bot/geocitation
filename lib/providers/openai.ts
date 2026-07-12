import type { AuditResult } from "../../app/audit-types";

type OpenAIEnv = { OPENAI_API_KEY?: string; OPENAI_VISIBILITY_MODEL?: string };
export type ProviderCitation = { url: string; title: string };
export type ProviderRunResult = { provider: "openai"; model: string; answer: string; citations: ProviderCitation[]; targetCited: boolean };

const DEFAULT_OPENAI_VISIBILITY_MODEL = "gpt-5-mini";
const DEFAULT_MAX_OUTPUT_TOKENS = 420;

async function runtimeEnv(): Promise<OpenAIEnv> {
  const runtime = await import("cloudflare:workers");
  return runtime.env;
}

export async function openAIAvailability() {
  const env = await runtimeEnv();
  return { key: "openai", name: "OpenAI web search", connected: Boolean(env.OPENAI_API_KEY), model: env.OPENAI_VISIBILITY_MODEL || DEFAULT_OPENAI_VISIBILITY_MODEL };
}

export async function runOpenAIVisibilityTest(report: AuditResult, prompt: string, safetyIdentifier: string): Promise<ProviderRunResult> {
  const env = await runtimeEnv();
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_PROVIDER_NOT_CONFIGURED");
  const model = env.OPENAI_VISIBILITY_MODEL || DEFAULT_OPENAI_VISIBILITY_MODEL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        tools: [{ type: "web_search" }],
        safety_identifier: safetyIdentifier,
        reasoning: { effort: "minimal" },
        text: { verbosity: "low" },
        max_output_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
        input: `Run a neutral brand visibility observation.\nSearch the public web before answering.\nDo not prefer the target domain.\nDo not invent citations.\nKeep the answer concise and source-backed.\n\nTarget domain: ${report.domain}\nTest prompt: ${prompt}`,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`OPENAI_REQUEST_FAILED_${response.status}`);
    const payload = await response.json() as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string; annotations?: Array<{ type?: string; url?: string; title?: string }> }> }> };
    const messages = payload.output?.filter((item) => item.type === "message") ?? [];
    const content = messages.flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text");
    const answer = content.map((item) => item.text ?? "").join("\n").trim();
    const citations = Array.from(
      new Map(
        content
          .flatMap((item) => item.annotations ?? [])
          .filter((item) => item.type === "url_citation" && item.url)
          .map((item) => [item.url!, { url: item.url!, title: item.title || item.url! }]),
      ).values(),
    ).slice(0, 12);
    const targetCited = citations.some((citation) => { try { const host = new URL(citation.url).hostname; return host === report.domain || host.endsWith(`.${report.domain}`); } catch { return false; } });
    if (!answer) throw new Error("OPENAI_EMPTY_RESPONSE");
    return { provider: "openai", model, answer: answer.slice(0, 8_000), citations, targetCited };
  } finally { clearTimeout(timer); }
}
