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
      intro="A plain-language policy for how SIGNAL° handles submitted websites, audit activity and device-local reports."
    >
      <div className="policy-stack">
        <article><span>01</span><h2>Information processed</h2><p>When you run an audit, SIGNAL° processes the website URL you submit and public content fetched from that website. Do not submit private credentials or non-public network addresses.</p></article>
        <article><span>02</span><h2>How it is used</h2><p>The submitted URL and fetched public signals are used to calculate the requested audit, return evidence and protect the service from misuse.</p></article>
        <article><span>03</span><h2>Public website data</h2><p>Audit checks are based on public pages, metadata, robots rules, structured data and other publicly reachable signals.</p></article>
        <article><span>04</span><h2>Report storage</h2><p>This pre-payment release does not create an account or store a report in an application database. Your latest completed report is saved in browser storage on your device so you can open the report page.</p></article>
        <article><span>05</span><h2>Infrastructure</h2><p>The hosting platform may process limited security and operational logs, such as request times and network information, under its own service terms. Reports can be removed from your device by clearing site data.</p></article>
        <article><span>06</span><h2>Last updated</h2><p>July 11, 2026. This policy will be updated before accounts, payment processing or persistent report storage are introduced.</p></article>
      </div>
    </InfoPage>
  );
}
