import type { Metadata } from "next";
import { InfoPage } from "../info-pages";

export const metadata: Metadata = {
  title: "Accessibility — GEOCITATION",
  description: "Accessibility statement for GEOCITATION.",
};

export default function AccessibilityPage() {
  return (
    <InfoPage
      eyebrow="ACCESSIBILITY / STATEMENT"
      title="Readable signals for everyone."
      intro="GEOCITATION is designed for people navigating with keyboards, screen readers, zoom, reduced motion and assistive technologies."
    >
      <div className="policy-stack">
        <article><span>01</span><h2>Our intent</h2><p>We aim for clear structure, readable contrast, keyboard-accessible controls and semantic content across the website.</p></article>
        <article><span>02</span><h2>Motion</h2><p>The interface includes visual motion and respects the reduced-motion preference. Essential audit content remains available without animation.</p></article>
        <article><span>03</span><h2>Feedback</h2><p>If something is hard to use, note the page URL, device, browser and assistive technology details. A direct accessibility contact channel will be added with public launch.</p></article>
      </div>
    </InfoPage>
  );
}
