import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  RESEARCH_ACCESS_COOKIE,
  RESEARCH_ACCESS_TOKEN,
} from "../../lib/research/access";
import dossier from "./mirqab-dossier-pages.json";
import { ResearchGate } from "./research-gate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Mirqab Dossier — Full Report",
  description:
    "The full Mirqab Dossier: complete working documents from the final PDF, including market intelligence, platform architecture, PRDs, execution plan, ADR and teardown.",
};

type DossierPage = {
  number: number;
  sourcePage: number;
  text: string;
};

const dossierPages = dossier.pages as DossierPage[];

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
    copy: "The parked architecture decision: what we build, what it is blocked on, what happens the day it is accepted.",
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
  ["102", "PDF pages in the final dossier"],
  ["6", "Working documents combined"],
  ["12", "Scrunch research dimensions"],
  ["8", "Wide market sweeps cross-verified"],
];

const toc = [
  ["Cover", "page-1"],
  ["Part 1 · External Intelligence", "page-3"],
  ["Part 2 · Foundation", "page-24"],
  ["Part 3 · Product", "page-44"],
  ["Part 4 · Execution", "page-56"],
  ["Part 5 · Decision", "page-74"],
  ["Part 6 · Teardown", "page-77"],
  ["Full extracted report", "full-report"],
];

export default async function ResearchPage() {
  const unlocked = await isResearchUnlocked();
  if (!unlocked) return <LockedDossier />;

  return (
    <main className="mirqab-report-page" id="main-content">
      <ReportHeader />

      <section className="mirqab-cover" aria-labelledby="mirqab-title">
        <p className="mirqab-kicker">FOUNDER · OWAIS · ALI — COMPLETE WORKING DOCUMENTS</p>
        <div className="mirqab-arabic" lang="ar">مِرقاب</div>
        <h1 id="mirqab-title">The Mirqab Dossier.</h1>
        <p className="mirqab-subtitle">
          Everything, in one document: the market intelligence that found the opportunity, the architecture that can win it, the product plans sized to our team, the decision record that starts the build, and the competitor decoded page by page.
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

      <section className="mirqab-intro-panel">
        <div>
          <span>FULL REPORT</span>
          <h2>Final PDF converted into a web-native dossier.</h2>
        </div>
        <p>
          This page follows the final PDF as the source of truth. The typography, cards, blue/green accents, page rhythm and executive-report layout are adapted from the local dossier itself rather than from the public landing page.
        </p>
      </section>

      <section className="mirqab-reader" id="full-report">
        <aside className="mirqab-toc" aria-label="Report table of contents">
          <p>CONTENTS</p>
          {toc.map(([label, href]) => (
            <a href={`#${href}`} key={href}>{label}</a>
          ))}
        </aside>
        <div className="mirqab-pages">
          {dossierPages.map((page) => (
            <article className="mirqab-sheet" id={`page-${page.number}`} key={page.number}>
              <div className="mirqab-sheet-head">
                <span>PAGE {String(page.number).padStart(3, "0")}</span>
                <span>FINAL MIRQAB DOSSIER</span>
              </div>
              <pre>{page.text}</pre>
            </article>
          ))}
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
          Enter the access password to view The Mirqab Dossier: the full final report with market intelligence, platform architecture, MVP plan, pilot execution record, ADR and teardown.
        </p>
      </section>
      <section className="mirqab-lock-panel">
        <div>
          <span>ACCESS</span>
          <h2>Private working document.</h2>
          <p>The report content is rendered only after password verification. The unlocked view uses the final PDF as the source of truth.</p>
        </div>
        <ResearchGate />
      </section>
    </main>
  );
}

function ReportHeader() {
  return (
    <header className="mirqab-report-header">
      <Link href="/" className="mirqab-report-mark" aria-label="GEOCITATION home">
        <img src="/geocitation-logo.png" alt="GEOCITATION" />
      </Link>
      <nav aria-label="Report navigation">
        <a href="#full-report">Full report</a>
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
