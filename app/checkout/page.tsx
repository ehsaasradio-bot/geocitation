import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sandbox Checkout",
  description: "Test the AI SIGNAL° purchase flow without a real payment.",
};

type CheckoutPageProps = { searchParams: Promise<{ plan?: string }> };

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const requested = (await searchParams).plan;
  const plan = requested === "done-for-you" ? "done-for-you" : "full-audit";
  const user = await requireChatGPTUser(`/checkout?plan=${plan}`);
  return (
    <main className="checkout-page" id="main-content">
      <header className="account-nav"><Link className="brand" href="/"><span className="brand-mark"><i /><i /><i /></span><span>SIGNAL<span className="brand-dot">°</span></span></Link><Link href="/account">My reports ↗</Link></header>
      <CheckoutClient plan={plan} email={user.email} />
    </main>
  );
}
