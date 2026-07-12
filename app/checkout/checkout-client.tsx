"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useState } from "react";

type SandboxPlan = "full-audit" | "done-for-you";

const planCopy = {
  "full-audit": { name: "Full Audit", price: "$19.99", detail: "Premium action plan access" },
  "done-for-you": { name: "Done-For-You", price: "$2,000+", detail: "Consultation request rehearsal" },
};

export function CheckoutClient({ plan, email, reportId, next }: { plan: SandboxPlan; email: string; reportId?: string; next?: "lab" | "account" }) {
  const [state, setState] = useState<"ready" | "working" | "complete" | "error">("ready");
  const selected = planCopy[plan];
  const primaryHref = useMemo(() => {
    if (plan === "full-audit" && reportId && next === "lab") return `/lab?report=${reportId}`;
    return "/account";
  }, [next, plan, reportId]);
  const primaryLabel = primaryHref.startsWith("/lab?") ? "Open visibility lab" : "Open account";

  const complete = async () => {
    setState("working");
    try {
      const response = await fetch("/api/billing/sandbox-checkout/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      if (!response.ok) throw new Error("Sandbox checkout failed");
      setState("complete");
    } catch {
      setState("error");
    }
  };

  return (
    <section className="checkout-shell">
      <div className="checkout-copy">
        <p className="lead-line light">PAYMENT REHEARSAL / TEST MODE</p>
        <h1>Checkout without the <span>charge.</span></h1>
        <p>{plan === "full-audit" && reportId ? "This sandbox validates the unlock flow for a saved report, including account access, order records and premium delivery." : "This sandbox validates account access, order records and premium delivery. It cannot accept card details and will never move real money."}</p>
        <div className="sandbox-warning"><strong>SANDBOX ONLY</strong><span>Do not enter payment information. No external payment processor is connected.</span></div>
      </div>
      <div className="checkout-card">
        {state !== "complete" ? <>
          <span>TEST ORDER / {plan.toUpperCase()}</span>
          <h2>{selected.name}</h2>
          <strong>{selected.price}<small> simulated</small></strong>
          <dl><div><dt>Account</dt><dd>{email}</dd></div><div><dt>Delivery</dt><dd>{selected.detail}</dd></div>{reportId && <div><dt>Saved report</dt><dd>{reportId}</dd></div>}<div><dt>Charge today</dt><dd>$0.00</dd></div></dl>
          <button type="button" onClick={() => void complete()} disabled={state === "working"}>{state === "working" ? "Creating test order…" : "Complete sandbox order"}<span>↗</span></button>
          {state === "error" && <p role="alert">The test order could not be created. Please try again.</p>}
        </> : <div className="checkout-success"><i>✓</i><span>TEST ORDER COMPLETE</span><h2>No payment was processed.</h2><p>{primaryHref.startsWith("/lab?") ? "Your sandbox entitlement is active. The selected saved report can now open the visibility lab." : "Your sandbox entitlement is active and recorded in your private account."}</p><Link href={primaryHref}>{primaryLabel} <b>↗</b></Link><Link href={reportId ? `/report?id=${reportId}` : "/report"}>{reportId ? "Return to report" : "View latest report"} <b>↗</b></Link></div>}
      </div>
    </section>
  );
}
