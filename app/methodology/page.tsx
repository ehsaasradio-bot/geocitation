import type { Metadata } from "next";
import { InfoPage } from "../info-pages";

export const metadata: Metadata = {
  title: "Audit Methodology",
  description: "How GEOCITATION measures public crawler access, technical indexability, content citability, entity trust, structured data and answer readiness.",
};

const categories = [
  ["25%", "AI access", "Checks retrieval, user-fetch and training-control agents separately, plus machine guidance and discovery signals."],
  ["20%", "Content citability", "Looks for self-contained answer passages, useful hierarchy, question coverage and measurable facts."],
  ["15%", "Technical indexability", "Evaluates public fetchability, metadata, canonicals, language, sitemap health and page coverage."],
  ["15%", "Entity and trust", "Checks ownership, authorship, legal and contact paths, external evidence, dates and entity connections."],
  ["10%", "Structured data", "Parses JSON-LD types, primary entities, stable identity signals and answer-oriented markup."],
  ["15%", "Answer readiness", "Measures whether page structure supports direct, extractable answers without claiming an actual citation."],
];

export default function MethodologyPage() {
  return (
    <InfoPage
      eyebrow="METHODOLOGY / SIGNAL 2026.1"
      title="A score you can inspect, not just accept."
      intro="GEOCITATION uses deterministic checks against public source HTML and machine-readable resources. Every recommendation is tied to an observed signal."
    >
      <div className="methodology-intro">
        <article><span>SCOPE</span><h2>Discover. Understand. Trust. Cite.</h2><p>The audit follows the sequence a public retrieval system needs before it can use a website as evidence: reach the page, understand the entity, evaluate trust and extract a useful answer.</p></article>
        <article><span>BOUNDARY</span><h2>Readiness is not observed visibility.</h2><p>The current scan does not run prompts inside ChatGPT, Gemini, Claude or Perplexity. It measures the public conditions that influence retrieval and citation readiness. Live platform testing belongs to the paid analysis layer.</p></article>
      </div>
      <div className="methodology-grid">
        {categories.map(([weight, title, copy], index) => (
          <article key={title}>
            <div><span>{String(index + 1).padStart(2, "0")}</span><strong>{weight}</strong></div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
      <div className="methodology-notes">
        <article><span>WHAT IS FETCHED</span><p>Up to six public HTML pages plus robots.txt, sitemap.xml and llms.txt, with strict request, redirect, time, response-size and abuse limits.</p></article>
        <article><span>RENDERING MODE</span><p>Source HTML only. Content that appears exclusively after client-side JavaScript runs may not be fully represented in this release.</p></article>
        <article><span>NO GUARANTEE</span><p>No audit can guarantee rankings, traffic or AI citations. The report identifies observable barriers, strengths and next actions.</p></article>
      </div>
    </InfoPage>
  );
}
