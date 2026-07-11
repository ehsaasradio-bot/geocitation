import type { AuditResult } from "../../app/audit-types";

export function visibilityPromptPack(report: AuditResult) {
  const domain = report.domain;
  const topic = report.pages.find((page) => page.title)?.title || domain;
  return [
    { key: "brand-knowledge", label: "Brand knowledge", text: `What is ${domain}, what does it offer, and which sources support the answer?` },
    { key: "category-recommendation", label: "Category recommendation", text: `What are trustworthy alternatives or providers related to ${topic}? Include source links.` },
    { key: "evidence-question", label: "Evidence retrieval", text: `Using public evidence, summarize the expertise and trust signals available on ${domain}. Cite the exact pages used.` },
  ];
}
