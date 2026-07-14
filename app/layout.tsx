import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "./site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GEOCITATION — Citation readiness, made observable",
    template: "%s | GEOCITATION",
  },
  description: "Audit how public AI crawlers can discover, understand and evaluate your website. See evidence behind every citation-readiness signal.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "GEOCITATION — Citation readiness, made observable",
    description: "Run a live, evidence-backed audit of AI crawler access, content citability, structured data and trust signals.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "GEOCITATION citation-readiness observatory" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GEOCITATION — Citation readiness, made observable",
    description: "See what AI can find. Fix what it cannot.",
    images: ["/og.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: "An evidence-backed observatory for AI visibility and website citation readiness.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#audit-service`,
      name: "AI citation-readiness audit",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: "Worldwide",
      serviceType: "Generative engine optimization and public website audit",
      url: `${SITE_URL}/#scanner`,
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <a className="skip-link" href="#main-content">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
