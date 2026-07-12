import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "../info-pages";
import { ContactIntakeForm } from "./contact-intake-form";

export const metadata: Metadata = {
  title: "Contact Us — SIGNAL°",
  description: "Contact SIGNAL° for AI visibility audits, GEO implementation and website citation readiness.",
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="CONTACT / START A SIGNAL"
      title="Bring us the website. We’ll read the signal."
      intro="Tell us what you are trying to make visible: a brand, product, local business, publication or full content library."
    >
      <div className="contact-panel">
        <div>
          <span>BEST NEXT STEP</span>
          <h2>Run the free scan first.</h2>
          <p>The fastest way to start is to test your website, then use the result to decide whether you need a full audit or implementation help.</p>
          <Link href="/#scanner">Run free score <span>↗</span></Link>
        </div>
        <div>
          <span>PROJECT INQUIRIES</span>
          <h2>Need the full build?</h2>
          <p>For Done-For-You GEO, prepare your domain, target market, priority products or services and any current analytics or SEO reports.</p>
          <Link href="#intake">Open project intake <span>↗</span></Link>
        </div>
      </div>
      <ContactIntakeForm />
    </InfoPage>
  );
}
