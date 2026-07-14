"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AUDIT_STORAGE_KEY, type AuditResult, type AuditTone } from "./audit-types";

const scanStages = [
  { label: "Establishing secure crawl", meta: "TLS + headers" },
  { label: "Discovering site architecture", meta: "Mapping internal URLs" },
  { label: "Testing AI crawler access", meta: "14 agents checked" },
  { label: "Extracting entities & schema", meta: "Parsing JSON-LD" },
  { label: "Reading answer passages", meta: "Scoring extractability" },
  { label: "Evaluating answer-engine signals", meta: "43 deterministic checks" },
  { label: "Assembling visibility fingerprint", meta: "Evidence ready" },
];

const signalCards = [
  {
    index: "01",
    title: "Crawler access",
    copy: "See which AI agents can reach your knowledge—and the exact rule blocking those that cannot.",
    stat: "14",
    unit: "agents",
  },
  {
    index: "02",
    title: "Passage citability",
    copy: "Find the passages an answer engine can lift cleanly, with evidence attached to every score.",
    stat: "186",
    unit: "blocks",
  },
  {
    index: "03",
    title: "Entity confidence",
    copy: "Map the people, products, places and proof that make your brand understandable to machines.",
    stat: "24",
    unit: "entities",
  },
];

const landingFaqs = [
  {
    question: "What does AI Signal check?",
    answer: "It checks whether answer engines can discover, crawl, understand, trust and cite your website from public signals.",
  },
  {
    question: "Is this different from SEO?",
    answer: "Yes. SEO optimizes for search rankings. AI Signal focuses on whether AI systems can read your pages and use them as answer-ready evidence.",
  },
  {
    question: "Do you guarantee citations?",
    answer: "No honest product can guarantee AI citations. We show the blockers, missing proof and fixes that increase citation readiness.",
  },
  {
    question: "What happens after the free score?",
    answer: "You can inspect the evidence report during this private beta. The sandbox now lets you rehearse deeper platform tests and the 90-day plan safely before real payments go live.",
  },
];

type ScanGraphProps = {
  phase: number;
  running: boolean;
  complete: boolean;
  domain: string;
  pageNames: string[];
  nodeTones: AuditTone[];
};

function AgentCount() {
  const [count, setCount] = useState(94);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nextCount = () => setCount((current) => {
      let next = Math.floor(Math.random() * 11) + 90;
      if (next === current) next = next === 100 ? 90 : next + 1;
      return next;
    });

    const timer = window.setInterval(nextCount, 950);
    return () => window.clearInterval(timer);
  }, []);

  return <strong className="agent-count">{count}%</strong>;
}

function ScanGraph({ phase, running, complete, domain, pageNames, nodeTones }: ScanGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase, running, complete, domain, pageNames, nodeTones });

  useEffect(() => {
    stateRef.current = { phase, running, complete, domain, pageNames, nodeTones };
  }, [phase, running, complete, domain, pageNames, nodeTones]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let pointerX = 0;
    let pointerY = 0;

    const pages = [
      { x: 0.12, y: 0.22, name: "DISCOVERY", at: 1, status: "good" },
      { x: 0.2, y: 0.48, name: "ARCHITECTURE", at: 1, status: "good" },
      { x: 0.11, y: 0.72, name: "CRAWLER POLICY", at: 2, status: "warn" },
      { x: 0.33, y: 0.12, name: "MACHINE FILES", at: 2, status: "good" },
      { x: 0.34, y: 0.82, name: "ENTITY TRUST", at: 3, status: "bad" },
      { x: 0.48, y: 0.23, name: "SCHEMA", at: 3, status: "warn" },
      { x: 0.5, y: 0.76, name: "ANSWER BLOCKS", at: 4, status: "good" },
    ];

    const engines = [
      { x: 0.82, y: 0.17, name: "GPT" },
      { x: 0.9, y: 0.36, name: "PERPLEXITY" },
      { x: 0.84, y: 0.58, name: "GEMINI" },
      { x: 0.91, y: 0.78, name: "GOOGLE AI" },
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    };

    const drawLine = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      active: boolean,
      time: number,
      offset: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = active ? "rgba(201,255,71,.28)" : "rgba(255,255,255,.075)";
      ctx.lineWidth = active ? 1.2 : 0.7;
      ctx.stroke();

      if (active && !reduced) {
        const p = (time * 0.00022 + offset) % 1;
        const x = ax + (bx - ax) * p;
        const y = ay + (by - ay) * p;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 11);
        glow.addColorStop(0, "rgba(201,255,71,.92)");
        glow.addColorStop(1, "rgba(201,255,71,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c9ff47";
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const render = (time: number) => {
      const state = stateRef.current;
      const px = pointerX * 8;
      const py = pointerY * 8;
      const cx = width * 0.59 + px;
      const cy = height * 0.48 + py;

      ctx.clearRect(0, 0, width, height);

      const ambient = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.48);
      ambient.addColorStop(0, state.running ? "rgba(201,255,71,.10)" : "rgba(95,106,255,.08)");
      ambient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255,255,255,.045)";
      ctx.lineWidth = 0.7;
      for (let x = 20; x < width; x += 34) {
        ctx.beginPath();
        ctx.moveTo(x + px * 0.16, 0);
        ctx.lineTo(x + px * 0.16, height);
        ctx.stroke();
      }
      for (let y = 20; y < height; y += 34) {
        ctx.beginPath();
        ctx.moveTo(0, y + py * 0.16);
        ctx.lineTo(width, y + py * 0.16);
        ctx.stroke();
      }

      pages.forEach((node, index) => {
        const nx = node.x * width + px * (0.25 + index * 0.02);
        const ny = node.y * height + py * (0.25 + index * 0.02);
        const active = state.complete || (state.running && state.phase >= node.at);
        drawLine(nx, ny, cx, cy, active, time, index * 0.13);
      });

      engines.forEach((engine, index) => {
        const ex = engine.x * width + px * 0.35;
        const ey = engine.y * height + py * 0.35;
        const active = state.complete || (state.running && state.phase >= 5);
        drawLine(cx, cy, ex, ey, active, time, 0.2 + index * 0.21);
      });

      if (state.running && !state.complete) {
        const scanX = ((time * 0.00016) % 1) * width;
        const ray = ctx.createLinearGradient(scanX - 70, 0, scanX + 20, 0);
        ray.addColorStop(0, "rgba(201,255,71,0)");
        ray.addColorStop(0.7, "rgba(201,255,71,.035)");
        ray.addColorStop(1, "rgba(201,255,71,.28)");
        ctx.fillStyle = ray;
        ctx.fillRect(scanX - 70, 0, 90, height);
        ctx.fillStyle = "rgba(201,255,71,.62)";
        ctx.fillRect(scanX, 0, 1, height);
      }

      pages.forEach((node, index) => {
        const nx = node.x * width + px * (0.25 + index * 0.02);
        const ny = node.y * height + py * (0.25 + index * 0.02);
        const revealed = state.complete || (state.running && state.phase >= node.at);
        const pulse = 1 + Math.sin(time * 0.003 + index) * 0.12;
        const status = state.nodeTones[index % Math.max(1, state.nodeTones.length)] ?? node.status;
        const color = !revealed
          ? "rgba(255,255,255,.22)"
          : status === "good"
            ? "#c9ff47"
            : status === "warn"
              ? "#ffca5c"
              : "#ff6b61";

        ctx.fillStyle = "rgba(7,9,8,.94)";
        ctx.strokeStyle = color;
        ctx.lineWidth = revealed ? 1.4 : 0.7;
        ctx.beginPath();
        ctx.arc(nx, ny, (revealed ? 6.5 : 4) * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (revealed) {
          ctx.font = "500 9px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.fillStyle = "rgba(244,241,232,.62)";
          ctx.textAlign = "center";
          ctx.fillText((state.pageNames[index] ?? node.name).slice(0, 18).toUpperCase(), nx, ny + 20);
        }
      });

      engines.forEach((engine) => {
        const ex = engine.x * width + px * 0.35;
        const ey = engine.y * height + py * 0.35;
        const reached = state.complete || (state.running && state.phase >= 5);
        ctx.strokeStyle = reached ? "rgba(201,255,71,.72)" : "rgba(255,255,255,.18)";
        ctx.fillStyle = reached ? "rgba(201,255,71,.08)" : "rgba(7,9,8,.92)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ex, ey, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = "600 8px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = reached ? "#c9ff47" : "rgba(244,241,232,.42)";
        ctx.textAlign = "center";
        ctx.fillText(engine.name, ex, ey + 28);
      });

      const ring = 28 + (reduced ? 0 : ((time * 0.025) % 18));
      ctx.strokeStyle = state.complete ? "rgba(201,255,71,.68)" : "rgba(244,241,232,.38)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = state.running ? `rgba(201,255,71,${Math.max(0, 0.38 - (ring - 28) / 50)})` : "rgba(95,106,255,.18)";
      ctx.beginPath();
      ctx.arc(cx, cy, ring, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = state.complete ? "#c9ff47" : "#f4f1e8";
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(244,241,232,.78)";
      const shortDomain = state.domain.replace(/^www\./, "").slice(0, 25);
      ctx.fillText(shortDomain.toUpperCase(), cx, cy + 42);

      if (!reduced) frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    render(0);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="scan-canvas" aria-hidden="true" />;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [domain, setDomain] = useState("yourwebsite.com");
  const [phase, setPhase] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [stageLabel, setStageLabel] = useState("");
  const [stageMeta, setStageMeta] = useState("");
  const [auditError, setAuditError] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "signin" | "error">("idle");
  const [savedReportId, setSavedReportId] = useState("");
  const scanAbortRef = useRef<AbortController | null>(null);
  const runTokenRef = useRef(0);

  useEffect(() => () => scanAbortRef.current?.abort(), []);

  useEffect(() => {
    if (!result) return;
    try {
      window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(result));
    } catch {
      // The live result still works when browser storage is unavailable.
    }
    void fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    }).then(async (response) => {
      if (response.status === 401) {
        setSaveState("signin");
        return;
      }
      if (!response.ok) throw new Error("save failed");
      const payload = await response.json() as { id: string };
      setSavedReportId(payload.id);
      setSaveState("saved");
    }).catch(() => setSaveState("error"));
  }, [result]);

  const startScan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    let normalized = value;
    try {
      normalized = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname;
    } catch {
      normalized = value.replace(/^https?:\/\//i, "").split("/")[0] || "yourwebsite.com";
    }

    setDomain(normalized);
    setComplete(false);
    setPhase(0);
    setProgress(3);
    setResult(null);
    setSaveState("idle");
    setSavedReportId("");
    setAuditError("");
    setStageLabel(scanStages[0].label);
    setStageMeta(`Connecting to ${normalized}`);
    setRunning(true);

    window.requestAnimationFrame(() => {
      document.getElementById("audit-experience")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    scanAbortRef.current?.abort();
    const scanController = new AbortController();
    scanAbortRef.current = scanController;
    const runToken = runTokenRef.current + 1;
    runTokenRef.current = runToken;
    let receivedResult = false;
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ url: value }),
        signal: scanController.signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "The audit could not be started." }));
        throw new Error(typeof payload.error === "string" ? payload.error : "The audit could not be started.");
      }
      if (!response.body) throw new Error("The audit stream was unavailable.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        buffer += decoder.decode(chunk, { stream: !done });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          if (runToken !== runTokenRef.current) return;
          if (!block.trim()) continue;
          let eventName = "message";
          const dataLines: string[] = [];
          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
          }
          if (!dataLines.length) continue;
          const payload = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;

          if (eventName === "progress") {
            setPhase(typeof payload.phase === "number" ? payload.phase : 0);
            setProgress(typeof payload.progress === "number" ? payload.progress : 0);
            setStageLabel(typeof payload.label === "string" ? payload.label : "Analyzing website");
            setStageMeta(typeof payload.meta === "string" ? payload.meta : "Evidence is arriving");
          }
          if (eventName === "result") {
            const audit = payload as unknown as AuditResult;
            receivedResult = true;
            setSaveState("saving");
            setDomain(audit.domain);
            setResult(audit);
            setPhase(scanStages.length - 1);
            setProgress(100);
            setStageLabel("Visibility fingerprint assembled");
            setStageMeta(`${audit.metrics.signalsChecked} signals · ${audit.metrics.pagesScanned} pages sampled`);
            setComplete(true);
            setRunning(false);
          }
          if (eventName === "error") {
            throw new Error(typeof payload.message === "string" ? payload.message : "The audit could not be completed.");
          }
        }

        if (done) break;
      }

      if (!receivedResult) throw new Error("The website closed the audit before results were ready.");
    } catch (error) {
      if (scanController.signal.aborted || runToken !== runTokenRef.current) return;
      setRunning(false);
      setComplete(false);
      setAuditError(error instanceof Error ? error.message : "The audit could not be completed.");
      setStageLabel("Scan interrupted");
      setStageMeta("Check the address and try again");
    } finally {
      if (runToken === runTokenRef.current) scanAbortRef.current = null;
    }
  };

  const activeStage = scanStages[Math.max(0, phase)];
  const signalCardData = signalCards.map((card, index) => {
    if (!result) return card;
    if (index === 0) return { ...card, stat: String(result.metrics.crawlersAllowed), unit: `of ${result.metrics.crawlersMeasured}` };
    if (index === 1) return { ...card, stat: String(result.metrics.answerBlocks), unit: "blocks" };
    return { ...card, stat: String(result.metrics.entities), unit: "entities" };
  });
  const pageNames = result?.pages.map((page) => {
    try {
      const path = new URL(page.url).pathname;
      return path === "/" ? "home" : path.replace(/^\//, "");
    } catch {
      return "page";
    }
  }) ?? [];
  const nodeTones: AuditTone[] = result?.categories.map((category) => category.score >= 75 ? "good" : category.score >= 50 ? "warn" : "bad") ?? [];

  return (
    <main id="main-content">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Geocitation home">
          <img className="brand-logo" src="/geocitation-logo.png" alt="GEOCITATION" />
        </a>
        <nav aria-label="Main navigation">
          <a href="#method">Method</a>
          <a href="#pricing">Pricing</a>
          <a href="/faq">FAQ</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/account">My reports</a>
        </nav>
        <details className="mobile-menu">
          <summary>Menu</summary>
          <div><a href="#method">Method</a><a href="#pricing">Pricing</a><a href="/faq">FAQ</a><a href="/about">About</a><a href="/contact">Contact</a><a href="/account">My reports</a><a href="#scanner">Run an audit</a></div>
        </details>
        <a className="header-cta" href="#scanner">Run an audit <span>↗</span></a>
      </header>

      <section className="launch-banner" id="top" aria-labelledby="launch-title">
        <div className="banner-atmosphere" aria-hidden="true" />
        <div className="banner-kicker"><span>AI VISIBILITY / 2026</span><span>LIVE READINESS SIGNALS</span></div>
        <div className="signal-planet" aria-hidden="true">
          <i className="planet-orbit orbit-a" />
          <i className="planet-orbit orbit-b" />
          <i className="planet-scan" />
          <b className="planet-node node-a" />
          <b className="planet-node node-b" />
          <b className="planet-node node-c" />
          <span>SIGNAL ACQUISITION</span>
        </div>
        <div className="banner-title">
          <h1 id="launch-title"><span>GEOCITATION</span></h1>
        </div>
        <p className="banner-copy">SEE WHAT AI CAN FIND. FIX WHAT IT CAN’T.</p>
        <h3 className="banner-question">YOUR WEBSITE EXISTS. DOES AI KNOW IT?</h3>
        <div className="banner-actions">
          <a className="banner-button primary" href="#scanner"><span>Test Now</span><i>↗</i></a>
          <a className="banner-button secondary" href="#method"><span>How It Works</span><i>↓</i></a>
        </div>
        <div className="banner-specs" aria-hidden="true">
          <span>REAL-TIME CRAWL</span>
          <span>43 SIGNALS</span>
          <span>14 AI AGENTS</span>
          <span>EVIDENCE LINKED</span>
        </div>
        <div className="banner-coordinate" aria-hidden="true">24.7136° N<br />46.6753° E</div>
      </section>

      <section className="scanner-strip" id="scanner" aria-label="Run an AI visibility scan">
        <form className="audit-form" onSubmit={startScan}>
          <label htmlFor="website-url">Website address</label>
          <div className="input-shell">
            <span className="protocol">https://</span>
            <input
              id="website-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="yourwebsite.com"
              autoComplete="url"
              inputMode="url"
              disabled={running}
              aria-describedby="audit-note"
              required
            />
            <button type="submit" disabled={running}>
              <span>{running ? "Observing" : complete ? "Scan again" : "Reveal my footprint"}</span>
              <b aria-hidden="true">{running ? `${progress}%` : "↗"}</b>
            </button>
          </div>
          <div className="form-note" id="audit-note">
            <span>No account required</span><span>43 signals</span><span>Evidence attached</span><span>Protected limits</span>
          </div>
          {auditError && <p className="audit-error" role="alert"><b>Scan stopped</b>{auditError}</p>}
          {result && <p className="audit-result-note"><b>LIVE CRAWL</b>{result.metrics.pagesScanned} {result.metrics.pagesScanned === 1 ? "page" : "pages"} sampled in {(result.metrics.durationMs / 1000).toFixed(1)}s. Readiness measures signals—not confirmed citations.</p>}
        </form>
      </section>

      {(running || result || auditError) && (
        <section className="audit-experience" id="audit-experience" aria-live="polite" aria-label="Live audit and result">
          <div className={`observatory audit-observatory ${running ? "is-running" : result ? "is-complete" : "has-error"}`}>
            <div className="observatory-head">
              <span>LIVE SIGNAL MAP / {domain.toUpperCase()}</span>
              <span className="system-status"><i />{running ? "AUDIT IN PROGRESS" : result ? "EVIDENCE READY" : "SCAN INTERRUPTED"}</span>
            </div>
            <ScanGraph
              phase={phase}
              running={running}
              complete={complete}
              domain={domain}
              pageNames={pageNames}
              nodeTones={nodeTones}
            />
            <span className="corner-index corner-index-a">A–01 / DISCOVERY</span>
            <span className="corner-index corner-index-b">{String(Math.max(0, phase + 1)).padStart(2, "0")} / 07</span>
            <div className="scan-data">
              <div className="scan-score">
                <span>{result ? "Readiness" : "Progress"}</span>
                <strong>{result?.score ?? progress}<small>/100</small></strong>
              </div>
              <div className="scan-stage">
                <span>{result ? `${result.grade} / ${result.label}` : `Stage ${Math.max(1, phase + 1)} of ${scanStages.length}`}</span>
                <strong>{stageLabel || activeStage?.label || "Waiting for a website"}</strong>
                <small>{stageMeta || activeStage?.meta || "Public signals only"}</small>
              </div>
              <div className="scan-progress" role="progressbar" aria-label="Audit progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
            </div>
          </div>

          {result && (
            <div className="result-preview">
              <div className="result-preview-head">
                <div>
                  <p className="lead-line light">LIVE RESULT / {result.domain.toUpperCase()}</p>
                  <h2>Evidence, not a <span>mystery score.</span></h2>
                </div>
                <div className="result-seal" aria-label={`Readiness score ${result.score} out of 100, grade ${result.grade}`}>
                  <span>{result.grade}</span>
                  <strong>{result.score}</strong>
                  <small>{result.label}</small>
                </div>
              </div>

              <div className="result-metrics" aria-label="Audit metrics">
                <div><strong>{result.metrics.pagesScanned}</strong><span>Pages sampled</span></div>
                <div><strong>{result.metrics.crawlersAllowed}/{result.metrics.crawlersMeasured || "—"}</strong><span>Measured agents allowed</span></div>
                <div><strong>{result.metrics.answerBlocks}</strong><span>Answer blocks</span></div>
                <div><strong>{result.metrics.entities}</strong><span>Entities mapped</span></div>
              </div>

              <div className="result-category-grid">
                {result.categories.map((category) => (
                  <article key={category.key}>
                    <div><span>{category.label}</span><strong>{category.score}</strong></div>
                    <i aria-hidden="true"><b style={{ width: `${category.score}%` }} /></i>
                    <p>{category.description}</p>
                  </article>
                ))}
              </div>

              <div className="result-findings">
                <div className="result-findings-head">
                  <span>PRIORITY EVIDENCE</span>
                  <p>{result.findings.filter((finding) => finding.tone !== "good").length} issues need attention</p>
                </div>
                {result.findings.slice(0, 4).map((finding) => (
                  <article className={`finding-row tone-${finding.tone}`} key={finding.code}>
                    <span>{finding.code}</span>
                    <div><h3>{finding.label}</h3><p>{finding.evidence}</p></div>
                    <strong>{finding.value}</strong>
                  </article>
                ))}
              </div>

              <div className="result-actions">
                <p>This scan measures public citation-readiness signals. {saveState === "saving" && "Saving to your private history…"}{saveState === "saved" && "Saved to your private history."}{saveState === "signin" && <><a href="/account">Sign in with ChatGPT</a> to save this and future reports.</>}{saveState === "error" && "The report remains available on this device, but could not be saved to your account."}</p>
                <div>
                  <a className="result-link secondary" href="#scanner">Run another scan <span>↗</span></a>
                  <a className="result-link primary" href={savedReportId ? `/report?id=${savedReportId}` : "/report"}>Open evidence report <span>↗</span></a>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="how-section" id="method">
        <div className="how-grid-bg" aria-hidden="true" />
        <div className="section-index light">01 / METHOD</div>
        <div className="how-copy">
          <p className="lead-line light">HOW IT WORKS</p>
          <h2>From invisible site to <span>AI signal.</span></h2>
          <p>Signal scans how answer engines see your website: whether they can reach it, understand it, trust it and cite it.</p>
        </div>
        <div className="how-orbit" aria-hidden="true">
          <span className="how-index">01</span>
          <div className="agent-radar">
            <span className="agent-ring ring-one" />
            <span className="agent-ring ring-two" />
            <span className="agent-ring ring-three" />
            <span className="agent-track track-one"><i /><b>Discover</b></span>
            <span className="agent-track track-two"><i /><b>Understand</b></span>
            <span className="agent-track track-three"><i /><b>Trust</b></span>
            <span className="agent-track track-four"><i /><b>Cite</b></span>
            <div className="agent-core">
              <AgentCount />
              <small>AGENTS</small>
            </div>
          </div>
          <div className="agent-caption">
            <h3>Crawler access</h3>
            <p>See which AI agents can reach your knowledge and which bots are blocked before they ever read the page.</p>
          </div>
        </div>
        <div className="how-steps" aria-label="How Signal audits a website">
          <article>
            <span>01</span>
            <h3>Discover</h3>
            <p>We check crawl paths, robots rules, sitemaps and public access.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Understand</h3>
            <p>We read structure, schema, entities and answer-ready passages.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Trust</h3>
            <p>We surface proof signals: authors, sources, freshness and authority.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Cite</h3>
            <p>We score what AI can confidently choose, summarize and mention.</p>
          </article>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="pricing-head">
          <div className="section-index light">02 / PRICING</div>
          <div>
            <p className="lead-line light">PRICING</p>
            <h2>Start free.<br />Scale when <span>ready.</span></h2>
            <p>See the evidence report free. Use the sandbox to rehearse premium access safely before real payments are connected.</p>
          </div>
        </div>
        <div className="pricing-grid">
          <article className="price-card">
            <span className="price-label">Free Score</span>
            <h3>$0</h3>
            <p>No card required</p>
            <ul>
              <li>Website crawl and GEO score</li>
              <li>AI crawler access check</li>
              <li>Six-category visibility snapshot</li>
              <li>Critical fixes preview</li>
            </ul>
            <a href="#scanner">Run free score <span>↗</span></a>
          </article>
          <article className="price-card featured">
            <div className="popular-badge">Most popular</div>
            <span className="price-label">Full Audit</span>
            <h3>$19.99</h3>
            <p>Sandbox checkout · no real charge</p>
            <ul>
              <li>Everything in Free</li>
              <li>Platform-by-platform prompt and citation tests</li>
              <li>Competitor visibility and entity gap analysis</li>
              <li>Crawler audit for GPTBot, ClaudeBot and more</li>
              <li>Evidence-linked fixes prioritized by impact</li>
              <li>Copy-ready schema, answer blocks and 90-day roadmap</li>
            </ul>
            <a href="/checkout?plan=full-audit">Test sandbox checkout <span>↗</span></a>
          </article>
          <article className="price-card consult">
            <span className="price-label">Done-For-You</span>
            <h3>$2,000<small>+</small></h3>
            <p>Plus monthly monitoring</p>
            <ul>
              <li>Complete GEO website upgrade</li>
              <li>Schema, llms.txt and technical fixes</li>
              <li>Answer-first content rewrites</li>
              <li>Continuous monitoring and reporting</li>
              <li>Priority support</li>
            </ul>
            <small className="price-note">Final quote depends on scope and site complexity.</small>
            <a href="/contact#intake">Start project intake <span>↗</span></a>
          </article>
        </div>
      </section>

      <section className="signals-section" id="signals">
        <div className="section-heading">
          <div className="section-index">03 / SIGNALS</div>
          <h2>Evidence over<br /><span>vanity metrics.</span></h2>
          <p>Three views into the invisible systems deciding who becomes the answer.</p>
        </div>
        <div className="signal-card-grid">
          {signalCardData.map((card) => (
            <article className="signal-card" key={card.index}>
              <div className="card-top"><span>{card.index}</span><i>↗</i></div>
              <div className="card-orbit" aria-hidden="true">
                <span /><span /><span />
                <b>{card.stat}</b>
                <small>{card.unit}</small>
              </div>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-faq-section" id="faq">
        <div className="landing-faq-head">
          <div className="section-index light">04 / FAQ</div>
          <div>
            <p className="lead-line light">FAQ</p>
            <h2>Questions before<br /><span>AI answers.</span></h2>
            <p>The quick version: what we scan, what it means and what happens after your website becomes visible.</p>
          </div>
        </div>
        <div className="landing-faq-grid">
          {landingFaqs.map((faq, index) => (
            <article className="landing-faq-card" key={faq.question}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
              <i aria-hidden="true">↗</i>
            </article>
          ))}
        </div>
        <a className="landing-faq-link" href="/faq">Read full FAQ <span>↗</span></a>
      </section>

      <section className="closing-section">
        <div className="closing-orbit" aria-hidden="true"><i /><i /><i /><span>S°</span></div>
        <p>THE ANSWER IS ALREADY BEING CHOSEN.</p>
        <h2>Make sure it’s <span>you.</span></h2>
        <a href="#scanner">Reveal your AI footprint <span>↗</span></a>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><img className="brand-logo" src="/geocitation-logo.png" alt="GEOCITATION" /></a>
        <p>AI visibility, made observable.</p>
        <div><a href="#method">Method</a><a href="#pricing">Pricing</a><a href="/faq">FAQ</a><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
        <span>© 2026 GEOCITATION</span>
      </footer>
    </main>
  );
}
