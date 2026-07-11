"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AuditResult } from "../audit-types";

const platforms = [
  { key: "chatgpt", name: "ChatGPT" },
  { key: "perplexity", name: "Perplexity" },
  { key: "gemini", name: "Gemini" },
  { key: "claude", name: "Claude" },
  { key: "copilot", name: "Copilot" },
];

type State = "not_run" | "cited" | "mentioned" | "not_found";
type Observation = { id: string; platform: string; promptKey: string; promptText: string; resultState: State; sourceUrl?: string; notes?: string; updatedAt: number };

function promptPack(report: AuditResult) {
  const domain = report.domain;
  const topic = report.pages.find((page) => page.title)?.title || domain;
  return [
    { key: "brand-knowledge", label: "Brand knowledge", text: `What is ${domain}, what does it offer, and which sources support the answer?` },
    { key: "category-recommendation", label: "Category recommendation", text: `What are trustworthy alternatives or providers related to ${topic}? Include source links.` },
    { key: "evidence-question", label: "Evidence retrieval", text: `Using public evidence, summarize the expertise and trust signals available on ${domain}. Cite the exact pages used.` },
  ];
}

export function VisibilityLab({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<AuditResult | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const prompts = useMemo(() => report ? promptPack(report) : [], [report]);

  useEffect(() => {
    if (!reportId) return;
    void fetch(`/api/lab?reportId=${encodeURIComponent(reportId)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 402) throw new Error("Activate the Full Audit sandbox plan before opening the visibility lab.");
        if (!response.ok) throw new Error("The selected report could not be loaded.");
        return response.json() as Promise<{ report: AuditResult; observations: Observation[] }>;
      })
      .then((payload) => { setReport(payload.report); setObservations(payload.observations); })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "The lab could not be loaded."));
  }, [reportId]);

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

  if (!reportId) return <section className="lab-empty"><p className="lead-line light">VISIBILITY LAB / NO REPORT</p><h1>Choose evidence before testing prompts.</h1><p>Open a saved report from your account, then launch its visibility lab.</p><Link href="/account">Choose a report ↗</Link></section>;
  if (error) return <section className="lab-empty"><p className="lead-line light">VISIBILITY LAB / ACCESS</p><h1>The test bench is not ready.</h1><p>{error}</p><Link href="/checkout?plan=full-audit">Open sandbox access ↗</Link></section>;
  if (!report) return <section className="lab-loading"><i className="live-dot" /><span>ASSEMBLING MODEL TEST BENCH</span></section>;

  const completed = observations.filter((item) => item.resultState !== "not_run").length;
  const cited = observations.filter((item) => item.resultState === "cited").length;
  return <>
    <section className="lab-hero"><p className="lead-line light">PREMIUM LAB / MANUAL EVIDENCE</p><h1>Test the answers.<br /><span>Record the proof.</span></h1><p>Run the same prompts across five answer engines, then record what they actually returned. Provider APIs are not connected, so SIGNAL° never fabricates a model result.</p><div><strong>{completed}<small>/15 observed</small></strong><strong>{cited}<small>citations found</small></strong><Link href={`/report?id=${reportId}`}>Back to report ↗</Link></div></section>
    <section className="lab-notice"><strong>MANUAL TEST MODE</strong><p>Copy a prompt into each provider, inspect its answer and sources, then record the outcome below. Results are observations you provide—not automated claims.</p></section>
    <section className="lab-matrix"><div className="lab-matrix-head"><span>PLATFORM</span>{prompts.map((prompt) => <span key={prompt.key}>{prompt.label}</span>)}</div>{platforms.map((platform) => <article key={platform.key}><div><i />{platform.name}<small>API NOT CONNECTED</small></div>{prompts.map((prompt) => { const observation = observationFor(platform.key, prompt.key); const state = observation?.resultState ?? "not_run"; const key = `${platform.key}:${prompt.key}`; return <div className={`lab-test state-${state}`} key={prompt.key}><button type="button" onClick={() => void navigator.clipboard.writeText(prompt.text)}>Copy prompt</button><p>{prompt.text}</p><label><span>Observed result</span><select value={state} disabled={saving === key} onChange={(event) => void save(platform.key, prompt.key, prompt.text, event.target.value as State)}><option value="not_run">Not run</option><option value="cited">Cited with source</option><option value="mentioned">Mentioned, no citation</option><option value="not_found">Not found</option></select></label></div>; })}</article>)}</section>
  </>;
}
