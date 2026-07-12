import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { chatGPTSignOutPath, requireChatGPTUser } from "../../../chatgpt-auth";
import { getSandboxOrder } from "../../../../lib/billing/sandbox";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sandbox Order",
  description: "Review a sandbox order, entitlement, and next actions.",
};

function formatDate(value: number | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function SandboxOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireChatGPTUser(`/account/orders/${id}`);
  const order = await getSandboxOrder(user.email, id);
  if (!order) notFound();

  const reportHref = order.reportId ? `/report?id=${order.reportId}` : "/account";
  const labHref = order.reportId && order.entitlementKey === "full_audit" && order.status === "test_paid" ? `/lab?report=${order.reportId}` : null;
  const intakeHref = order.plan === "done-for-you" ? `/contact?order=${order.id}#intake` : null;

  return (
    <main className="account-page" id="main-content">
      <header className="account-nav">
        <Link className="brand" href="/"><span className="brand-mark"><i /><i /><i /></span><span>SIGNAL<span className="brand-dot">°</span></span></Link>
        <div><span>{user.displayName}</span><a href={chatGPTSignOutPath("/")}>Sign out ↗</a></div>
      </header>

      <section className="order-hero">
        <p className="lead-line light">SANDBOX RECEIPT / ORDER DETAIL</p>
        <h1>{order.reference}<br /><span>kept on record.</span></h1>
        <p>This page mirrors the purchase follow-through you would expect from a production checkout: what was unlocked, when it was confirmed, and where to continue next.</p>
      </section>

      <section className="order-detail">
        <div className="order-summary-card">
          <span>{order.status === "test_paid" ? "PAYMENT CONFIRMED" : order.status === "processing" ? "PROCESSING" : "CREATED"}</span>
          <h2>{order.plan === "full-audit" ? "Full Audit" : "Done-For-You"}</h2>
          <strong>{(order.amountCents / 100).toLocaleString("en-US", { style: "currency", currency: order.currency })}<small> sandbox</small></strong>
          <p>{order.statusDetail}</p>
          <div className="order-actions">
            <Link href={reportHref}>{order.reportId ? "Open linked report ↗" : "Back to account ↗"}</Link>
            {labHref ? <Link href={labHref}>Open visibility lab ↗</Link> : intakeHref ? <Link href={intakeHref}>Open project intake ↗</Link> : <Link href="/account">Back to account ↗</Link>}
          </div>
        </div>

        <div className="order-metadata">
          <div className="account-history-head compact"><span>ORDER TIMELINE</span><h2>Everything tied to this <span>unlock.</span></h2></div>
          <div className="order-meta-grid">
            <article><span>Reference</span><strong>{order.reference}</strong><p>Stable order handle for support, QA, and future payment receipts.</p></article>
            <article><span>Entitlement</span><strong>{order.entitlementKey === "full_audit" ? "Full Audit" : "Consultation"}</strong><p>This determines which premium surfaces become available after confirmation.</p></article>
            <article><span>Created</span><strong>{formatDate(order.createdAt)}</strong><p>The order was opened in sandbox mode and stored against your signed-in account.</p></article>
            <article><span>Confirmed</span><strong>{formatDate(order.fulfilledAt)}</strong><p>Sandbox payment confirmation activates the entitlement without moving money.</p></article>
            <article><span>Linked Report</span><strong>{order.reportId ?? "No report linked"}</strong><p>Orders created from report or lab flows preserve the report connection for follow-through.</p></article>
            <article><span>Message</span><strong>{order.plan === "done-for-you" ? "Consultation intake ready" : "Sandbox confirmation memo"}</strong><p>{order.plan === "done-for-you" ? "Use the linked intake form to submit project scope against this consultation receipt. No external email was sent yet." : "No external email was sent. This receipt page acts as the production-style confirmation surface for now."}</p></article>
          </div>
        </div>
      </section>
    </main>
  );
}
