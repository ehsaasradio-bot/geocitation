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
  ["59", "Competitor pages read in full"],
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
            <Link href="/research/adr">Decision log</Link>
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
