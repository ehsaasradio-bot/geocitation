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
  priority: string;
  adminNote: string;
  reviewerEmail: string | null;
  reviewedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

const statusOptions = ["new", "reviewing", "scoped", "closed"] as const;
const priorityOptions = ["standard", "high", "urgent"] as const;

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

function labelize(value: string) {
  return value.replaceAll("-", " ");
}

function priorityWeight(priority: string) {
  if (priority === "urgent") return 3;
  if (priority === "high") return 2;
  return 1;
}

export function InquiriesAdmin() {
  const [inquiries, setInquiries] = useState<InquirySummary[] | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string>("");
  const [filter, setFilter] = useState<(typeof statusOptions)[number] | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<(typeof priorityOptions)[number] | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "priority" | "recent-review">("newest");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { status: string; priority: string; adminNote: string }>>({});

  useEffect(() => {
    void fetch("/api/inquiries", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ inquiries: InquirySummary[]; admin: boolean }> : Promise.reject(new Error("Admin inquiry queue could not be loaded.")))
      .then((payload) => {
        setInquiries(payload.inquiries);
        setDrafts(Object.fromEntries(payload.inquiries.map((inquiry) => [inquiry.id, { status: inquiry.status, priority: inquiry.priority, adminNote: inquiry.adminNote }])));
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Admin inquiry queue could not be loaded."));
  }, []);

  const updateReview = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setSaving(id);
    try {
      const response = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error("Status update failed.");
      const payload = await response.json() as { inquiry: Pick<InquirySummary, "id" | "status" | "priority" | "adminNote" | "reviewerEmail" | "reviewedAt" | "updatedAt"> };
      setInquiries((current) => current?.map((inquiry) => inquiry.id === id ? { ...inquiry, ...payload.inquiry } : inquiry) ?? current);
      setDrafts((current) => ({
        ...current,
        [id]: {
          status: payload.inquiry.status,
          priority: payload.inquiry.priority,
          adminNote: payload.inquiry.adminNote,
        },
      }));
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
  const priorityCounts = priorityOptions.map((priority) => ({
    priority,
    count: inquiries?.filter((inquiry) => inquiry.priority === priority).length ?? 0,
  }));
  const visibleInquiries = useMemo(
    () => {
      const query = search.trim().toLowerCase();
      const filtered = inquiries?.filter((inquiry) => {
        if (filter !== "all" && inquiry.status !== filter) return false;
        if (priorityFilter !== "all" && inquiry.priority !== priorityFilter) return false;
        if (!query) return true;
        return [
          inquiry.website,
          inquiry.market,
          inquiry.name,
          inquiry.email,
          inquiry.services,
          inquiry.notes,
        ].some((value) => value.toLowerCase().includes(query));
      }) ?? [];
      return [...filtered].sort((left, right) => {
        if (sort === "oldest") return left.createdAt - right.createdAt;
        if (sort === "recent-review") return (right.reviewedAt ?? 0) - (left.reviewedAt ?? 0) || right.createdAt - left.createdAt;
        if (sort === "priority") return priorityWeight(right.priority) - priorityWeight(left.priority) || right.createdAt - left.createdAt;
        return right.createdAt - left.createdAt;
      });
    },
    [filter, inquiries, priorityFilter, search, sort],
  );

  const exportQueue = () => {
    if (!visibleInquiries.length) return;
    downloadCsv("signal-inquiries.csv", [
      ["website", "market", "name", "email", "status", "priority", "services", "notes", "admin_note", "created_at", "reviewed_at", "reviewer"],
      ...visibleInquiries.map((inquiry) => [
        inquiry.website,
        inquiry.market,
        inquiry.name,
        inquiry.email,
        inquiry.status,
        inquiry.priority,
        inquiry.services,
        inquiry.notes,
        inquiry.adminNote,
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
      <div className="ops-priority-strip">
        {priorityCounts.map((item) => <article key={item.priority}><span>{item.priority}</span><strong>{item.count}</strong></article>)}
      </div>

      <div className="ops-toolbar">
        <label>
          <span>Filter</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as (typeof statusOptions)[number] | "all")}>
            <option value="all">all</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as (typeof priorityOptions)[number] | "all")}>
            <option value="all">all</option>
            {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>
        <label className="ops-search">
          <span>Search</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="website, market, contact, notes…" />
        </label>
        <label>
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as "newest" | "oldest" | "priority" | "recent-review")}>
            <option value="newest">newest first</option>
            <option value="oldest">oldest first</option>
            <option value="priority">highest priority</option>
            <option value="recent-review">recently reviewed</option>
          </select>
        </label>
        <button type="button" onClick={exportQueue} disabled={!visibleInquiries.length}>Export CSV <span>↓</span></button>
      </div>

      <p className="ops-result-count">{visibleInquiries.length} visible {visibleInquiries.length === 1 ? "inquiry" : "inquiries"}.</p>

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
                <div className="ops-chip-row">
                  <i className={`ops-chip status-${inquiry.status}`}>{labelize(inquiry.status)}</i>
                  <i className={`ops-chip priority-${inquiry.priority}`}>{labelize(inquiry.priority)}</i>
                  {inquiry.orderId ? <a className="ops-chip ops-chip-link" href={`/account/orders/${inquiry.orderId}`}>linked receipt ↗</a> : null}
                </div>
              </div>
              <label>
                <small>Status</small>
                <select value={drafts[inquiry.id]?.status ?? inquiry.status} disabled={saving === inquiry.id} onChange={(event) => setDrafts((current) => ({ ...current, [inquiry.id]: { ...current[inquiry.id], status: event.target.value } }))}>
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
            <div className="ops-review-row">
              <label>
                <small>Priority</small>
                <select value={drafts[inquiry.id]?.priority ?? inquiry.priority} disabled={saving === inquiry.id} onChange={(event) => setDrafts((current) => ({ ...current, [inquiry.id]: { ...current[inquiry.id], priority: event.target.value } }))}>
                  {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              <label className="ops-note-field">
                <small>Internal note</small>
                <textarea value={drafts[inquiry.id]?.adminNote ?? inquiry.adminNote} disabled={saving === inquiry.id} onChange={(event) => setDrafts((current) => ({ ...current, [inquiry.id]: { ...current[inquiry.id], adminNote: event.target.value } }))} rows={4} />
              </label>
              <button
                type="button"
                disabled={
                  saving === inquiry.id
                  || (
                    (drafts[inquiry.id]?.status ?? inquiry.status) === inquiry.status
                    && (drafts[inquiry.id]?.priority ?? inquiry.priority) === inquiry.priority
                    && (drafts[inquiry.id]?.adminNote ?? inquiry.adminNote) === inquiry.adminNote
                  )
                }
                onClick={() => void updateReview(inquiry.id)}
              >
                {saving === inquiry.id ? "Saving…" : "Save review"} <span>↗</span>
              </button>
            </div>
          </article>
        ))}
      </div>}

      {inquiries?.length === 0 ? <div className="account-empty"><strong>NO INQUIRIES YET</strong><p>Done-for-you project requests will appear here once people submit the intake form.</p></div> : inquiries?.length ? !visibleInquiries.length ? <div className="account-empty"><strong>NO MATCHES</strong><p>No inquiries match the current filter.</p></div> : null : null}
    </section>
  );
}
