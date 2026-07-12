"use client";

import { FormEvent, useState } from "react";

const initialState = {
  name: "",
  email: "",
  website: "",
  market: "",
  services: "",
  notes: "",
};

export function ContactIntakeForm() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null) as { error?: string; inquiry?: { id: string } } | null;
      if (!response.ok || !payload?.inquiry) throw new Error(payload?.error ?? "The intake request could not be sent.");
      setStatus("done");
      setMessage("Project intake received. We now have the essentials to review your website, goals and GEO scope.");
      setForm(initialState);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The intake request could not be sent.");
    }
  };

  return (
    <section className="intake-shell" id="intake" aria-labelledby="intake-title">
      <div className="intake-copy">
        <span>PROJECT INTAKE / DONE-FOR-YOU</span>
        <h2 id="intake-title">Tell us what needs to become <span>visible.</span></h2>
        <p>Share the site, market, priority services and implementation context. This creates a durable intake record so the done-for-you path can move from interest to scoped work.</p>
        <ul>
          <li>Domain and business context</li>
          <li>Priority products, services or locations</li>
          <li>Technical or content constraints</li>
          <li>What success should look like</li>
        </ul>
      </div>

      <form className="intake-form" onSubmit={(event) => void submit(event)}>
        <div className="intake-grid">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={120} required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} maxLength={160} required />
          </label>
          <label>
            <span>Website</span>
            <input type="url" placeholder="https://example.com" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} maxLength={240} required />
          </label>
          <label>
            <span>Target market</span>
            <input value={form.market} onChange={(event) => setForm((current) => ({ ...current, market: event.target.value }))} maxLength={160} placeholder="SaaS, clinic, local services, publisher…" required />
          </label>
        </div>

        <label>
          <span>Priority services or products</span>
          <textarea value={form.services} onChange={(event) => setForm((current) => ({ ...current, services: event.target.value }))} maxLength={400} rows={4} required />
        </label>

        <label>
          <span>Notes</span>
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} maxLength={4000} rows={6} required />
        </label>

        <button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Sending intake…" : "Send project intake"}
          <span>↗</span>
        </button>

        {message ? <p role={status === "error" ? "alert" : "status"} className={status === "done" ? "is-success" : "is-error"}>{message}</p> : null}
      </form>
    </section>
  );
}
