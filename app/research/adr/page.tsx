import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  RESEARCH_ACCESS_COOKIE,
  RESEARCH_ACCESS_TOKEN,
} from "../../../lib/research/access";
import {
  ADRS,
  OWNER_LABEL,
  STATUS_LABEL,
  type AdrRecord,
  type AdrStatus,
  type Owner,
  type ReqStatus,
  type Requirement,
} from "./adr-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ADR — Mirqab Decision Log",
  description:
    "Architecture Decision Records for the Mirqab pilot: who does what, and by when.",
  robots: { index: false, follow: false },
};

const ADR_STATUS_META: Record<AdrStatus, { label: string; cls: string }> = {
  accepted: { label: "Accepted", cls: "accepted" },
  proposed: { label: "Proposed", cls: "proposed" },
  rejected: { label: "Rejected", cls: "rejected" },
  superseded: { label: "Superseded", cls: "superseded" },
};

export default async function AdrPage() {
  const cookieStore = await cookies();
  const unlocked =
    cookieStore.get(RESEARCH_ACCESS_COOKIE)?.value === RESEARCH_ACCESS_TOKEN;
  if (!unlocked) redirect("/research");

  const allReqs = ADRS.flatMap((adr) =>
    adr.requirements.map((r) => ({ ...r, adrNumber: adr.number, adrTitle: adr.title })),
  ).sort((a, b) => a.targetSort - b.targetSort);

  const total = allReqs.length;
  const done = allReqs.filter((r) => r.status === "done").length;
  const blocked = allReqs.filter((r) => r.status === "blocked").length;
  const open = total - done;
  const accepted = ADRS.filter((a) => a.status === "accepted").length;
  const proposed = ADRS.filter((a) => a.status === "proposed").length;
  const byOwner = (owner: Owner) => allReqs.filter((r) => r.owner === owner).length;
  const nextUp = allReqs.find((r) => r.status === "pending" || r.status === "blocked");
  const lastSynced = ADRS.reduce((latest, a) => (a.date > latest ? a.date : latest), ADRS[0].date);

  return (
    <main className="mirqab-report-page" id="main-content">
      <ReportHeader />

      <section className="adr-hero">
        <p className="mirqab-kicker">DECISION LOG</p>
        <h1>ADR — Every decision.<br />Who does it, by when.</h1>
        <p className="adr-hero-sub">
          Architecture Decision Records for the Mirqab pilot, turned into a
          working requirements tracker. New ADRs land here the day they&apos;re
          written — nothing here is aspirational; every row traces back to a
          decision file in the venture&apos;s decision log.
        </p>
        <p className="mirqab-meta">Last synced {lastSynced} · {ADRS.length} decision records · {total} requirements</p>
      </section>

      <section className="adr-stats" aria-label="Decision log summary">
        <article><strong>{ADRS.length}</strong><span>ADRs on record</span></article>
        <article><strong>{accepted}</strong><span>Accepted</span></article>
        <article className={proposed > 0 ? "warn" : undefined}><strong>{proposed}</strong><span>Awaiting decision</span></article>
        <article><strong>{open}</strong><span>Open requirements</span></article>
        <article><strong>{byOwner("founder")}</strong><span>On the founder</span></article>
        <article><strong>{byOwner("owais")}</strong><span>On Owais</span></article>
        <article><strong>{byOwner("ali")}</strong><span>On Ali</span></article>
      </section>

      {proposed > 0 ? (
        <section className="adr-alert" aria-label="Decisions awaiting founder input">
          <span>ACTION NEEDED</span>
          <p>
            {proposed} ADR{proposed > 1 ? "s are" : " is"} still <strong>Proposed</strong> —
            {" "}
            {ADRS.filter((a) => a.status === "proposed")
              .map((a) => `ADR-${a.number} (${a.title})`)
              .join(", ")}. Nothing executes on a proposed decision until it&apos;s accepted.
          </p>
        </section>
      ) : null}

      {nextUp ? (
        <section className="adr-nextup" aria-label="Next up">
          <span>NEXT UP</span>
          <h3>{nextUp.task}</h3>
          <p>
            Owner: <b className={`owner-dot ${nextUp.owner}`}>{OWNER_LABEL[nextUp.owner]}</b>
            {" · "}Target: {nextUp.target}
            {" · "}from ADR-{nextUp.adrNumber}
          </p>
        </section>
      ) : null}

      <section className="adr-timeline-wrap">
        <h2>The master timeline</h2>
        <p className="adr-section-sub">
          Every requirement from every ADR, merged into one chronology —
          the whole build plan, in order.
        </p>
        <ol className="adr-timeline">
          {allReqs.map((r, i) => (
            <li key={`${r.adrNumber}-${i}`} className={`status-${r.status}`}>
              <div className="adr-tl-dot" aria-hidden />
              <div className="adr-tl-card">
                <div className="adr-tl-head">
                  <span className="adr-tl-target">{r.target}</span>
                  <StatusPill status={r.status} />
                </div>
                <p className="adr-tl-task">{r.task}</p>
                <div className="adr-tl-foot">
                  <OwnerChip owner={r.owner} />
                  <Link href={`#adr-${r.adrNumber}`} className="adr-tl-source">
                    ADR-{r.adrNumber} ↗
                  </Link>
                </div>
                {r.note ? <p className="adr-tl-note">{r.note}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="adr-records">
        <h2>The decision records</h2>
        <p className="adr-section-sub">
          Full context for each ADR, with its own requirements broken out.
        </p>
        {ADRS.map((adr) => (
          <AdrCard key={adr.number} adr={adr} />
        ))}
      </section>

      <section className="adr-maintain">
        <span>FOR ALI / OWAIS</span>
        <p>
          This page mirrors <code>~/Documents/mirqab/docs/adr/</code>. To add a
          new decision: write the <code>.md</code> file there first, run
          <code> python3 scripts/adr_index.py</code>, then append a matching
          record to <code>app/research/adr/adr-data.ts</code> in this repo and
          redeploy. The markdown files remain the source of truth; this page is
          the founder-facing view.
        </p>
      </section>
    </main>
  );
}

function AdrCard({ adr }: { adr: AdrRecord }) {
  const meta = ADR_STATUS_META[adr.status];
  return (
    <article className={`adr-card ${meta.cls}`} id={`adr-${adr.number}`}>
      <details open>
        <summary>
          <div className="adr-card-head">
            <span className="adr-card-num">ADR-{adr.number}</span>
            <h3>{adr.title}</h3>
            <span className={`adr-status-pill ${meta.cls}`}>{meta.label}</span>
          </div>
          <p className="adr-card-meta">
            {adr.date} · {adr.deciders} · {adr.appliesTo}
          </p>
        </summary>

        <p className="adr-card-context">{adr.context}</p>

        <ul className="adr-card-decision">
          {adr.decisionSummary.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>

        <div className="adr-req-table" role="table" aria-label={`Requirements for ADR-${adr.number}`}>
          <div className="adr-req-row adr-req-head" role="row">
            <span role="columnheader">Requirement</span>
            <span role="columnheader">Owner</span>
            <span role="columnheader">Target</span>
            <span role="columnheader">Status</span>
          </div>
          {adr.requirements.map((r, i) => (
            <div className="adr-req-row" role="row" key={i}>
              <span role="cell" className="adr-req-task">
                {r.task}
                {r.note ? <em>{r.note}</em> : null}
              </span>
              <span role="cell"><OwnerChip owner={r.owner} /></span>
              <span role="cell" className="adr-req-target">{r.target}</span>
              <span role="cell"><StatusPill status={r.status} /></span>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}

function OwnerChip({ owner }: { owner: Owner }) {
  return <b className={`owner-dot ${owner}`}>{OWNER_LABEL[owner]}</b>;
}

function StatusPill({ status }: { status: ReqStatus }) {
  return <span className={`req-status-pill ${status}`}>{STATUS_LABEL[status]}</span>;
}

function ReportHeader() {
  return (
    <header className="mirqab-report-header">
      <Link href="/" className="mirqab-report-mark" aria-label="GEOCITATION home">
        <img src="/geocitation-logo.png" alt="GEOCITATION" />
      </Link>
      <nav aria-label="Report navigation">
        <Link href="/research">Dossier</Link>
        <a href="/research/report">Full report</a>
        <Link href="/research/adr" className="solid">Decision log</Link>
      </nav>
    </header>
  );
}
