"use client";

import { useEffect, useMemo, useState } from "react";

type InquirySummary = {
  id: string;
  orderId: string | null;
  name: string;
  email: string;
  website: string;
  market: string;
  services: string;
  notes: string;
  status: string;
  reviewerEmail: string | null;
  reviewedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

const statusOptions = ["new", "reviewing", "scoped", "closed"] as const;

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(name: string, rows: string[][]) {
  const body = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDate(value: number | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function InquiriesAdmin() {
  const [inquiries, setInquiries] = useState<InquirySummary[] | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string>("");
  const [filter, setFilter] = useState<(typeof statusOptions)[number] | "all">("all");

  useEffect(() => {
    void fetch("/api/inquiries", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ inquiries: InquirySummary[]; admin: boolean }> : Promise.reject(new Error("Admin inquiry queue could not be loaded.")))
      .then((payload) => setInquiries(payload.inquiries))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Admin inquiry queue could not be loaded."));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setSaving(id);
    try {
      const response = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Status update failed.");
      setInquiries((current) => current?.map((inquiry) => inquiry.id === id ? { ...inquiry, status } : inquiry) ?? current);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Status update failed.");
    } finally {
      setSaving("");
    }
  };

  const counts = statusOptions.map((status) => ({
    status,
    count: inquiries?.filter((inquiry) => inquiry.status === status).length ?? 0,
  }));
  const visibleInquiries = useMemo(
    () => inquiries?.filter((inquiry) => filter === "all" || inquiry.status === filter) ?? [],
    [filter, inquiries],
  );

  const exportQueue = () => {
    if (!visibleInquiries.length) return;
    downloadCsv("signal-inquiries.csv", [
      ["website", "market", "name", "email", "status", "services", "notes", "created_at", "reviewed_at", "reviewer"],
      ...visibleInquiries.map((inquiry) => [
        inquiry.website,
        inquiry.market,
        inquiry.name,
        inquiry.email,
        inquiry.status,
        inquiry.services,
        inquiry.notes,
        formatDate(inquiry.createdAt),
        formatDate(inquiry.reviewedAt),
        inquiry.reviewerEmail ?? "",
      ]),
    ]);
  };

  return (
    <section className="ops-shell" aria-labelledby="ops-title">
      <div className="ops-head">
        <span>OPS / INQUIRY QUEUE</span>
        <h2 id="ops-title">Review incoming <span>projects.</span></h2>
        <p>Track who asked for done-for-you help, what they need, and how far each inquiry has moved.</p>
      </div>

      <div className="ops-metrics">
        {counts.map((item) => <article key={item.status}><span>{item.status}</span><strong>{item.count}</strong></article>)}
      </div>

      <div className="ops-toolbar">
        <label>
          <span>Filter</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as (typeof statusOptions)[number] | "all")}>
            <option value="all">all</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <button type="button" onClick={exportQueue} disabled={!visibleInquiries.length}>Export CSV <span>↓</span></button>
      </div>

      {error ? <p className="account-error" role="alert">{error}</p> : null}
      {inquiries === null && !error ? <p className="account-loading"><i className="live-dot" />LOADING INQUIRY QUEUE</p> : null}

      {!!visibleInquiries.length && <div className="ops-list">
        {visibleInquiries.map((inquiry) => (
          <article key={inquiry.id} className="ops-card">
            <div className="ops-card-head">
              <div>
                <span>{inquiry.market}</span>
                <h3>{inquiry.website}</h3>
                <p>{inquiry.name} · {inquiry.email}</p>
              </div>
              <label>
                <small>Status</small>
                <select value={inquiry.status} disabled={saving === inquiry.id} onChange={(event) => void updateStatus(inquiry.id, event.target.value)}>
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
            </div>

            <div className="ops-card-grid">
              <div><b>Services</b><p>{inquiry.services}</p></div>
              <div><b>Notes</b><p>{inquiry.notes}</p></div>
              <div><b>Created</b><p>{formatDate(inquiry.createdAt)}</p></div>
              <div><b>Last review</b><p>{formatDate(inquiry.reviewedAt)}{inquiry.reviewerEmail ? ` · ${inquiry.reviewerEmail}` : ""}</p></div>
            </div>
          </article>
        ))}
      </div>}

      {inquiries?.length === 0 ? <div className="account-empty"><strong>NO INQUIRIES YET</strong><p>Done-for-you project requests will appear here once people submit the intake form.</p></div> : inquiries?.length ? !visibleInquiries.length ? <div className="account-empty"><strong>NO MATCHES</strong><p>No inquiries match the current filter.</p></div> : null : null}
    </section>
  );
}
