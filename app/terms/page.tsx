import type { Metadata } from "next";
import { InfoPage } from "../info-pages";

export const metadata: Metadata = {
  title: "Terms of Service — SIGNAL°",
  description: "Terms for using SIGNAL° audits, reports and GEO implementation services.",
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="TERMS / SERVICE"
      title="Use the signal responsibly."
      intro="These terms explain the baseline expectations for using website audits and reports."
    >
      <div className="policy-stack">
        <article><span>01</span><h2>Authorized use</h2><p>Only submit websites you own, operate or have permission to evaluate. Do not use SIGNAL° to probe systems you are not allowed to assess.</p></article>
        <article><span>02</span><h2>Audit limits</h2><p>Reports are diagnostic and informational. They do not guarantee rankings, traffic, AI citations or business outcomes.</p></article>
        <article><span>03</span><h2>Pre-payment release</h2><p>Checkout is not connected in this release. Any prices shown describe planned service tiers and do not create a purchase, subscription or entitlement.</p></article>
        <article><span>04</span><h2>Availability</h2><p>The service may change as AI crawlers, answer engines, standards and website technologies evolve.</p></article>
        <article><span>05</span><h2>Responsible access</h2><p>Automated abuse, attempts to reach private networks, excessive requests and interference with the service are prohibited. Access may be limited to protect audited websites and the platform.</p></article>
      </div>
    </InfoPage>
  );
}
