"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const scanStages = [
  { label: "Establishing secure crawl", meta: "TLS + headers" },
  { label: "Discovering site architecture", meta: "Mapping internal URLs" },
  { label: "Testing AI crawler access", meta: "14 agents checked" },
  { label: "Extracting entities & schema", meta: "Parsing JSON-LD" },
  { label: "Reading answer passages", meta: "Scoring extractability" },
  { label: "Evaluating answer-engine signals", meta: "47 deterministic checks" },
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

const sampleFindings: AuditFinding[] = [
  { code: "CRAWL-01", label: "AI crawler access", value: "All allowed", tone: "good", evidence: "No homepage-blocking rules were found for the checked AI agents.", action: "Keep monitoring robots.txt when deployment rules change." },
  { code: "SCHEMA-07", label: "Organization entity", value: "Incomplete", tone: "warn", evidence: "The business entity is present but does not include stable sameAs references.", action: "Connect the Organization entity to verified external profiles." },
  { code: "CONTENT-14", label: "Answer extractability", value: "Strong", tone: "good", evidence: "Multiple self-contained passages can be extracted without surrounding context.", action: "Strengthen the best passages with attributed evidence." },
  { code: "TRUST-03", label: "First-party evidence", value: "Missing", tone: "bad", evidence: "No attributable statistics or original research were found in the sample.", action: "Publish measurable first-party facts with dates and methodology." },
];

type AuditTone = "good" | "warn" | "bad";

type AuditFinding = {
  code: string;
  label: string;
  value: string;
  tone: AuditTone;
  evidence: string;
  action: string;
};

type AuditResult = {
  target: string;
  domain: string;
  score: number;
  grade: string;
  label: string;
  categories: Array<{ key: string; label: string; score: number }>;
  findings: AuditFinding[];
  metrics: {
    pagesDiscovered: number;
    pagesScanned: number;
    crawlersAllowed: number;
    crawlerTotal: number;
    entities: number;
    answerBlocks: number;
    signalsChecked: number;
    durationMs: number;
  };
  pages: Array<{ url: string; status: number; title: string; words: number }>;
  methodology: string;
};

type ScanGraphProps = {
  phase: number;
  running: boolean;
  complete: boolean;
  domain: string;
  pageNames: string[];
  nodeTones: AuditTone[];
};

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
      { x: 0.12, y: 0.22, name: "/services", at: 1, status: "good" },
      { x: 0.2, y: 0.48, name: "/about", at: 1, status: "good" },
      { x: 0.11, y: 0.72, name: "/insights", at: 2, status: "warn" },
      { x: 0.33, y: 0.12, name: "/pricing", at: 2, status: "good" },
      { x: 0.34, y: 0.82, name: "/cases", at: 3, status: "bad" },
      { x: 0.48, y: 0.23, name: "schema", at: 3, status: "warn" },
      { x: 0.5, y: 0.76, name: "answers", at: 4, status: "good" },
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

      engines.forEach((engine, index) => {
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
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [stageLabel, setStageLabel] = useState("");
  const [stageMeta, setStageMeta] = useState("");
  const [auditError, setAuditError] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
  const scanAbortRef = useRef<AbortController | null>(null);
  const runTokenRef = useRef(0);

  useEffect(() => () => scanAbortRef.current?.abort(), []);

  useEffect(() => {
    if (!result) return;
    const started = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const ratio = Math.min(1, (now - started) / 1_050);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setScore(Math.round(result.score * eased));
      if (ratio < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
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
    setScore(0);
    setResult(null);
    setSelectedFinding(null);
    setAuditError("");
    setStageLabel(scanStages[0].label);
    setStageMeta(`Connecting to ${normalized}`);
    setRunning(true);

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
  const activeFindings = result?.findings.length ? result.findings.slice(0, 5) : sampleFindings;
  const signalCardData = signalCards.map((card, index) => {
    if (!result) return card;
    if (index === 0) return { ...card, stat: String(result.metrics.crawlersAllowed), unit: `of ${result.metrics.crawlerTotal}` };
    if (index === 1) return { ...card, stat: String(result.metrics.answerBlocks), unit: "blocks" };
    return { ...card, stat: String(result.metrics.entities), unit: "entities" };
  });
  const categoryScores = result?.categories.map((category) => category.score) ?? [55, 82, 68, 94, 73, 88];
  const fingerprintBars = [...categoryScores, ...categoryScores].map((value, index) => Math.max(12, Math.min(100, Math.round(value * (index % 3 === 0 ? 0.82 : index % 3 === 1 ? 1 : 0.92)))));
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
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Signal home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>SIGNAL<span className="brand-dot">°</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#method">Method</a>
          <a href="#signals">Signals</a>
          <a href="#evidence">Evidence</a>
        </nav>
        <a className="header-cta" href="#scanner">Run an audit <span>↗</span></a>
      </header>

      <section className="launch-banner" id="top" aria-labelledby="launch-title">
        <div className="banner-atmosphere" aria-hidden="true" />
        <div className="banner-kicker"><span>AI VISIBILITY / 2026</span><span>LIVE CITATION SIGNALS</span></div>
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
          <h1 id="launch-title"><span>AI</span><span>SIGNAL</span><sup>°</sup></h1>
        </div>
        <p className="banner-copy">SEE WHAT AI CAN FIND. FIX WHAT IT CAN’T.</p>
        <h3 className="banner-question">YOUR WEBSITE EXISTS.<br />DOES AI KNOW IT?</h3>
        <div className="banner-actions">
          <a className="banner-button primary" href="#scanner"><span>Test Now</span><i>↗</i></a>
          <a className="banner-button secondary" href="#method"><span>How It Works</span><i>↓</i></a>
        </div>
        <div className="banner-specs" aria-hidden="true">
          <span>REAL-TIME CRAWL</span>
          <span>47 SIGNALS</span>
          <span>14 AI AGENTS</span>
          <span>EVIDENCE LINKED</span>
        </div>
        <div className="banner-coordinate" aria-hidden="true">24.7136° N<br />46.6753° E</div>
      </section>

      <section className="hero audit-stage">
        <div className="hero-copy">
          <h1>Your website exists.<br /><em>Does AI know it?</em></h1>
          <p className="hero-intro">Watch your site become a living signal map. See what AI can reach, understand and confidently cite.</p>

          <form className="audit-form" onSubmit={startScan} id="scanner">
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
              <span>No account</span><span>47+ signals</span><span>Evidence attached</span>
            </div>
            {auditError && <p className="audit-error" role="alert"><b>Scan stopped</b>{auditError}</p>}
            {result && <p className="audit-result-note"><b>LIVE CRAWL</b>{result.metrics.pagesScanned} pages sampled in {(result.metrics.durationMs / 1000).toFixed(1)}s. Readiness measures signals—not confirmed citations.</p>}
          </form>
        </div>

        <div className={`observatory ${running ? "is-running" : ""} ${complete ? "is-complete" : ""} ${auditError ? "has-error" : ""}`}>
          <div className="observatory-head">
            <span>LIVE SIGNAL MAP</span>
            <span className="system-status"><i /> {running ? "CRAWL ACTIVE" : complete ? "MAP COMPLETE" : auditError ? "SCAN INTERRUPTED" : "SYSTEM READY"}</span>
          </div>
          <ScanGraph phase={phase} running={running} complete={complete} domain={domain} pageNames={pageNames} nodeTones={nodeTones} />
          <div className="corner-index corner-index-a">A—01</div>
          <div className="corner-index corner-index-b">{String(Math.max(0, phase + 1)).padStart(2, "0")} / 07</div>
          <div className="scan-data">
            <div className="scan-score">
              <span>Readiness</span>
              <strong>{complete || running ? score : "—"}<small>/100</small></strong>
            </div>
            <div className="scan-stage" aria-live="polite">
              <span>{running ? `PHASE ${String(phase + 1).padStart(2, "0")}` : complete ? `GRADE ${result?.grade ?? "—"} · ${result?.label ?? "AUDIT COMPLETE"}` : auditError ? "AUDIT ERROR" : "AWAITING DOMAIN"}</span>
              <strong>{running || complete || auditError ? stageLabel || activeStage.label : "Enter a website to begin"}</strong>
              <small>{running || complete || auditError ? stageMeta || activeStage.meta : "The map will assemble from live crawl evidence"}</small>
            </div>
            <div className="scan-progress" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="hero-side-note">
          <span>SCROLL TO TRACE</span>
          <i />
        </div>
      </section>

      <div className="signal-ticker" aria-hidden="true">
        <div>
          <span>DISCOVERY</span><b>✦</b><span>CRAWL ACCESS</span><b>✦</b><span>ENTITY CONFIDENCE</span><b>✦</b><span>CITATION READINESS</span><b>✦</b><span>OBSERVED VISIBILITY</span><b>✦</b>
          <span>DISCOVERY</span><b>✦</b><span>CRAWL ACCESS</span><b>✦</b><span>ENTITY CONFIDENCE</span><b>✦</b><span>CITATION READINESS</span><b>✦</b><span>OBSERVED VISIBILITY</span><b>✦</b>
        </div>
      </div>

      <section className="manifesto" id="method">
        <div className="section-index">01 / METHOD</div>
        <div className="manifesto-body">
          <p className="lead-line">Most audits hand you a score.</p>
          <h2>We show you the <em>journey</em> from page to answer.</h2>
          <div className="manifesto-grid">
            <p>Signal traces how machines discover, parse and evaluate your knowledge. Every score links back to visible evidence—not a black box.</p>
            <div className="method-diagram" aria-label="The audit moves from discovery through understanding to citation">
              <div><span>01</span><strong>Discover</strong><small>Can AI reach it?</small></div>
              <i>→</i>
              <div><span>02</span><strong>Understand</strong><small>Can AI parse it?</small></div>
              <i>→</i>
              <div><span>03</span><strong>Trust</strong><small>Can AI verify it?</small></div>
              <i>→</i>
              <div><span>04</span><strong>Cite</strong><small>Will AI choose it?</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="signals-section" id="signals">
        <div className="section-heading">
          <div className="section-index">02 / SIGNALS</div>
          <h2>Evidence over<br /><em>vanity metrics.</em></h2>
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

      <section className="evidence-section" id="evidence">
        <div className="evidence-copy">
          <div className="section-index light">03 / EVIDENCE</div>
          <h2>Never wonder<br /><em>why.</em></h2>
          <p>Open any score to see the page, rule and passage behind it. Then ship the fix without translating a 60-page PDF.</p>
          <a href="#top">Explore a live report <span>↗</span></a>
        </div>

        <div className="evidence-console">
          <div className="console-bar">
            <span>signal://audit/{result?.domain ?? "sample.com"}</span>
            <div><i /><i /><i /></div>
          </div>
          <div className="console-summary">
            <div className="console-score"><small>AI READINESS</small><strong>{result ? score : 82}</strong><span>{result ? `${100 - result.score} pts opportunity · grade ${result.grade}` : "↑ 14 pts opportunity"}</span></div>
            <div className="fingerprint" aria-hidden="true">
              {fingerprintBars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
            </div>
          </div>
          <div className="finding-list">
            {activeFindings.map((finding) => (
              <div className={`finding-shell ${selectedFinding === finding.code ? "is-open" : ""}`} key={finding.code}>
                <div className="finding">
                  <span>{finding.code}</span>
                  <strong>{finding.label}</strong>
                  <em className={finding.tone}>{finding.value}</em>
                  <button type="button" aria-expanded={selectedFinding === finding.code} aria-label={`Open evidence for ${finding.label}`} onClick={() => setSelectedFinding((current) => current === finding.code ? null : finding.code)}>↗</button>
                </div>
                {selectedFinding === finding.code && <div className="finding-evidence"><span>EVIDENCE</span><p>{finding.evidence}</p><strong>NEXT ACTION</strong><p>{finding.action}</p></div>}
              </div>
            ))}
          </div>
          <div className="console-foot"><span>{result?.metrics.signalsChecked ?? 47} SIGNALS CHECKED</span><span>{activeFindings.filter((finding) => finding.tone !== "good").length} PRIORITY ACTIONS</span><span>{result?.metrics.pagesScanned ?? 6} PAGES SAMPLED</span></div>
        </div>
      </section>

      <section className="closing-section">
        <div className="closing-orbit" aria-hidden="true"><i /><i /><i /><span>S°</span></div>
        <p>THE ANSWER IS ALREADY BEING CHOSEN.</p>
        <h2>Make sure it’s <em>you.</em></h2>
        <a href="#scanner">Reveal your AI footprint <span>↗</span></a>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark"><i /><i /><i /></span><span>SIGNAL<span className="brand-dot">°</span></span></a>
        <p>AI visibility, made observable.</p>
        <div><a href="#method">Method</a><a href="#signals">Signals</a><a href="#evidence">Evidence</a></div>
        <span>© 2026 SIGNAL OBSERVATORY</span>
      </footer>
    </main>
  );
}
