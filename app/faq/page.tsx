import type { Metadata } from "next";
import { InfoPage } from "../info-pages";

export const metadata: Metadata = {
  title: "FAQ — SIGNAL°",
  description: "Answers about AI visibility, GEO audits, crawler access, citations, pricing and implementation.",
};

const faqs = [
  ["What does SIGNAL° test?", "SIGNAL° checks whether AI systems can discover, understand, trust and cite your website. It looks at crawl access, structured data, extractable passages, entity clarity and trust signals."],
  ["Is this the same as SEO?", "Not exactly. SEO focuses on ranking in search results. SIGNAL° focuses on whether answer engines can read your site, reason about it and confidently mention it in generated answers."],
  ["What is GEO?", "GEO means Generative Engine Optimization: shaping your public website so AI answer systems can access accurate, attributable and citation-ready information."],
  ["Do you guarantee AI citations?", "No honest audit can guarantee citations. SIGNAL° shows the barriers and opportunities that influence whether AI systems can confidently use your content."],
  ["What do I get in the free score?", "You get a visibility snapshot, crawler-access checks, priority warnings and a device-local evidence report. Payment for model-specific platform tests and the prioritized roadmap opens in the next phase."],
  ["Can you fix the issues for us?", "Yes. The Done-For-You option covers technical fixes, schema, llms.txt, answer-first content structure and ongoing monitoring."],
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export default function FAQPage() {
  return (
    <InfoPage
      eyebrow="FAQ / AI SIGNAL"
      title="Questions answer engines would ask."
      intro="Straight answers about how the audit works, what it can prove and where human strategy still matters."
    >
      <div className="faq-list">
        {faqs.map(([question, answer], index) => (
          <article className="faq-item" key={question}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{question}</h2>
            <p>{answer}</p>
          </article>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
    </InfoPage>
  );
}
