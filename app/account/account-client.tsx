"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ReportSummary = {
  id: string;
  domain: string;
  target: string;
  score: number;
  grade: string;
  scannedAt: string;
  createdAt: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AccountClient() {
  const [reports, setReports] = useState<ReportSummary[] | null>(null);
  const [sandbox, setSandbox] = useState<{ fullAudit: boolean; consultation: boolean; orders: unknown[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/reports", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ reports: ReportSummary[] }> : Promise.reject(new Error("Your report history could not be loaded.")))
      .then((payload) => setReports(payload.reports))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Your report history could not be loaded."));
  }, []);

  useEffect(() => {
    void fetch("/api/billing/status", { cache: "no-store" })
      .then(async (response) => response.json() as Promise<{ fullAudit: boolean; consultation: boolean; orders: unknown[] }>)
      .then(setSandbox)
      .catch(() => undefined);
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm("Remove this saved report?")) return;
    const response = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    if (response.ok) setReports((current) => current?.filter((report) => report.id !== id) ?? []);
  };

  return (
    <section className="account-history" aria-labelledby="history-title">
      <div className="account-history-head"><span>01 / SAVED EVIDENCE</span><h2 id="history-title">Audit <span>timeline.</span></h2></div>
      {sandbox && <div className="sandbox-account-strip"><span>PAYMENT SANDBOX / TEST MODE</span><strong>{sandbox.fullAudit ? "FULL AUDIT ACTIVE" : sandbox.consultation ? "CONSULTATION TESTED" : "NO TEST ORDER"}</strong><p>{sandbox.orders.length} sandbox {sandbox.orders.length === 1 ? "order" : "orders"} · No real charges</p><Link href="/checkout?plan=full-audit">Open sandbox ↗</Link></div>}
      {error && <p className="account-error" role="alert">{error}</p>}
      {reports === null && !error && <p className="account-loading"><i className="live-dot" />LOADING PRIVATE REPORTS</p>}
      {reports?.length === 0 && (
        <div className="account-empty"><strong>NO REPORTS YET</strong><p>Run your first live audit while signed in. It will appear here automatically.</p><Link href="/#scanner">Start scanning ↗</Link></div>
      )}
      {!!reports?.length && <div className="account-report-list">
        <div className="account-report-head"><span>Website</span><span>Scanned</span><span>Grade</span><span>Score</span><span>Actions</span></div>
        {reports.map((report) => (
          <article key={report.id}>
            <div><strong>{report.domain}</strong><a href={report.target} target="_blank" rel="noreferrer">Visit site ↗</a></div>
            <time dateTime={report.scannedAt}>{formatDate(report.scannedAt)}</time>
            <b>{report.grade}</b>
            <em>{report.score}</em>
            <div className="account-row-actions"><Link href={`/report?id=${report.id}`}>Open report ↗</Link>{sandbox?.fullAudit ? <Link href={`/lab?report=${report.id}`}>Test prompts ↗</Link> : <Link href={`/checkout?plan=full-audit&report=${report.id}&next=lab`}>Unlock lab ↗</Link>}<button type="button" onClick={() => void remove(report.id)}>Remove</button></div>
          </article>
        ))}
      </div>}
    </section>
  );
}
