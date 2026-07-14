import Link from "next/link";
import type { ReactNode } from "react";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function InfoPage({ eyebrow, title, intro, children }: InfoPageProps) {
  return (
    <main className="info-page" id="main-content">
      <header className="site-header info-header">
        <Link className="brand" href="/">
          <img className="brand-logo" src="/geocitation-logo.png" alt="GEOCITATION" />
        </Link>
        <nav aria-label="Page navigation">
          <Link href="/methodology">Method</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <details className="mobile-menu">
          <summary>Menu</summary>
          <div><Link href="/methodology">Method</Link><Link href="/faq">FAQ</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/#scanner">Run an audit</Link></div>
        </details>
        <Link className="header-cta" href="/#scanner">Run an audit <span>↗</span></Link>
      </header>

      <section className="info-hero">
        <div className="info-grid-bg" aria-hidden="true" />
        <p className="lead-line light">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>

      <section className="info-content">
        {children}
      </section>

      <section className="info-cta">
        <div>
          <p>READY TO SEE THE SIGNAL?</p>
          <h2>Run the crawl before AI chooses someone else.</h2>
        </div>
        <Link href="/#scanner">Test now <span>↗</span></Link>
      </section>

      <footer>
        <Link className="brand footer-brand" href="/">
          <img className="brand-logo" src="/geocitation-logo.png" alt="GEOCITATION" />
        </Link>
        <p>AI visibility, made observable.</p>
        <div>
          <Link href="/faq">FAQ</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/accessibility">Accessibility</Link>
        </div>
        <span>© 2026 GEOCITATION</span>
      </footer>
    </main>
  );
}
