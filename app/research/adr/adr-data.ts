// Mirrors ~/Documents/mirqab/docs/adr/*.md — the venture's canonical decision log.
// To add a new ADR: append a record here after writing the .md file in the
// mirqab repo. This page is presentation only; the .md files are the source
// of truth. See ADR-004 for the sync convention.

export type ReqStatus = "done" | "in-progress" | "blocked" | "pending";
export type Owner = "founder" | "owais" | "ali" | "all";
export type AdrStatus = "accepted" | "proposed" | "rejected" | "superseded";

export interface Requirement {
  task: string;
  owner: Owner;
  target: string;
  targetSort: number;
  status: ReqStatus;
  note?: string;
}

export interface AdrRecord {
  number: string;
  slug: string;
  title: string;
  status: AdrStatus;
  statusLabel: string;
  date: string;
  deciders: string;
  appliesTo: string;
  context: string;
  decisionSummary: string[];
  requirements: Requirement[];
}

export const OWNER_LABEL: Record<Owner, string> = {
  founder: "Founder",
  owais: "Owais",
  ali: "Ali",
  all: "All three",
};

export const STATUS_LABEL: Record<ReqStatus, string> = {
  done: "Done",
  "in-progress": "In progress",
  blocked: "Blocked",
  pending: "Pending",
};

export const ADRS: AdrRecord[] = [
  {
    number: "001",
    slug: "pilot-architecture",
    title: "Mirqab Pilot: Architecture & Operating Model",
    status: "accepted",
    statusLabel: "Accepted",
    date: "2026-07-15",
    deciders: "Founder · Owais (PM) · Ali (Tech Lead)",
    appliesTo: "The Mirqab pilot repo (~/Documents/mirqab)",
    context:
      "The founding decision for the Mirqab pilot: a three-person team building an Arabic-first AI visibility platform for Saudi Arabia, where Ali (AI) does all engineering but never grades its own work, Owais is the acceptance gate, and the Founder is the release gate and commercial owner.",
    decisionSummary: [
      "Team model: Ali as AI tech lead (engineering + design + Arabic linguistics, never self-accepting), Owais as PM/acceptance gate, Founder as product/commercial owner and release gate.",
      "Architecture: Next.js + tRPC monolith on GCP me-central2 (Dammam); Python workers + BullMQ; Cloud SQL Postgres 16 + pgvector with RLS; GCS evidence store; LiteLLM gateway; Playwright for Google AIO capture only; PostHog + Sentry + Grafana; Terraform + GitHub Actions with a golden-set eval gate in CI.",
      "Scope: 6 design partners, 50 AR/EN prompt-pairs per brand, 3 API engines + AIO (beta), 150→300 answer golden set, invite-only onboarding, Moyasar payment links + ZATCA invoices.",
      "Definition of Done ladder: task-done (Ali) → story-done (Owais) → release-done (Founder).",
      "Quality bars: ≥95% presence / ≥90% sentiment on golden set; <5% run failure; day-90 written Scale / Iterate / Redirect decision.",
    ],
    requirements: [
      { task: "Confirm PRD v2.0 or mark up disputes", owner: "founder", target: "Week 0", targetSort: 0, status: "done" },
      { task: "GCP (Dammam) billing account", owner: "founder", target: "Week 0", targetSort: 0, status: "pending", note: "Unblocks all infrastructure — Ali applies Terraform the same day" },
      { task: "25-target partner list", owner: "founder", target: "Week 0", targetSort: 0, status: "pending" },
      { task: "\"Mirqab\" name — trademark + domain check", owner: "founder", target: "Week 0", targetSort: 0, status: "in-progress", note: ".sa registration deferred with the CR (ADR-003)" },
      { task: "Repo scaffold, CI pipeline, eval gate wiring", owner: "ali", target: "Week 0", targetSort: 0, status: "done" },
      { task: "Prompt seed template library (AR/EN)", owner: "ali", target: "Week 0", targetSort: 0, status: "in-progress", note: "Drafted — awaiting founder's native-speaker review" },
      { task: "Terraform skeleton for Dammam infra", owner: "ali", target: "Week 0", targetSort: 0, status: "blocked", note: "Written and validated; apply is blocked on the founder's GCP billing account" },
      { task: "Convert PRD §4 into sprint backlog", owner: "owais", target: "Week 0", targetSort: 0, status: "in-progress", note: "Drafted by Ali — awaiting Owais sign-off" },
      { task: "Calendar the rituals; stand up team channel + CRM board", owner: "owais", target: "Week 0", targetSort: 0, status: "pending" },
      { task: "Sprint 1 — tenancy, auth, RTL design system", owner: "ali", target: "Weeks 1–2", targetSort: 7, status: "pending" },
      { task: "Partner recruiting outreach begins", owner: "founder", target: "Weeks 1–4", targetSort: 10, status: "pending" },
      { task: "Sprint 2 — engine harness, extraction v1, golden-set tooling", owner: "ali", target: "Weeks 3–4", targetSort: 21, status: "pending" },
      { task: "Labeling blocks (2× weekly, 45 min)", owner: "founder", target: "Ongoing from Week 3", targetSort: 22, status: "pending" },
      { task: "Story acceptance QA — the release gate in motion", owner: "owais", target: "Ongoing from Week 1", targetSort: 8, status: "pending" },
      { task: "Sprint 3 — SoV dashboard, evidence browser", owner: "ali", target: "Weeks 5–6", targetSort: 35, status: "pending" },
      { task: "Sprint 4 — Gap view, AIO capture (beta)", owner: "ali", target: "Weeks 7–8", targetSort: 49, status: "pending" },
      { task: "Sprint 5 — AR/EN reports, Moyasar billing", owner: "ali", target: "Weeks 9–10", targetSort: 63, status: "pending" },
      { task: "Day-75 conversion conversations with design partners", owner: "founder", target: "Day 75", targetSort: 75, status: "pending" },
      { task: "Sprint 6 — hardening, day-90 review pack", owner: "ali", target: "Weeks 11–12", targetSort: 77, status: "pending" },
      { task: "Day-90 decision meeting: Scale / Iterate / Redirect", owner: "all", target: "Day 90", targetSort: 90, status: "pending", note: "Written decision, signed by all three" },
    ],
  },
  {
    number: "002",
    slug: "research-distribution",
    title: "Private Research Distribution via GEOCITATION",
    status: "accepted",
    statusLabel: "Accepted",
    date: "2026-07-15",
    deciders: "Founder · Ali (Tech Lead)",
    appliesTo: "The GEOCITATION site repo (~/Documents/AI SEO)",
    context:
      "The Mirqab Dossier needed to be shareable as a private web link, not a PDF attachment. A first attempt lost the dossier's designed typography and charts; this decision fixed it by serving the real HTML verbatim, re-tinted to the site's dark theme, behind a password-gated cookie.",
    decisionSummary: [
      "Serve the real dossier HTML verbatim at /research/report — no re-rendering, no text extraction.",
      "Theme by CSS custom-property override, not restyling — internal parts stay signal-green, external intel stays cobalt.",
      "Auth: shared password → salted SHA-256 → HttpOnly cookie scoped to /research, 7-day expiry, noindex + no-store.",
      "Gate and landing rebuilt as dark-native GEOCITATION components.",
      "Fixed a build-pipeline bug: placeholder D1/R2 bindings excluded from production output.",
    ],
    requirements: [
      { task: "Regenerate report-html.ts and redeploy whenever the dossier changes", owner: "ali", target: "As needed", targetSort: 1, status: "done", note: "One command each — capability is live" },
      { task: "Rotate the shared password before wider distribution", owner: "founder", target: "Before next share", targetSort: 2, status: "pending", note: "Password has been typed in chat — treat as semi-public until rotated" },
      { task: "Rotate RESEARCH_PASSWORD_HASH + RESEARCH_ACCESS_TOKEN on request", owner: "ali", target: "On demand", targetSort: 2, status: "done", note: "Rotation forces re-auth for all existing cookie holders" },
    ],
  },
  {
    number: "003",
    slug: "defer-entity-registration",
    title: "Defer Entity Registration; Pilot Payment Contingency",
    status: "proposed",
    statusLabel: "Proposed — awaiting founder decision",
    date: "2026-07-15",
    deciders: "Founder · Ali (Tech Lead)",
    appliesTo: "The Mirqab pilot — commercial gates and Week-0 sequencing",
    context:
      "The founder has no Saudi commercial registration (CR) yet and will apply later. Three ADR-001 items depend on a CR — the Moyasar merchant account, ZATCA e-invoicing, and the .sa domain — and the day-90 gate requires real SAR collected. This proposes how the pilot proceeds without blocking on the CR, and what happens if it is still in flight at day 90.",
    decisionSummary: [
      "Week 0 proceeds without the CR — only GCP billing, the partner list, and the name check remain immediate.",
      "CR application must start no later than end of Week 6 — the latest start that still clears Moyasar approval before day-75 conversion talks.",
      "One-time, pre-agreed gate adjustment: a signed order with a 30-day invoice may count as \"paying\" at the day-90 gate only if the delay is registration timing, not customer hesitation.",
      "Merchant-of-record (Paddle/LemonSqueezy) is the fallback, not the plan — used only if the CR is still blocked at week 10.",
    ],
    requirements: [
      { task: "Decide: accept, amend, or reject this ADR", owner: "founder", target: "Before Sprint 1 kickoff", targetSort: 0, status: "pending", note: "Say \"accept ADR-003\" to move this to Accepted" },
      { task: "Determine registration path — Saudi Business Center vs. MISA", owner: "founder", target: "Before Week 6", targetSort: 5, status: "pending" },
      { task: "File the CR application", owner: "founder", target: "By end of Week 6 — hard deadline", targetSort: 42, status: "pending" },
      { task: "Track the CR deadline as a named risk item every Monday", owner: "owais", target: "Weekly from Week 1", targetSort: 7, status: "pending" },
      { task: "Apply for the Moyasar merchant account", owner: "founder", target: "Immediately once CR is issued", targetSort: 43, status: "pending" },
    ],
  },
  {
    number: "004",
    slug: "adr-requirements-dashboard",
    title: "ADR Requirements Dashboard on GEOCITATION",
    status: "accepted",
    statusLabel: "Accepted",
    date: "2026-07-15",
    deciders: "Founder · Ali (Tech Lead)",
    appliesTo: "The GEOCITATION site repo (~/Documents/AI SEO), under /research/adr",
    context:
      "The founder asked for ADR-001's requirements — who does what, by when — as a scannable, dated, owner-coded page under /research, extensible so every future ADR lands there too. This decision records how that dashboard is built and kept in sync with the canonical .md decision log.",
    decisionSummary: [
      "A presentation layer, not a new source of truth: the .md files in mirqab/docs/adr remain canonical; adr-data.ts is a manually-synced structured mirror.",
      "The master timeline is the centerpiece — every requirement from every ADR merged into one chronological rail, color-coded by status and owner.",
      "Per-ADR detail cards below carry full context, decision summary, and a requirements table in a native <details> element (server-rendered, no JS).",
      "Non-Accepted ADRs are visually flagged with an amber \"action needed\" banner — nothing reads as settled until it is.",
      "Gated by the existing /research cookie — no new auth surface.",
    ],
    requirements: [
      { task: "Sync convention: write the .md, run scripts/adr_index.py, append to adr-data.ts, redeploy", owner: "ali", target: "Per ADR", targetSort: 1, status: "done", note: "The manual step this page runs on — one per new decision" },
      { task: "Fix the dev-server compatibility_flags crash (npm run dev)", owner: "ali", target: "Week 0", targetSort: 0, status: "done", note: "Pre-existing bug found while verifying this page; local preview now works" },
    ],
  },
  {
    number: "005",
    slug: "allam-pipeline-model",
    title: "ALLaM-7B as Mirqab's In-Kingdom Pipeline Model",
    status: "proposed",
    statusLabel: "Proposed — awaiting tech-lead ratification",
    date: "2026-07-17",
    deciders: "Ali (Tech Lead) · Founder",
    appliesTo: "The Mirqab pilot — the model layer (extraction, scoring, generation)",
    context:
      "Mirqab's loop needs an LLM at four internal steps — inferring the Arabic prompt library, parsing each engine's Arabic answer for brand/competitor/citation/sentiment signals, assisting the visibility score, and drafting Arabic remediation content. The measured engines (ChatGPT, Gemini, Perplexity, AIO) are the product's subject and must never be the internal model. PDPL data-residency, unit cost at volume, and Saudi-dialect fidelity all point to a self-hosted Arabic-native model; SDAIA's ALLaM-7B (Apache-2.0) is the only option that satisfies all three — but a 7B makes extraction errors and the UAE's Falcon-H1 Arabic currently out-benchmarks it.",
    decisionSummary: [
      "Adopt ALLaM-7B-Instruct (Apache-2.0), self-hosted in-Kingdom, as the default internal model for prompt generation, Arabic answer parsing, scoring assist, and Arabic content drafting.",
      "ALLaM is never a measured engine — the external engines stay untouched; the internal model sits behind the LiteLLM gateway so it is swappable.",
      "The golden-set gate governs ALLaM: ≥95% presence / ≥90% sentiment plus stronger-model spot-checks certify every run; ALLaM output is never trusted un-gated.",
      "Bench ALLaM-7B vs Falcon-H1 Arabic on Mirqab's own 150-answer golden set before locking; use ALLaM for the sovereign/compliance story but let measured accuracy pick the default.",
      "Fine-tune ALLaM-7B on labelled extraction data and keep the weights — the moat a later English-first entrant cannot cheaply cross.",
      "Host in me-central2 (Dammam) per ADR-001, quantized; a local 4-bit MLX build on the founder's Mac is the pre-cloud sanity-check.",
    ],
    requirements: [
      { task: "Decide: accept, amend, or reject this ADR", owner: "founder", target: "Before Sprint 2", targetSort: 14, status: "pending", note: "Say \"accept ADR-005\" to move this to Accepted" },
      { task: "Local 4-bit ALLaM-7B eval via MLX — sanity-check Arabic quality before cloud spend", owner: "founder", target: "Day 1", targetSort: 1, status: "pending", note: "Deferred to 2026-07-18; M5/16GB Mac, MLX 4-bit only" },
      { task: "Wire ALLaM-7B behind the LiteLLM gateway as the default extraction model", owner: "ali", target: "Weeks 3–4", targetSort: 21, status: "pending" },
      { task: "Bench ALLaM-7B vs Falcon-H1 Arabic on the 150-answer golden set", owner: "ali", target: "Weeks 3–4", targetSort: 21, status: "pending", note: "Falcon-H1 currently leads the public Arabic leaderboard — verify on our own task" },
      { task: "Extend the golden-set gate to score ALLaM extractions specifically", owner: "ali", target: "Weeks 3–4", targetSort: 21, status: "pending" },
      { task: "Deploy self-hosted ALLaM-7B in me-central2 (Dammam), quantized", owner: "ali", target: "Once GCP billing clears", targetSort: 21, status: "blocked", note: "Blocked on the founder's GCP billing account (ADR-001)" },
      { task: "Native-speaker review of ALLaM prompt-generation + draft output", owner: "founder", target: "Ongoing from Week 3", targetSort: 22, status: "pending" },
      { task: "Track \"model choice locked\" as a story-acceptance milestone", owner: "owais", target: "Week 4", targetSort: 28, status: "pending" },
    ],
  },
];
