# AI SIGNAL°

AI SIGNAL° is a live website observatory for public AI discoverability and citation readiness. It audits crawler access, source-HTML structure, content extractability, entity and trust signals, structured data, and machine-readable resources.

## Product surface

- Live streamed audit at `/api/audit`
- Evidence summary on the landing page
- Full evidence report at `/report`, with durable account-owned copies for signed-in users
- ChatGPT sign-in and private audit history at `/account`
- Done-for-you consultation intake at `/contact`, with durable inquiry records and optional sandbox receipt linkage
- Methodology, FAQ, about, contact, privacy, terms, and accessibility pages
- Public `robots.txt`, `sitemap.xml`, `llms.txt`, and JSON-LD

The current pre-payment release keeps the latest report in browser storage for anonymous visitors and saves reports durably for signed-in users. Real payment processing, model-specific prompt testing, and generated PDF delivery remain reserved for later phases.

Phase 3 includes an explicitly labeled payment sandbox. It records simulated orders and entitlements for end-to-end product testing, accepts no card data, and processes no real money.

Phase 4 adds a premium visibility lab for consistent manual prompt testing across ChatGPT, Perplexity, Gemini, Claude, and Copilot. Observations are stored as user-provided evidence; no provider is represented as automatically tested until its real API is connected. Reports can also be exported as JSON and findings as CSV.

Phase 5 adds a credential-gated OpenAI Responses API adapter with web search, clickable source extraction, target-domain citation detection, a ten-runs-per-day account budget, and durable automated run evidence. The adapter stays disabled unless `OPENAI_API_KEY` is configured in hosted runtime secrets; `OPENAI_VISIBILITY_MODEL` optionally overrides the documented default.

Phase 6 completes the sandbox-era premium funnel: receipt tracking, context-preserving sign-in handoff, done-for-you project intake, and account-visible intake history linked to consultation orders where available.

Phase 7 begins the production operations layer: an admin-only inquiry queue, protected review access via `SIGNAL_ADMIN_EMAILS`, and tracked status changes for done-for-you project requests.

Phase 1 production protection uses D1-backed salted rate-limit identifiers, bounded crawl budgets, same-origin request enforcement and centralized security headers.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm test
```

The application uses Vinext and Cloudflare Workers-compatible APIs. `.openai/hosting.json` identifies the existing Sites project used for private publishing.
