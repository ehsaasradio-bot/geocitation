"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const scanStages = [
  { label: "Establishing secure crawl", meta: "TLS + headers" },
  { label: "Discovering site architecture", meta: "83 pages found" },
  { label: "Testing AI crawler access", meta: "14 agents checked" },
  { label: "Extracting entities & schema", meta: "24 entities mapped" },
  { label: "Reading answer passages", meta: "186 blocks scored" },
  { label: "Simulating buyer prompts", meta: "20 queries tested" },
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

const findings = [
  { code: "CRAWL-01", label: "GPTBot access", value: "Allowed", tone: "good" },
  { code: "SCHEMA-07", label: "Organization entity", value: "Incomplete", tone: "warn" },
  { code: "CONTENT-14", label: "Answer extractability", value: "Strong", tone: "good" },
  { code: "TRUST-03", label: "First-party evidence", value: "Missing", tone: "bad" },
];

type ScanGraphProps = {
  phase: number;
  running: boolean;
  complete: boolean;
  domain: string;
};

function ScanGraph({ phase, running, complete, domain }: ScanGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase, running, complete, domain });

  useEffect(() => {
    stateRef.current = { phase, running, complete, domain };
  }, [phase, running, complete, domain]);

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
        const color = !revealed
          ? "rgba(255,255,255,.22)"
          : node.status === "good"
            ? "#c9ff47"
            : node.status === "warn"
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
          ctx.fillText(node.name.toUpperCase(), nx, ny + 20);
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
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (!running) return;

    const started = performance.now();
    const duration = 10800;
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const ratio = Math.min(1, elapsed / duration);
      const nextPhase = Math.min(scanStages.length - 1, Math.floor(ratio * scanStages.length));
      setPhase(nextPhase);
      setProgress(Math.round(ratio * 100));
      setScore(Math.round(82 * (1 - Math.pow(1 - ratio, 2.4))));

      if (ratio >= 1) {
        window.clearInterval(timer);
        setRunning(false);
        setComplete(true);
        setPhase(scanStages.length - 1);
        setProgress(100);
        setScore(82);
      }
    }, 48);

    return () => window.clearInterval(timer);
  }, [running, runId]);

  const startScan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = url.trim() || "yourwebsite.com";
    let normalized = value;
    try {
      normalized = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname;
    } catch {
      normalized = value.replace(/^https?:\/\//i, "").split("/")[0] || "yourwebsite.com";
    }

    setDomain(normalized);
    setComplete(false);
    setPhase(0);
    setProgress(1);
    setScore(0);
    setRunId((valueNow) => valueNow + 1);
    setRunning(true);
  };

  const activeStage = scanStages[Math.max(0, phase)];

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

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> AI citation observatory</div>
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
              />
              <button type="submit" disabled={running}>
                <span>{running ? "Observing" : complete ? "Scan again" : "Reveal my footprint"}</span>
                <b aria-hidden="true">{running ? `${progress}%` : "↗"}</b>
              </button>
            </div>
            <div className="form-note" id="audit-note">
              <span>No account</span><span>47+ signals</span><span>Evidence attached</span>
            </div>
          </form>
        </div>

        <div className={`observatory ${running ? "is-running" : ""} ${complete ? "is-complete" : ""}`}>
          <div className="observatory-head">
            <span>LIVE SIGNAL MAP</span>
            <span className="system-status"><i /> {running ? "CRAWL ACTIVE" : complete ? "MAP COMPLETE" : "SYSTEM READY"}</span>
          </div>
          <ScanGraph phase={phase} running={running} complete={complete} domain={domain} />
          <div className="corner-index corner-index-a">A—01</div>
          <div className="corner-index corner-index-b">{String(Math.max(0, phase + 1)).padStart(2, "0")} / 07</div>
          <div className="scan-data">
            <div className="scan-score">
              <span>Visibility</span>
              <strong>{complete || running ? score : "—"}<small>/100</small></strong>
            </div>
            <div className="scan-stage" aria-live="polite">
              <span>{running ? `PHASE ${String(phase + 1).padStart(2, "0")}` : complete ? "AUDIT COMPLETE" : "AWAITING DOMAIN"}</span>
              <strong>{running || complete ? activeStage.label : "Enter a website to begin"}</strong>
              <small>{running || complete ? activeStage.meta : "The map will assemble in real time"}</small>
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
          {signalCards.map((card) => (
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
            <span>signal://audit/acme.com</span>
            <div><i /><i /><i /></div>
          </div>
          <div className="console-summary">
            <div className="console-score"><small>AI VISIBILITY</small><strong>82</strong><span>↑ 14 pts opportunity</span></div>
            <div className="fingerprint" aria-hidden="true">
              {[55, 82, 68, 94, 73, 88, 61, 79, 96, 70, 84, 64].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
            </div>
          </div>
          <div className="finding-list">
            {findings.map((finding) => (
              <div className="finding" key={finding.code}>
                <span>{finding.code}</span>
                <strong>{finding.label}</strong>
                <em className={finding.tone}>{finding.value}</em>
                <button type="button" aria-label={`Open evidence for ${finding.label}`}>↗</button>
              </div>
            ))}
          </div>
          <div className="console-foot"><span>47 SIGNALS CHECKED</span><span>4 PRIORITY ACTIONS</span><span>12 MIN TO FIX</span></div>
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
