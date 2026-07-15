import type { Metadata } from "next";
import { InfoPage } from "../info-pages";

export const metadata: Metadata = {
  title: "Research — GEOCITATION",
  description: "The research model behind GEOCITATION: what to capture, how to score AI visibility and how evidence-backed reports are produced.",
};

const researchLayers = [
  {
    index: "01",
    title: "Discovery surface",
    copy: "We start with what answer engines can actually reach: robots.txt, sitemap.xml, canonical pages, internal links, status codes, redirects and machine-readable guidance such as llms.txt.",
    signal: "crawl",
  },
  {
    index: "02",
    title: "Machine understanding",
    copy: "Pages are reviewed for extractable answer blocks, entity clarity, headings, schema, organization facts, authorship, pricing and topical relationships that help an AI system build confidence.",
    signal: "parse",
  },
  {
    index: "03",
    title: "Trust evidence",
    copy: "The report separates claims from proof: first-party evidence, external references, freshness, contactability, policy pages, structured data and consistency across the public site.",
    signal: "verify",
  },
  {
    index: "04",
    title: "Citation readiness",
    copy: "Each finding is translated into actions a team can ship: answer-first page sections, schema patches, crawler policy fixes, llms.txt improvements and model-testing prompts.",
    signal: "cite",
  },
];

const reportOutputs = [
  "Executive score with grade and confidence band",
  "Crawler access matrix for public AI agents",
  "Page-level evidence with source-linked findings",
  "Entity and trust gap map",
  "Answer extractability review",
  "Copy-ready JSON-LD and llms.txt recommendations",
  "Prioritized 30/60/90-day roadmap",
  "Premium model-observation prompts and citation log",
];

export default function ResearchPage() {
  return (
    <InfoPage
      eyebrow="RESEARCH / AI VISIBILITY"
      title="A research layer for answer-engine visibility."
      intro="GEOCITATION treats AI visibility as an evidence problem: what can be discovered, what can be understood, what can be trusted and what is ready to be cited."
    >
      <div className="research-page-shell">
        <section className="research-manifesto">
          <div>
            <span>RESEARCH PREMISE</span>
            <h2>People will pay only when the report shows what changed, why it matters and exactly what to do next.</h2>
          </div>
          <p>
            The product logic is built around a simple promise: do not sell vague GEO advice. Capture public evidence, convert it into measurable signals, explain the risk in plain language and produce fixes that a founder, marketer or developer can act on immediately.
          </p>
        </section>

        <section className="research-radar" aria-label="GEOCITATION research layers">
          <div className="research-radar-visual" aria-hidden="true">
            <i />
            <i />
            <i />
            <b>GEO</b>
            <span>DISCOVER</span>
            <span>UNDERSTAND</span>
            <span>TRUST</span>
            <span>CITE</span>
          </div>
          <div className="research-layer-grid">
            {researchLayers.map((layer) => (
              <article className="research-layer-card" key={layer.index}>
                <div><span>{layer.index}</span><small>{layer.signal}</small></div>
                <h3>{layer.title}</h3>
                <p>{layer.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="research-output-panel">
          <div>
            <p className="lead-line light">REPORT ARCHITECTURE</p>
            <h2>From crawl evidence to client-ready decisions.</h2>
            <p>Every paid report should feel worth opening twice: once for the strategic picture and once for the implementation checklist.</p>
          </div>
          <ul>
            {reportOutputs.map((output, index) => (
              <li key={output}><span>{String(index + 1).padStart(2, "0")}</span>{output}</li>
            ))}
          </ul>
        </section>

        <section className="research-note-grid">
          <article>
            <span>CAPTURE</span>
            <h3>What the scanner should preserve.</h3>
            <p>URL, fetch status, page role, visible headings, metadata, schema types, robots rules, sitemap presence, link context, llms.txt content and the source snippet behind every recommendation.</p>
          </article>
          <article>
            <span>SCORE</span>
            <h3>How the score should earn trust.</h3>
            <p>Use deterministic checks for the base grade, then add optional model observations as clearly labeled evidence. Never imply a model cited a page unless the observation was actually recorded.</p>
          </article>
          <article>
            <span>PRODUCE</span>
            <h3>How reports become valuable.</h3>
            <p>Show the finding, the proof, the business meaning and the exact fix. The customer should leave with a roadmap, not a mystery dashboard.</p>
          </article>
        </section>
      </div>
    </InfoPage>
  );
}
