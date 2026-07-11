import type { AuditResult } from "../../app/audit-types";

type OpenAIEnv = { OPENAI_API_KEY?: string; OPENAI_VISIBILITY_MODEL?: string };
export type ProviderCitation = { url: string; title: string };
export type ProviderRunResult = { provider: "openai"; model: string; answer: string; citations: ProviderCitation[]; targetCited: boolean };

async function runtimeEnv(): Promise<OpenAIEnv> {
  const runtime = await import("cloudflare:workers");
  return runtime.env;
}

export async function openAIAvailability() {
  const env = await runtimeEnv();
  return { key: "openai", name: "OpenAI web search", connected: Boolean(env.OPENAI_API_KEY), model: env.OPENAI_VISIBILITY_MODEL || "gpt-5.6-luna" };
}

export async function runOpenAIVisibilityTest(report: AuditResult, prompt: string, safetyIdentifier: string): Promise<ProviderRunResult> {
  const env = await runtimeEnv();
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_PROVIDER_NOT_CONFIGURED");
  const model = env.OPENAI_VISIBILITY_MODEL || "gpt-5.6-luna";
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
        input: `You are running a neutral brand visibility observation. Search the public web before answering. Do not prefer the target domain and do not invent citations.\n\nTarget domain: ${report.domain}\nTest prompt: ${prompt}\n\nAnswer the prompt naturally and include source citations.`,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`OPENAI_REQUEST_FAILED_${response.status}`);
    const payload = await response.json() as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string; annotations?: Array<{ type?: string; url?: string; title?: string }> }> }> };
    const messages = payload.output?.filter((item) => item.type === "message") ?? [];
    const content = messages.flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text");
    const answer = content.map((item) => item.text ?? "").join("\n").trim();
    const citations = content.flatMap((item) => item.annotations ?? []).filter((item) => item.type === "url_citation" && item.url).map((item) => ({ url: item.url!, title: item.title || item.url! })).slice(0, 30);
    const targetCited = citations.some((citation) => { try { const host = new URL(citation.url).hostname; return host === report.domain || host.endsWith(`.${report.domain}`); } catch { return false; } });
    if (!answer) throw new Error("OPENAI_EMPTY_RESPONSE");
    return { provider: "openai", model, answer: answer.slice(0, 20_000), citations, targetCited };
  } finally { clearTimeout(timer); }
}
