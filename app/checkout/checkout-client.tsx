"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useState } from "react";

type SandboxPlan = "full-audit" | "done-for-you";
type SandboxOrder = {
  id: string;
  reference: string;
  plan: SandboxPlan;
  reportId: string | null;
  entitlementKey: "full_audit" | "consultation";
  amountCents: number;
  currency: string;
  status: "created" | "processing" | "test_paid";
  statusDetail: string;
  createdAt: number;
  updatedAt: number;
  fulfilledAt: number | null;
};

const planCopy = {
  "full-audit": { name: "Full Audit", price: "$19.99", detail: "Premium action plan access" },
  "done-for-you": { name: "Done-For-You", price: "$2,000+", detail: "Consultation request rehearsal" },
};

export function CheckoutClient({ plan, email, reportId, next }: { plan: SandboxPlan; email: string; reportId?: string; next?: "lab" | "account" }) {
  const [state, setState] = useState<"ready" | "creating" | "review" | "processing" | "complete" | "error">("ready");
  const [order, setOrder] = useState<SandboxOrder | null>(null);
  const selected = planCopy[plan];
  const primaryHref = useMemo(() => {
    if (plan === "full-audit" && reportId && next === "lab") return `/lab?report=${reportId}`;
    if (plan === "done-for-you") return order ? `/contact?order=${order.id}#intake` : "/contact#intake";
    return "/account";
  }, [next, order, plan, reportId]);
  const primaryLabel = primaryHref.startsWith("/lab?") ? "Open visibility lab" : primaryHref.startsWith("/contact") ? "Open project intake" : "Open account";
  const orderHref = order ? `/account/orders/${order.id}` : "/account";

  const createOrder = async () => {
    setState("creating");
    try {
      const response = await fetch("/api/billing/sandbox-checkout/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", plan, reportId }) });
      const payload = await response.json().catch(() => null) as { order?: SandboxOrder } | null;
      if (!response.ok || !payload?.order) throw new Error("Sandbox checkout failed");
      setOrder(payload.order);
      setState("review");
    } catch {
      setState("error");
    }
  };

  const completeOrder = async () => {
    if (!order) return;
    setState("processing");
    try {
      const response = await fetch("/api/billing/sandbox-checkout/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", orderId: order.id }) });
      const payload = await response.json().catch(() => null) as { order?: SandboxOrder } | null;
      if (!response.ok || !payload?.order) throw new Error("Sandbox confirmation failed");
      setOrder(payload.order);
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
          <span>{state === "review" || state === "processing" ? "PAYMENT REVIEW / READY" : "TEST ORDER / PREPARE"}</span>
          <h2>{selected.name}</h2>
          <strong>{selected.price}<small> simulated</small></strong>
          <dl>
            <div><dt>Account</dt><dd>{email}</dd></div>
            <div><dt>Delivery</dt><dd>{selected.detail}</dd></div>
            {reportId && <div><dt>Saved report</dt><dd>{reportId}</dd></div>}
            <div><dt>Charge today</dt><dd>$0.00</dd></div>
            {order && <div><dt>Order ref</dt><dd>{order.reference}</dd></div>}
            {order && <div><dt>Status</dt><dd>{order.statusDetail}</dd></div>}
          </dl>
          {!order ? <button type="button" onClick={() => void createOrder()} disabled={state === "creating"}>{state === "creating" ? "Preparing sandbox order…" : "Create sandbox order"}<span>↗</span></button> : <button type="button" onClick={() => void completeOrder()} disabled={state === "processing"}>{state === "processing" ? "Confirming sandbox payment…" : "Confirm sandbox payment"}<span>↗</span></button>}
          {(state === "review" || (state === "error" && order)) && <p role="status">Review the test order details above, then simulate payment confirmation to unlock access.</p>}
          {state === "error" && <p role="alert">{order ? "Sandbox confirmation did not finish. Please retry the test payment." : "The sandbox payment flow could not continue. Please try again."}</p>}
        </> : <div className="checkout-success"><i>✓</i><span>TEST ORDER COMPLETE</span><h2>No payment was processed.</h2><p>{primaryHref.startsWith("/lab?") ? "Your sandbox entitlement is active. The selected saved report can now open the visibility lab." : primaryHref.startsWith("/contact") ? "Your sandbox consultation entitlement is active. You can now send the full done-for-you project intake." : "Your sandbox entitlement is active and recorded in your private account."}</p><dl className="checkout-receipt"><div><dt>Order ref</dt><dd>{order?.reference}</dd></div><div><dt>Status</dt><dd>{order?.statusDetail}</dd></div><div><dt>Entitlement</dt><dd>{order?.entitlementKey === "full_audit" ? "Full Audit" : "Consultation"}</dd></div></dl><Link href={primaryHref}>{primaryLabel} <b>↗</b></Link><Link href={orderHref}>Open sandbox receipt <b>↗</b></Link><Link href={reportId ? `/report?id=${reportId}` : "/report"}>{reportId ? "Return to report" : "View latest report"} <b>↗</b></Link></div>}
      </div>
    </section>
  );
}
