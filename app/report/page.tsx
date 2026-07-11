import type { Metadata } from "next";
import { ReportClient } from "./report-client";

export const metadata: Metadata = {
  title: "Evidence Report — SIGNAL°",
  description: "Review the crawler access, page evidence, structured data and citation-readiness findings from your latest SIGNAL° audit.",
};

export default function ReportPage() {
  return <ReportClient />;
}
