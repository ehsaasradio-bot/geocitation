import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  RESEARCH_ACCESS_COOKIE,
  RESEARCH_ACCESS_TOKEN,
} from "../../../lib/research/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comparison — Private Research",
  description:
    "Reserved for the cross-series competitor matrix: Scrunch vs Geoptie vs Zaher vs Mirqab.",
  robots: { index: false, follow: false },
};

export default async function ComparisonPage() {
  const cookieStore = await cookies();
  const unlocked =
    cookieStore.get(RESEARCH_ACCESS_COOKIE)?.value === RESEARCH_ACCESS_TOKEN;
  if (!unlocked) redirect("/research");

  return (
    <main className="mirqab-report-page" id="main-content">
      <header className="mirqab-report-header">
        <Link href="/" className="mirqab-report-mark" aria-label="GEOCITATION home">
          <img src="/geocitation-logo.png" alt="GEOCITATION" />
        </Link>
        <nav aria-label="Report navigation">
          <Link href="/research">Research</Link>
          <a href="/research/report">Full report</a>
          <a href="/research/zaher">Zaher teardown</a>
          <Link href="/research/adr">Decision log</Link>
        </nav>
      </header>

      <section className="mirqab-cover" aria-labelledby="comparison-title">
        <p className="mirqab-kicker">COMPARISON · CROSS-SERIES ANALYSIS</p>
        <h1 id="comparison-title">Nothing to compare — yet.</h1>
        <p className="mirqab-subtitle">
          This page is reserved for the side-by-side: Scrunch vs Geoptie vs
          Zaher vs Mirqab — pricing, engines, evidence standards, and
          go-to-market in one matrix.
        </p>
        <div className="comparison-empty" role="note">
          <strong>— × —</strong>
          <p>Empty by design. The matrix gets built here when the series is ready to be scored side by side.</p>
        </div>
      </section>
    </main>
  );
}
