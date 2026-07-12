import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sandbox Checkout",
  description: "Test the AI SIGNAL° purchase flow without a real payment.",
};

type CheckoutPageProps = { searchParams: Promise<{ plan?: string; report?: string; next?: string }> };

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const requested = params.plan;
  const plan = requested === "done-for-you" ? "done-for-you" : "full-audit";
  const reportId = /^[a-f0-9]{32}$/.test(params.report ?? "") ? params.report! : "";
  const next = params.next === "lab" ? "lab" : "account";
  const returnParams = new URLSearchParams({ plan });
  if (reportId) returnParams.set("report", reportId);
  if (reportId && next === "lab") returnParams.set("next", next);
  const user = await requireChatGPTUser(`/checkout?${returnParams.toString()}`);
  return (
    <main className="checkout-page" id="main-content">
      <header className="account-nav"><Link className="brand" href="/"><span className="brand-mark"><i /><i /><i /></span><span>SIGNAL<span className="brand-dot">°</span></span></Link><Link href="/account">My reports ↗</Link></header>
      <CheckoutClient plan={plan} email={user.email} reportId={reportId} next={next} />
    </main>
  );
}
