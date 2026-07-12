import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";
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
  const returnTo = `/checkout?${returnParams.toString()}`;
  const user = await getChatGPTUser();
  return (
    <main className="checkout-page" id="main-content">
      <header className="account-nav"><Link className="brand" href="/"><span className="brand-mark"><i /><i /><i /></span><span>SIGNAL<span className="brand-dot">°</span></span></Link><Link href={user ? "/account" : chatGPTSignInPath(returnTo)}>{user ? "My reports ↗" : "Sign in ↗"}</Link></header>
      {user ? (
        <CheckoutClient plan={plan} email={user.email} reportId={reportId} next={next} />
      ) : (
        <section className="checkout-shell">
          <div className="checkout-copy">
            <p className="lead-line light">PAYMENT REHEARSAL / SIGN IN REQUIRED</p>
            <h1>Keep this unlock tied to the <span>right report.</span></h1>
            <p>{plan === "full-audit" && reportId ? "Sign in with ChatGPT before sandbox checkout so this report, the unlock, and the next lab step stay connected all the way through." : "Sign in with ChatGPT before sandbox checkout so the order, entitlement, and receipt stay attached to your private account."}</p>
            <div className="sandbox-warning"><strong>CONTEXT PRESERVED</strong><span>Your selected plan, report link, and next step will follow you through sign-in and return you to this exact checkout state.</span></div>
          </div>
          <div className="checkout-card checkout-gate">
            <span>PRIVATE FLOW / ACCOUNT HANDOFF</span>
            <h2>Sign in to continue.</h2>
            <p>This keeps sandbox orders, receipts, premium access, and report follow-through inside the same signed-in account.</p>
            <dl>
              <div><dt>Plan</dt><dd>{plan === "full-audit" ? "Full Audit" : "Done-For-You"}</dd></div>
              <div><dt>Report</dt><dd>{reportId || "No saved report linked yet"}</dd></div>
              <div><dt>Next step</dt><dd>{reportId && next === "lab" ? "Return here, then open the visibility lab" : "Return here, then unlock from your account flow"}</dd></div>
            </dl>
            <Link href={chatGPTSignInPath(returnTo)}>Sign in with ChatGPT <b>↗</b></Link>
          </div>
        </section>
      )}
    </main>
  );
}
