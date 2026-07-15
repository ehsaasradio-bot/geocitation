"use client";

import { FormEvent, useState } from "react";

export function ResearchGate() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/research-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.error ?? "The password could not be verified.");
        return;
      }
      window.location.reload();
    } catch {
      setMessage("The password could not be verified. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="research-gate-form" data-endpoint="/api/research-access" onSubmit={submitPassword}>
      <label>
        <span>Password</span>
        <input
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter research password"
          required
          type="password"
          value={password}
        />
      </label>
      <button disabled={submitting} type="submit">
        {submitting ? "Checking…" : "Unlock research"} <span>↗</span>
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </form>
  );
}
