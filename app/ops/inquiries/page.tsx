import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignOutPath } from "../../chatgpt-auth";
import { requireSignalAdmin } from "../../../lib/admin/access";
import { InquiriesAdmin } from "./inquiries-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ops Inquiry Queue",
  description: "Review and manage done-for-you project intake for GEOCITATION.",
};

export default async function OpsInquiriesPage() {
  const user = await requireSignalAdmin("/ops/inquiries");

  if (!user) {
    return (
      <main className="account-page" id="main-content">
        <header className="account-nav">
          <Link className="brand" href="/"><img className="brand-logo" src="/geocitation-logo.png" alt="GEOCITATION" /></Link>
          <Link href="/account">My reports ↗</Link>
        </header>
        <section className="account-hero">
          <p className="lead-line light">OPS / ACCESS REQUIRED</p>
          <h1>Admin review is <span>not enabled.</span></h1>
          <p>This queue is restricted to emails listed in <code>SIGNAL_ADMIN_EMAILS</code>. Add your admin email there before using the operations workspace.</p>
          <Link href="/account">Back to account <span>↗</span></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="account-page" id="main-content">
      <header className="account-nav">
        <Link className="brand" href="/"><img className="brand-logo" src="/geocitation-logo.png" alt="GEOCITATION" /></Link>
        <div><span>{user.displayName}</span><a href={chatGPTSignOutPath("/")}>Sign out ↗</a></div>
      </header>
      <section className="account-hero">
        <p className="lead-line light">PRIVATE OPS / PROJECT REVIEW</p>
        <h1>Every inquiry,<br /><span>kept actionable.</span></h1>
        <p>Review done-for-you requests, move them across stages, and keep consultation follow-through visible from one protected queue.</p>
        <Link href="/contact#intake">Open public intake form <span>↗</span></Link>
      </section>
      <InquiriesAdmin />
    </main>
  );
}
