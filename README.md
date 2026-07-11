# AI SIGNAL°

AI SIGNAL° is a live website observatory for public AI discoverability and citation readiness. It audits crawler access, source-HTML structure, content extractability, entity and trust signals, structured data, and machine-readable resources.

## Product surface

- Live streamed audit at `/api/audit`
- Evidence summary on the landing page
- Full evidence report at `/report`, with durable account-owned copies for signed-in users
- ChatGPT sign-in and private audit history at `/account`
- Methodology, FAQ, about, contact, privacy, terms, and accessibility pages
- Public `robots.txt`, `sitemap.xml`, `llms.txt`, and JSON-LD

The current pre-payment release keeps the latest report in browser storage for anonymous visitors and saves reports durably for signed-in users. Checkout, model-specific prompt testing, and generated PDF delivery remain reserved for later phases.

Phase 1 production protection uses D1-backed salted rate-limit identifiers, bounded crawl budgets, same-origin request enforcement and centralized security headers.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm test
```

The application uses Vinext and Cloudflare Workers-compatible APIs. `.openai/hosting.json` identifies the existing Sites project used for private publishing.
