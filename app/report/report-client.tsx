"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AUDIT_STORAGE_KEY, type AuditResult, type AuditTone } from "../audit-types";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function pathFor(value: string) {
  try {
    const url = new URL(value);
    return url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "");
  } catch {
    return value;
  }
}

function toneFor(score: number): AuditTone {
  return score >= 75 ? "good" : score >= 50 ? "warn" : "bad";
}

function subscribeToStoredAudit(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getStoredAudit() {
  return window.localStorage.getItem(AUDIT_STORAGE_KEY);
}

function getServerAudit() {
  return undefined;
}

function subscribeToLocation() {
  return () => undefined;
}

function getReportId() {
  return new URLSearchParams(window.location.search).get("id") ?? "";
}

function getServerReportId() {
  return "";
}

export function ReportClient() {
  const storedAudit = useSyncExternalStore(subscribeToStoredAudit, getStoredAudit, getServerAudit);
  const localResult = useMemo<AuditResult | null | undefined>(() => {
    if (storedAudit === undefined) return undefined;
    if (!storedAudit) return null;
    try {
      return JSON.parse(storedAudit) as AuditResult;
    } catch {
      return null;
    }
  }, [storedAudit]);
  const [remoteResult, setRemoteResult] = useState<AuditResult | null | undefined>(undefined);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const reportId = useSyncExternalStore(subscribeToLocation, getReportId, getServerReportId);
  const remoteMode = Boolean(reportId);

  useEffect(() => {
    if (!reportId) return;
    void fetch(`/api/reports/${encodeURIComponent(reportId)}`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ report: AuditResult }> : Promise.reject(new Error("Report unavailable")))
      .then((payload) => setRemoteResult(payload.report))
      .catch(() => setRemoteResult(null));
  }, [reportId]);

  useEffect(() => {
    void fetch("/api/billing/status", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ fullAudit: boolean }> : Promise.reject(new Error("status unavailable")))
      .then((payload) => setPremiumUnlocked(payload.fullAudit))
      .catch(() => undefined);
  }, []);

  const result = remoteMode ? remoteResult : localResult;

  if (result === undefined) {
    return <main className="report-page report-loading" id="main-content"><span className="live-dot" /><p>ASSEMBLING EVIDENCE REPORT</p></main>;
  }

  if (!result) {
    return (
      <main className="report-page report-empty" id="main-content">
        <header className="report-nav">
          <Link className="brand" href="/"><span className="brand-mark"><i /><i /><i /></span><span>SIGNAL<span className="brand-dot">°</span></span></Link>
          <Link className="header-cta" href="/account">Saved reports <span>↗</span></Link>
        </header>
        <section>
          <p className="lead-line light">NO EVIDENCE LOADED</p>
          <h1>Run a website scan to build your report.</h1>
          <p>{remoteMode ? "This report is unavailable or does not belong to the signed-in account." : "Reports are created from a live crawl. Sign in to keep every audit safely in your private history."}</p>
          <Link href="/#scanner">Start a live scan <span>↗</span></Link>
        </section>
      </main>
    );
  }

  const issues = result.findings.filter((finding) => finding.tone !== "good");
  const strengths = result.findings.filter((finding) => finding.tone === "good");

  return (
    <main className="report-page" id="main-content">
      <header className="report-nav">
        <Link className="brand" href="/">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>SIGNAL<span className="brand-dot">°</span></span>
        </Link>
        <nav aria-label="Report navigation">
          <a href="#overview">Overview</a>
          <a href="#evidence">Evidence</a>
          <a href="#crawlers">Crawlers</a>
          <a href="#pages">Pages</a>
          <Link href="/account">History</Link>
        </nav>
        <button className="report-print" type="button" onClick={() => window.print()}>Save / print <span>↗</span></button>
      </header>

      <section className="report-cover" id="overview">
        <div className="report-grid-bg" aria-hidden="true" />
        <div className="report-cover-copy">
          <p className="lead-line light">AI CITATION-READINESS / EVIDENCE REPORT</p>
          <h1>{result.domain}</h1>
          <p>{formatDate(result.scannedAt)} · {result.metrics.pagesScanned} {result.metrics.pagesScanned === 1 ? "page" : "pages"} sampled · {result.metrics.signalsChecked} deterministic checks</p>
          <div className="report-cover-actions">
            <a href={result.target} target="_blank" rel="noreferrer">Visit website <span>↗</span></a>
            <Link href="/#scanner">Run another audit <span>↗</span></Link>
          </div>
        </div>
        <div className="report-score" aria-label={`Readiness score ${result.score} out of 100`}>
          <span>READINESS INDEX</span>
          <strong>{result.score}</strong>
          <div><b>{result.grade}</b><small>{result.label}</small></div>
        </div>
      </section>

      <section className="report-summary">
        <div><span>CRAWLER ACCESS</span><strong>{result.metrics.crawlersAllowed}/{result.metrics.crawlersMeasured || "—"}</strong><small>Measured agents allowed</small></div>
        <div><span>DISCOVERY</span><strong>{result.metrics.pagesDiscovered}</strong><small>Public URLs found</small></div>
        <div><span>CITABILITY</span><strong>{result.metrics.answerBlocks}</strong><small>Answer-ready blocks</small></div>
        <div><span>ENTITY GRAPH</span><strong>{result.metrics.entities}</strong><small>Named entities mapped</small></div>
      </section>

      <section className="report-section report-categories">
        <div className="report-section-head">
          <span>01 / SCORE MODEL</span>
          <div><h2>Six signals. One <span>readiness index.</span></h2><p>Every category is scored from evidence fetched during this scan. The weight is visible so the final number can be challenged—not merely trusted.</p></div>
        </div>
        <div className="report-category-list">
          {result.categories.map((category, index) => (
            <article key={category.key} className={`tone-${toneFor(category.score)}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{category.label}</h3><p>{category.description}</p></div>
              <small>{category.weight}% weight</small>
              <strong>{category.score}</strong>
              <i aria-hidden="true"><b style={{ width: `${category.score}%` }} /></i>
            </article>
          ))}
        </div>
      </section>

      <section className="report-section" id="evidence">
        <div className="report-section-head">
          <span>02 / EVIDENCE</span>
          <div><h2>What changed the <span>score.</span></h2><p>{issues.length} priority issues and {strengths.length} verified strengths were found. Each row shows the observation and the next action.</p></div>
        </div>
        <div className="report-findings-list">
          {result.findings.map((finding) => (
            <article className={`report-finding tone-${finding.tone}`} key={finding.code}>
              <div className="finding-code"><span>{finding.code}</span><b>{finding.value}</b></div>
              <div><h3>{finding.label}</h3><p>{finding.evidence}</p></div>
              <div><span>NEXT ACTION</span><p>{finding.action}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="report-section report-machine-files">
        <div className="report-section-head compact">
          <span>03 / MACHINE FILES</span>
          <div><h2>Public guidance <span>layer.</span></h2></div>
        </div>
        <div className="resource-grid">
          {(result.resources ?? []).map((resource) => (
            <article className={resource.detected ? "is-detected" : "is-missing"} key={resource.key}>
              <span>{resource.detected ? "DETECTED" : "MISSING"}</span>
              <h3>{resource.label}</h3>
              <p>{resource.detail}</p>
              <a href={resource.url} target="_blank" rel="noreferrer">HTTP {resource.status ?? "—"} <b>↗</b></a>
            </article>
          ))}
        </div>
      </section>

      <section className="report-section" id="crawlers">
        <div className="report-section-head compact">
          <span>04 / AI CRAWLERS</span>
          <div><h2>Who can reach the <span>homepage.</span></h2></div>
        </div>
        <div className="crawler-table" role="table" aria-label="AI crawler access results">
          <div className="crawler-table-head" role="row"><span role="columnheader">Agent</span><span role="columnheader">Access</span><span role="columnheader">Evidence</span></div>
          {result.crawlerAccess.map((crawler) => (
            <div className={crawler.allowed === null ? "is-unknown" : crawler.allowed ? "is-allowed" : "is-blocked"} role="row" key={crawler.name}>
              <strong role="cell">{crawler.name}</strong>
              <span role="cell">{crawler.allowed === null ? "Unknown" : crawler.allowed ? "Allowed" : "Blocked"}</span>
              <p role="cell">{crawler.purpose?.replaceAll("_", " ") ?? "AI agent"} · {crawler.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section" id="pages">
        <div className="report-section-head compact">
          <span>05 / PAGE SAMPLE</span>
          <div><h2>The pages behind the <span>evidence.</span></h2></div>
        </div>
        <div className="page-table">
          <div className="page-table-head"><span>Path</span><span>Words</span><span>Answers</span><span>Schema</span><span>Status</span></div>
          {result.pages.map((page) => (
            <article key={page.url}>
              <div><a href={page.url} target="_blank" rel="noreferrer">{pathFor(page.url)} <b>↗</b></a><p>{page.title}</p></div>
              <span>{page.words}</span>
              <span>{page.answerBlocks ?? "—"}</span>
              <span>{page.schemaTypes?.length ? page.schemaTypes.slice(0, 2).join(", ") : "None"}</span>
              <strong>{page.status}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="report-method">
        <div><span>METHODOLOGY / {result.auditVersion ?? "SIGNAL 2026.1"}</span><p>{result.methodology}</p></div>
        <div><span>LIMITATION</span><p>This report tests public technical and content signals. Live answer-engine citation testing requires model-specific prompt runs and is intentionally not represented as completed here.</p></div>
      </section>

      {premiumUnlocked && <section className="premium-roadmap" id="roadmap">
        <div className="report-section-head"><span>06 / SANDBOX PREMIUM</span><div><h2>Your 90-day <span>action map.</span></h2><p>A deterministic planning layer assembled from this report’s evidence. It is a sandbox preview—not a model-specific citation test.</p></div></div>
        <div className="roadmap-grid">
          {[0, 1, 2].map((period) => {
            const labels = ["DAYS 01–30", "DAYS 31–60", "DAYS 61–90"];
            const actions = issues.slice(period * 2, period * 2 + 2);
            return <article key={labels[period]}><span>{labels[period]}</span><strong>{String(period + 1).padStart(2, "0")}</strong>{actions.length ? actions.map((finding) => <div key={finding.code}><b>{finding.code}</b><h3>{finding.action}</h3><p>{finding.evidence}</p></div>) : <div><b>VERIFY</b><h3>Re-run the audit and measure progress.</h3><p>Confirm improved evidence before moving to model-specific prompt testing.</p></div>}</article>;
          })}
        </div>
      </section>}

      <section className="report-upgrade">
        <div>
          <p className="lead-line light">{premiumUnlocked ? "SANDBOX ACCESS / ACTIVE" : "SANDBOX / PAYMENT REHEARSAL"}</p>
          <h2>Turn evidence into a <span>90-day action plan.</span></h2>
          <p>{premiumUnlocked ? "Your test entitlement is active. The 90-day action map above is unlocked without a real charge." : "Run the complete account-to-entitlement flow in test mode. No card fields or real payment processor are connected."}</p>
        </div>
        <ul>
          <li>Platform-by-platform prompt and citation tests</li>
          <li>Competitor entity and content gap analysis</li>
          <li>Copy-ready schema, llms.txt and answer blocks</li>
          <li>Prioritized 30 / 60 / 90-day roadmap</li>
        </ul>
        <Link href={premiumUnlocked ? "/account" : "/checkout?plan=full-audit"}>{premiumUnlocked ? "View sandbox order" : "Test sandbox checkout"} <span>↗</span></Link>
      </section>

      <footer className="report-footer">
        <Link className="brand footer-brand" href="/"><span className="brand-mark"><i /><i /><i /></span><span>SIGNAL<span className="brand-dot">°</span></span></Link>
        <p>Public evidence, made observable.</p>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></div>
        <span>© 2026 SIGNAL OBSERVATORY</span>
      </footer>
    </main>
  );
}
