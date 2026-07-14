import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";
import { VisibilityLab } from "./visibility-lab";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Visibility Lab", description: "Run and document model-specific citation observations against saved GEOCITATION reports." };

export default async function LabPage({ searchParams }: { searchParams: Promise<{ report?: string }> }) {
  const params = await searchParams;
  const reportId = /^[a-f0-9]{32}$/.test(params.report ?? "") ? params.report! : "";
  const returnTo = reportId ? `/lab?report=${reportId}` : "/lab";
  const user = await getChatGPTUser();

  return <main className="lab-page" id="main-content"><header className="account-nav"><Link className="brand" href="/"><img className="brand-logo" src="/geocitation-logo.png" alt="GEOCITATION" /></Link><Link href={user ? "/account" : chatGPTSignInPath(returnTo)}>{user ? "My reports ↗" : "Sign in ↗"}</Link></header>{user ? <VisibilityLab reportId={reportId} /> : <section className="lab-empty lab-gate"><p className="lead-line light">VISIBILITY LAB / SIGN IN REQUIRED</p><h1>Sign in before the observation <span>starts.</span></h1><p>{reportId ? "This saved report is ready for premium lab work. Sign in with ChatGPT and we will bring you back to this exact report-linked lab route." : "The visibility lab records premium observations against saved reports. Sign in first so every test stays tied to your private history."}</p><div className="lab-gate-actions"><Link href={chatGPTSignInPath(returnTo)}>Sign in with ChatGPT ↗</Link>{reportId ? <Link href={`/report?id=${reportId}`}>Back to report ↗</Link> : <Link href="/account">Open account ↗</Link>}</div></section>}</main>;
}
