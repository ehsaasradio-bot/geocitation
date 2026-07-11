# AI SIGNAL°

AI SIGNAL° is a live website observatory for public AI discoverability and citation readiness. It audits crawler access, source-HTML structure, content extractability, entity and trust signals, structured data, and machine-readable resources.

## Product surface

- Live streamed audit at `/api/audit`
- Evidence summary on the landing page
- Device-local full report at `/report`
- Methodology, FAQ, about, contact, privacy, terms, and accessibility pages
- Public `robots.txt`, `sitemap.xml`, `llms.txt`, and JSON-LD

The current pre-payment release stores the latest report in browser storage. Checkout, persistent customer reports, model-specific prompt testing, and generated PDF delivery are reserved for the next phase.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm test
```

The application uses Vinext and Cloudflare Workers-compatible APIs. `.openai/hosting.json` identifies the existing Sites project used for private publishing.
