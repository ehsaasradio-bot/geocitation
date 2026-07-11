import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { AccountClient } from "./account-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved Reports",
  description: "Your private AI SIGNAL° audit history.",
};

export default async function AccountPage() {
  const user = await requireChatGPTUser("/account");
  return (
    <main className="account-page" id="main-content">
      <header className="account-nav">
        <Link className="brand" href="/"><span className="brand-mark"><i /><i /><i /></span><span>SIGNAL<span className="brand-dot">°</span></span></Link>
        <div><span>{user.displayName}</span><a href={chatGPTSignOutPath("/")}>Sign out ↗</a></div>
      </header>
      <section className="account-hero">
        <p className="lead-line light">PRIVATE OBSERVATORY / AUDIT HISTORY</p>
        <h1>Your signals,<br /><span>kept in view.</span></h1>
        <p>Every audit you run while signed in is saved privately to your account. Compare scores, reopen evidence, or remove reports you no longer need.</p>
        <Link href="/#scanner">Run a new audit <span>↗</span></Link>
      </section>
      <AccountClient />
    </main>
  );
}
