import type { Metadata } from "next";
import { InfoPage } from "../info-pages";

export const metadata: Metadata = {
  title: "About Us — SIGNAL°",
  description: "Learn why SIGNAL° exists and how it helps teams become visible to answer engines.",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="ABOUT / SIGNAL OBSERVATORY"
      title="We make invisible AI visibility visible."
      intro="SIGNAL° is built for teams who know their website exists, but need proof that AI systems can actually find, read and trust it."
    >
      <div className="story-grid">
        <article className="story-card large">
          <span>MISSION</span>
          <h2>Your website should be understandable to humans and machines.</h2>
          <p>Search is changing from blue links to synthesized answers. That means websites need more than keywords: they need clear entities, accessible pages, extractable passages and proof signals that answer engines can verify.</p>
        </article>
        <article className="story-card">
          <span>METHOD</span>
          <h3>Discover. Understand. Trust. Cite.</h3>
          <p>Our audit follows the journey an AI system takes before it can mention a brand with confidence.</p>
        </article>
        <article className="story-card">
          <span>POINT OF VIEW</span>
          <h3>Evidence beats vibes.</h3>
          <p>Every recommendation should connect to an observable signal, not a generic checklist.</p>
        </article>
        <article className="story-card">
          <span>BUILT FOR</span>
          <h3>Founders, agencies and content teams.</h3>
          <p>Use SIGNAL° to see what is blocking AI visibility before investing in a redesign, content plan or GEO campaign.</p>
        </article>
      </div>
    </InfoPage>
  );
}
