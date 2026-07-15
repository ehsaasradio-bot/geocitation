import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  RESEARCH_ACCESS_COOKIE,
  RESEARCH_ACCESS_TOKEN,
} from "../../lib/research/access";
import { ResearchGate } from "./research-gate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Mirqab Dossier — Private Research",
  description:
    "Password-protected research: The Mirqab Dossier — market intelligence, platform architecture, PRDs, execution plan, ADR and competitor teardown.",
  robots: { index: false, follow: false },
};

const partCards = [
  {
    eyebrow: "PART 1 · INTELLIGENCE",
    title: "Scrunch — Competitive Intelligence Report",
    copy: "The $225M Sitecore acquisition decoded: product, pricing, moats, fault lines, and the seven-play competitive playbook.",
    tone: "blue",
  },
  {
    eyebrow: "PART 2 · FOUNDATION",
    title: "Blueprint — GEO Platform Architecture",
    copy: "Full technical design: monitoring, governed content, attribution, compliance — with none of the incumbents' liabilities.",
    tone: "blue",
  },
  {
    eyebrow: "PART 3 · PRODUCT",
    title: "Mirqab — MVP PRD v1.0",
    copy: "Arabic-first AI visibility for Saudi Arabia: scope, stack, 12-week plan, decision gates, design-partner program, risk register.",
    tone: "green",
  },
  {
    eyebrow: "PART 4 · EXECUTION",
    title: "Mirqab Pilot — PRD v2.0 · Built by Three",
    copy: "The plan re-engineered for Founder + Owais + Ali: operating model, definitions of done, pilot-scale gates, day-90 decision.",
    tone: "green",
  },
  {
    eyebrow: "PART 5 · DECISION",
    title: "ADR-001 — Pilot Kickoff Record",
    copy: "The accepted architecture decision: what we build, what it was blocked on, and what started the day it was accepted.",
    tone: "dark",
  },
  {
    eyebrow: "PART 6 · TEARDOWN",
    title: "Geoptie — Decoded, All 59 Pages",
    copy: "The Tor.app content machine read in full: product mechanics, pricing tricks, credibility audit, and what we copy vs. avoid.",
    tone: "dark",
  },
];

const metrics = [
  ["6", "Working documents combined"],
  ["102", "Pages in the final dossier"],
  ["12+8", "Research dimensions and market sweeps"],
  ["59+29", "Competitor pages read in full"],
];

const teardownCards = [
  {
    eyebrow: "NO. 01 · JULY 13, 2026",
    title: "Scrunch, decoded.",
    copy: "The $225M incumbent — Sitecore's GEO acquisition, 500+ enterprise brands, and the AXP edge-delivery moat everyone is measured against. Part 1 of the dossier.",
    tone: "blue",
    href: "/research/report",
    cta: "In the dossier",
  },
  {
    eyebrow: "NO. 02 · JULY 15, 2026",
    title: "Geoptie, decoded.",
    copy: "A content-marketing machine wearing a SaaS platform — the Tor.app factory's keyword play, self-ranked #1 in sixteen of sixteen posts. Part 6 of the dossier.",
    tone: "dark",
    href: "/research/report",
    cta: "In the dossier",
  },
  {
    eyebrow: "NO. 03 · JULY 16, 2026",
    title: "Zaher, decoded.",
    copy: "A real first mover wearing a bigger company's numbers — the direct Arabic-GEO competitor, eleven months ahead. All 29 pages read; 5·6·7 engine claims; the $7.99 hidden tier.",
    tone: "green",
    href: "/research/zaher",
    cta: "Open the teardown",
  },
  {
    eyebrow: "NO. 04 · RESERVED",
    title: "Next teardown.",
    copy: "The grid keeps its two-by-two rhythm as the series grows — the next target slots in here.",
    tone: "reserved",
  },
];

export default async function ResearchPage() {
  const unlocked = await isResearchUnlocked();
  if (!unlocked) return <LockedDossier />;

  return (
    <main className="mirqab-report-page" id="main-content">
      <ReportHeader unlocked />

      <section className="mirqab-cover" aria-labelledby="mirqab-title">
        <p className="mirqab-kicker">FOUNDER · OWAIS · ALI — COMPLETE WORKING DOCUMENTS</p>
        <div className="mirqab-arabic" lang="ar">مِرقاب</div>
        <h1 id="mirqab-title">The Mirqab Dossier.</h1>
        <p className="mirqab-subtitle">
          Everything, in one document: the market intelligence that found the
          opportunity, the architecture that can win it, the product plans sized
          to our team, the decision record that started the build, and the
          competitor decoded page by page.
        </p>
        <p className="mirqab-meta">Compiled July 15, 2026 · Six documents · Cross-verified research corpus</p>
        <div className="mirqab-part-grid">
          {partCards.map((card) => (
            <article className={`mirqab-part-card ${card.tone}`} key={card.eyebrow}>
              <span>{card.eyebrow}</span>
              <h2>{card.title}</h2>
              <p>{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mirqab-stats" aria-label="Dossier summary">
        {metrics.map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="mirqab-open-panel" aria-label="Open the full report">
        <div>
          <div>
            <span>FULL REPORT · DESIGNED EDITION</span>
            <h2>Read the dossier as it was designed.</h2>
            <p>
              The complete report with its original typography, charts, tables
              and part navigation — re-tinted to this site&apos;s dark theme.
              Opens in this tab; your access stays valid for seven days.
            </p>
          </div>
          <a className="mirqab-open-cta" href="/research/report">
            Open the full report <span aria-hidden>↗</span>
          </a>
        </div>
      </section>

      <section className="mirqab-open-panel adr-panel" aria-label="Open the decision log">
        <div>
          <div>
            <span>ADR · DECISION LOG</span>
            <h2>Every decision. Who does it, by when.</h2>
            <p>
              Architecture Decision Records turned into a live requirements
              tracker — a master timeline of every commitment across the
              pilot, plus the full context behind each one.
            </p>
          </div>
          <a className="mirqab-open-cta adr-cta" href="/research/adr">
            Open the decision log <span aria-hidden>↗</span>
          </a>
        </div>
      </section>

      <section className="mirqab-teardowns" aria-labelledby="teardown-series-title">
        <p className="mirqab-kicker">TEARDOWN SERIES · ONE COMPETITOR AT A TIME</p>
        <h2 id="teardown-series-title">Research, two by two.</h2>
        <div className="mirqab-part-grid teardown-grid">
          {teardownCards.map((card) =>
            card.href ? (
              <a
                className={`mirqab-part-card teardown-card ${card.tone}`}
                href={card.href}
                key={card.eyebrow}
              >
                <span>{card.eyebrow}</span>
                <h2>{card.title}</h2>
                <p>{card.copy}</p>
                <em className="teardown-cta">{card.cta} ↗</em>
              </a>
            ) : (
              <article
                className={`mirqab-part-card teardown-card ${card.tone}`}
                key={card.eyebrow}
              >
                <span>{card.eyebrow}</span>
                <h2>{card.title}</h2>
                <p>{card.copy}</p>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="mirqab-open-panel comparison-panel" aria-label="Open the comparison page">
        <div>
          <div>
            <span>COMPARISON · CROSS-SERIES</span>
            <h2>Score the series side by side.</h2>
            <p>
              Reserved for the matrix — Scrunch vs Geoptie vs Zaher vs Mirqab
              on pricing, engines, evidence standards, and go-to-market. Empty
              by design, ready when the series is.
            </p>
          </div>
          <a className="mirqab-open-cta comparison-cta" href="/research/comparison">
            Open comparison <span aria-hidden>↗</span>
          </a>
        </div>
      </section>
    </main>
  );
}

function LockedDossier() {
  return (
    <main className="mirqab-report-page mirqab-locked-page" id="main-content">
      <ReportHeader />
      <section className="mirqab-lock-hero">
        <p className="mirqab-kicker">PRIVATE DOSSIER · PASSWORD REQUIRED</p>
        <div className="mirqab-arabic" lang="ar">مِرقاب</div>
        <h1>Research access is protected.</h1>
        <p>
          Enter the access password to read The Mirqab Dossier — the full final
          report with market intelligence, platform architecture, MVP plan,
          pilot execution record, ADR and competitor teardown.
        </p>
      </section>
      <section className="mirqab-lock-panel">
        <div>
          <span>ACCESS</span>
          <h2>Private working document.</h2>
          <p>
            The report renders only after password verification. Access is
            remembered on this device for seven days.
          </p>
        </div>
        <ResearchGate />
      </section>
    </main>
  );
}

function ReportHeader({ unlocked = false }: { unlocked?: boolean }) {
  return (
    <header className="mirqab-report-header">
      <Link href="/" className="mirqab-report-mark" aria-label="GEOCITATION home">
        <img src="/geocitation-logo.png" alt="GEOCITATION" />
      </Link>
      <nav aria-label="Report navigation">
        {unlocked ? (
          <>
            <a className="solid" href="/research/report">Full report</a>
            <a href="/research/zaher">Zaher teardown</a>
            <Link href="/research/adr">Decision log</Link>
            <Link href="/research/comparison">Comparison</Link>
          </>
        ) : null}
        <Link href="/methodology">Method</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
}

async function isResearchUnlocked(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(RESEARCH_ACCESS_COOKIE)?.value === RESEARCH_ACCESS_TOKEN;
}
