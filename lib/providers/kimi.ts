import type { AuditResult } from "../../app/audit-types";
import type { ProviderCitation } from "./openai";

type KimiEnv = { KIMI_API_KEY?: string; KIMI_VISIBILITY_MODEL?: string };
export type KimiRunResult = { provider: "kimi"; model: string; answer: string; citations: ProviderCitation[]; targetCited: boolean };

const DEFAULT_KIMI_VISIBILITY_MODEL = "kimi-k3";
const KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const MAX_SOURCE_CHARS = 18_000;

async function runtimeEnv(): Promise<KimiEnv> {
  const runtime = await import("cloudflare:workers");
  return runtime.env;
}

function normalizeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sourcePack(report: AuditResult) {
  const sourceLines = [
    `AUDITED DOMAIN: ${report.domain}`,
    `AUDITED TARGET: ${report.target}`,
    `OVERALL SCORE: ${report.score}/100 (${report.grade})`,
    "",
    "RESOURCES:",
    ...report.resources.map((resource) => `- ${resource.label}: ${resource.url} | detected=${resource.detected} | status=${resource.status ?? "unknown"} | ${resource.detail}`),
    "",
    "FINDINGS:",
    ...report.findings.map((finding) => `- ${finding.label}: ${finding.value}. Evidence: ${finding.evidence}. Recommended action: ${finding.action}`),
    "",
    "PAGES:",
    ...report.pages.map((page) => [
      `URL: ${page.url}`,
      `Title: ${page.title || "untitled"}`,
      `Description: ${page.description || "missing"}`,
      `Words: ${page.words}; H1 count: ${page.h1Count}; Answer blocks: ${page.answerBlocks}; Schema: ${page.schemaTypes.join(", ") || "none"}`,
    ].join("\n")),
  ].join("\n");
  return sourceLines.slice(0, MAX_SOURCE_CHARS);
}

function extractKnownCitations(answer: string, report: AuditResult): ProviderCitation[] {
  const urls = new Map<string, ProviderCitation>();
  for (const page of report.pages) {
    if (answer.includes(page.url)) urls.set(page.url, { url: page.url, title: page.title || page.url });
  }
  for (const resource of report.resources) {
    if (answer.includes(resource.url)) urls.set(resource.url, { url: resource.url, title: resource.label });
  }
  return Array.from(urls.values()).slice(0, 12);
}

export async function kimiAvailability() {
  const env = await runtimeEnv();
  return { key: "kimi", name: "Kimi Citation", connected: Boolean(env.KIMI_API_KEY), model: env.KIMI_VISIBILITY_MODEL || DEFAULT_KIMI_VISIBILITY_MODEL };
}

export async function runKimiCitationTest(report: AuditResult, prompt: string): Promise<KimiRunResult> {
  const env = await runtimeEnv();
  if (!env.KIMI_API_KEY) throw new Error("KIMI_PROVIDER_NOT_CONFIGURED");
  const model = env.KIMI_VISIBILITY_MODEL || DEFAULT_KIMI_VISIBILITY_MODEL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.KIMI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 650,
        messages: [
          {
            role: "system",
            content: [
              "You are a citation-readiness analyst.",
              "You cannot browse the web.",
              "Use only the provided audit evidence pack.",
              "If evidence is missing, say so clearly.",
              "When citing a source, include the exact source URL from the pack.",
              "Return concise, executive-readable analysis.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Test prompt: ${prompt}`,
              "",
              "Audit evidence pack:",
              sourcePack(report),
              "",
              "Return:",
              "1. Whether the audited domain is citation-ready for this prompt.",
              "2. The strongest citeable facts and their exact URLs.",
              "3. Missing proof or ambiguity.",
              "4. A 0-100 citation-readiness score for this prompt.",
            ].join("\n"),
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`KIMI_REQUEST_FAILED_${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const answer = payload.choices?.map((choice) => choice.message?.content ?? "").join("\n").trim() ?? "";
    if (!answer) throw new Error("KIMI_EMPTY_RESPONSE");
    const citations = extractKnownCitations(answer, report);
    const targetHost = normalizeHost(report.target) || report.domain;
    const targetCited = citations.some((citation) => {
      const host = normalizeHost(citation.url);
      return host === targetHost || host === report.domain || host.endsWith(`.${report.domain}`);
    });
    return { provider: "kimi", model, answer: answer.slice(0, 8_000), citations, targetCited };
  } finally {
    clearTimeout(timer);
  }
}
