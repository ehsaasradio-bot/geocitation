import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { VisibilityLab } from "./visibility-lab";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Visibility Lab", description: "Run and document model-specific citation observations against saved SIGNAL° reports." };

export default async function LabPage({ searchParams }: { searchParams: Promise<{ report?: string }> }) {
  const reportId = (await searchParams).report ?? "";
  await requireChatGPTUser(reportId ? `/lab?report=${encodeURIComponent(reportId)}` : "/lab");
  return <main className="lab-page" id="main-content"><header className="account-nav"><Link className="brand" href="/"><span className="brand-mark"><i /><i /><i /></span><span>SIGNAL<span className="brand-dot">°</span></span></Link><Link href="/account">My reports ↗</Link></header><VisibilityLab reportId={reportId} /></main>;
}
