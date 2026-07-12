import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "../info-pages";
import { getChatGPTUser } from "../chatgpt-auth";
import { ContactIntakeForm } from "./contact-intake-form";
import { getSandboxOrder } from "../../lib/billing/sandbox";

export const metadata: Metadata = {
  title: "Contact Us — SIGNAL°",
  description: "Contact SIGNAL° for AI visibility audits, GEO implementation and website citation readiness.",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ order?: string; website?: string }> }) {
  const params = await searchParams;
  const user = await getChatGPTUser();
  const orderId = typeof params.order === "string" && params.order ? params.order : null;
  const initialWebsite = typeof params.website === "string" ? params.website.slice(0, 240) : "";
  const linkedOrder = user && orderId ? await getSandboxOrder(user.email, orderId) : null;

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
      <ContactIntakeForm
        initialEmail={user?.email}
        initialName={user?.fullName ?? user?.displayName ?? ""}
        initialWebsite={initialWebsite}
        orderId={linkedOrder?.plan === "done-for-you" ? linkedOrder.id : null}
        orderReference={linkedOrder?.plan === "done-for-you" ? linkedOrder.reference : null}
      />
    </InfoPage>
  );
}
