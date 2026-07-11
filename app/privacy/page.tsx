import type { Metadata } from "next";
import { InfoPage } from "../info-pages";

export const metadata: Metadata = {
  title: "Privacy Policy — SIGNAL°",
  description: "SIGNAL° privacy policy for website audits, submitted URLs and contact information.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="PRIVACY / POLICY"
      title="Privacy for the signal you share."
      intro="A plain-language policy for how SIGNAL° handles submitted websites, audit activity and private saved reports."
    >
      <div className="policy-stack">
        <article><span>01</span><h2>Information processed</h2><p>When you run an audit, SIGNAL° processes the website URL you submit and public content fetched from that website. Do not submit private credentials or non-public network addresses.</p></article>
        <article><span>02</span><h2>How it is used</h2><p>The submitted URL and fetched public signals are used to calculate the requested audit, return evidence and protect the service from misuse.</p></article>
        <article><span>03</span><h2>Public website data</h2><p>Audit checks are based on public pages, metadata, robots rules, structured data and other publicly reachable signals.</p></article>
        <article><span>04</span><h2>Report storage</h2><p>Your latest completed report remains available in browser storage on your device. If you sign in with ChatGPT, audits run while signed in are also saved privately so you can reopen or delete them from your account history.</p></article>
        <article><span>05</span><h2>Identity and privacy</h2><p>Saved reports are owned through a salted one-way identifier derived from your signed-in account. The report table stores the scanned URL, evidence, score and timestamp, but not your email address.</p></article>
        <article><span>06</span><h2>Infrastructure and abuse prevention</h2><p>The hosting platform may process limited security and operational logs. SIGNAL° uses salted one-way identifiers with short expiration windows to enforce audit limits without storing raw network addresses in its rate-limit table.</p></article>
        <article><span>07</span><h2>Sandbox orders</h2><p>Test-mode checkout stores a sandbox plan, simulated amount, status and timestamp under your one-way account identifier. It does not request or store card information and does not contact a payment processor.</p></article>
        <article><span>08</span><h2>Visibility lab observations</h2><p>If you use the premium visibility lab, SIGNAL° stores the platform, generated test prompt, outcome you select, and optional notes or source URL. These are manual observations you provide and are removed when you delete the associated saved report.</p></article>
        <article><span>09</span><h2>Last updated</h2><p>July 12, 2026. This policy will be updated before real payment processing or automated provider testing is introduced.</p></article>
      </div>
    </InfoPage>
  );
}
