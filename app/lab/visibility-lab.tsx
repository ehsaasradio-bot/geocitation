"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AuditResult } from "../audit-types";
import { visibilityPromptPack } from "../../lib/lab/prompts";

const platforms = [
  { key: "chatgpt", name: "ChatGPT" },
  { key: "perplexity", name: "Perplexity" },
  { key: "gemini", name: "Gemini" },
  { key: "claude", name: "Claude" },
  { key: "copilot", name: "Copilot" },
];

type State = "not_run" | "cited" | "mentioned" | "not_found";
type Observation = { id: string; platform: string; promptKey: string; promptText: string; resultState: State; sourceUrl?: string; notes?: string; updatedAt: number };
type Provider = { key: string; name: string; connected: boolean; model?: string };
type AutomatedRun = { id: string; provider: string; model: string; answer: string; citations: Array<{ url: string; title: string }>; targetCited: boolean };
type BillingStatus = { fullAudit: boolean; orders?: Array<{ id: string; reference: string; status: string; statusDetail: string }> };

export function VisibilityLab({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<AuditResult | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [automatedRuns, setAutomatedRuns] = useState<Record<string, AutomatedRun>>({});
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const prompts = useMemo(() => report ? visibilityPromptPack(report) : [], [report]);

  useEffect(() => {
    if (!reportId) return;
    void fetch(`/api/lab?reportId=${encodeURIComponent(reportId)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 402) throw new Error("Activate the Full Audit sandbox plan before opening the visibility lab.");
        if (!response.ok) throw new Error("The selected report could not be loaded.");
        return response.json() as Promise<{ report: AuditResult; observations: Observation[]; providers: Provider[] }>;
      })
      .then((payload) => { setReport(payload.report); setObservations(payload.observations); setProviders(payload.providers); })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "The lab could not be loaded."));
  }, [reportId]);

  useEffect(() => {
    void fetch("/api/billing/status", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<BillingStatus> : Promise.reject(new Error()))
      .then(setBilling)
      .catch(() => undefined);
  }, []);

  const observationFor = (platform: string, promptKey: string) => observations.find((item) => item.platform === platform && item.promptKey === promptKey);

  const save = async (platform: string, promptKey: string, promptText: string, resultState: State) => {
    const key = `${platform}:${promptKey}`;
    setSaving(key);
    try {
      const response = await fetch("/api/lab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId, platform, promptKey, promptText, resultState }) });
      if (!response.ok) throw new Error();
      const payload = await response.json() as { id: string; updatedAt: number };
      const next: Observation = { id: payload.id, platform, promptKey, promptText, resultState, updatedAt: payload.updatedAt };
      setObservations((current) => [...current.filter((item) => !(item.platform === platform && item.promptKey === promptKey)), next]);
    } catch { setError("The observation could not be saved."); } finally { setSaving(""); }
  };

  const runAutomatically = async (promptKey: string) => {
    const key = `openai:${promptKey}`;
    setSaving(key);
    setError("");
    try {
      const response = await fetch("/api/lab-run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId, promptKey, provider: "openai" }) });
      const payload = await response.json() as { run?: AutomatedRun; error?: string };
      if (!response.ok || !payload.run) throw new Error(payload.error || "The provider run failed.");
      setAutomatedRuns((current) => ({ ...current, [promptKey]: payload.run! }));
    } catch (runError) { setError(runError instanceof Error ? runError.message : "The provider run failed."); } finally { setSaving(""); }
  };

  if (!reportId) return <section className="lab-empty"><p className="lead-line light">VISIBILITY LAB / NO REPORT</p><h1>Choose evidence before testing prompts.</h1><p>Open a saved report from your account, then launch its visibility lab.</p><Link href="/account">Choose a report ↗</Link></section>;
  if (error) return <section className="lab-empty"><p className="lead-line light">VISIBILITY LAB / ACCESS</p><h1>The test bench is not ready.</h1><p>{error}</p><Link href="/checkout?plan=full-audit">Open sandbox access ↗</Link></section>;
  if (!report) return <section className="lab-loading"><i className="live-dot" /><span>ASSEMBLING MODEL TEST BENCH</span></section>;

  const completed = observations.filter((item) => item.resultState !== "not_run").length;
  const cited = observations.filter((item) => item.resultState === "cited").length;
  const latestOrder = billing?.orders?.[0] ?? null;
  return <>
    <section className="lab-hero"><p className="lead-line light">PREMIUM LAB / MANUAL EVIDENCE</p><h1>Test the answers.<br /><span>Record the proof.</span></h1><p>Run the same prompts across five answer engines, then record what they actually returned. Provider APIs are not connected, so SIGNAL° never fabricates a model result.</p><div><strong>{completed}<small>/15 observed</small></strong><strong>{cited}<small>citations found</small></strong><Link href={`/report?id=${reportId}`}>Back to report ↗</Link></div></section>
    <section className="premium-state-strip">
      <div><span>ENTITLEMENT</span><strong>{billing?.fullAudit ? "FULL AUDIT ACTIVE" : "NOT ACTIVE"}</strong><p>{billing?.fullAudit ? "This lab is unlocked through a confirmed sandbox premium order tied to your account." : "This lab requires a confirmed Full Audit sandbox order."}</p></div>
      <div><span>LATEST SANDBOX ORDER</span><strong>{latestOrder?.reference ?? "NONE"}</strong><p>{latestOrder?.statusDetail ?? "No sandbox receipt has been created yet."}</p></div>
      <div>{latestOrder ? <Link href={`/account/orders/${latestOrder.id}`}>Open receipt ↗</Link> : <Link href={`/checkout?plan=full-audit&report=${reportId}&next=lab`}>Open sandbox access ↗</Link>}</div>
    </section>
    <section className="lab-notice"><strong>{providers.some((provider) => provider.connected) ? "HYBRID TEST MODE" : "MANUAL TEST MODE"}</strong><p>{providers.some((provider) => provider.connected) ? "Connected providers can run automatically. All other platform results remain manual observations." : "Copy a prompt into each provider, inspect its answer and sources, then record the outcome below. No provider credential is currently connected."}</p></section>
    <section className="provider-status" aria-label="Provider connection status">{providers.map((provider) => <div className={provider.connected ? "is-connected" : "is-disconnected"} key={provider.key}><i /><span>{provider.name}</span><strong>{provider.connected ? provider.model || "CONNECTED" : "DISCONNECTED"}</strong></div>)}</section>
    {providers.find((provider) => provider.key === "openai")?.connected && <section className="automated-runner"><div><p className="lead-line light">OPENAI / AUTOMATED EVIDENCE</p><h2>Run a sourced <span>web observation.</span></h2><p>Each run uses OpenAI Responses web search, stores the returned answer and citations, and checks whether the audited domain appears among cited sources. Daily limit: 10 runs.</p></div><div>{prompts.map((prompt) => { const run = automatedRuns[prompt.key]; return <article key={prompt.key}><span>{prompt.label}</span><p>{prompt.text}</p><button type="button" disabled={saving === `openai:${prompt.key}`} onClick={() => void runAutomatically(prompt.key)}>{saving === `openai:${prompt.key}` ? "Running…" : "Run with OpenAI"} ↗</button>{run && <div className="automated-result"><strong>{run.targetCited ? "TARGET CITED" : "TARGET NOT CITED"}</strong><p>{run.answer}</p><ul>{run.citations.map((citation) => <li key={citation.url}><a href={citation.url} target="_blank" rel="noreferrer">{citation.title} ↗</a></li>)}</ul></div>}</article>; })}</div></section>}
    <section className="lab-matrix"><div className="lab-matrix-head"><span>PLATFORM</span>{prompts.map((prompt) => <span key={prompt.key}>{prompt.label}</span>)}</div>{platforms.map((platform) => <article key={platform.key}><div><i />{platform.name}<small>{platform.key === "chatgpt" && providers.find((provider) => provider.key === "openai")?.connected ? "OPENAI WEB SEARCH CONNECTED" : "API NOT CONNECTED"}</small></div>{prompts.map((prompt) => { const observation = observationFor(platform.key, prompt.key); const state = observation?.resultState ?? "not_run"; const key = `${platform.key}:${prompt.key}`; return <div className={`lab-test state-${state}`} key={prompt.key}><button type="button" onClick={() => void navigator.clipboard.writeText(prompt.text)}>Copy prompt</button><p>{prompt.text}</p><label><span>Observed result</span><select value={state} disabled={saving === key} onChange={(event) => void save(platform.key, prompt.key, prompt.text, event.target.value as State)}><option value="not_run">Not run</option><option value="cited">Cited with source</option><option value="mentioned">Mentioned, no citation</option><option value="not_found">Not found</option></select></label></div>; })}</article>)}</section>
  </>;
}
