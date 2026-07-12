import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const auditRateLimits = sqliteTable(
  "audit_rate_limits",
  {
    key: text("key").primaryKey(),
    windowStart: integer("window_start").notNull(),
    requestCount: integer("request_count").notNull().default(1),
    expiresAt: integer("expires_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("audit_rate_limits_expires_at_idx").on(table.expiresAt)],
);

export const savedAudits = sqliteTable(
  "saved_audits",
  {
    id: text("id").primaryKey(),
    ownerKey: text("owner_key").notNull(),
    domain: text("domain").notNull(),
    target: text("target").notNull(),
    score: integer("score").notNull(),
    grade: text("grade").notNull(),
    scannedAt: text("scanned_at").notNull(),
    createdAt: integer("created_at").notNull(),
    resultJson: text("result_json").notNull(),
  },
  (table) => [
    index("saved_audits_owner_created_idx").on(table.ownerKey, table.createdAt),
    index("saved_audits_owner_domain_idx").on(table.ownerKey, table.domain),
  ],
);

export const sandboxOrders = sqliteTable(
  "sandbox_orders",
  {
    id: text("id").primaryKey(),
    ownerKey: text("owner_key").notNull(),
    reference: text("reference").notNull(),
    plan: text("plan").notNull(),
    reportId: text("report_id"),
    entitlementKey: text("entitlement_key").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    status: text("status").notNull().default("created"),
    statusDetail: text("status_detail").notNull().default("Awaiting sandbox confirmation."),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    fulfilledAt: integer("fulfilled_at"),
  },
  (table) => [
    index("sandbox_orders_owner_created_idx").on(table.ownerKey, table.createdAt),
    uniqueIndex("sandbox_orders_reference_idx").on(table.reference),
  ],
);

export const sandboxEntitlements = sqliteTable(
  "sandbox_entitlements",
  {
    ownerKey: text("owner_key").primaryKey(),
    fullAudit: integer("full_audit", { mode: "boolean" }).notNull().default(false),
    consultation: integer("consultation", { mode: "boolean" }).notNull().default(false),
    updatedAt: integer("updated_at").notNull(),
  },
);

export const projectInquiries = sqliteTable(
  "project_inquiries",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    website: text("website").notNull(),
    market: text("market").notNull(),
    services: text("services").notNull(),
    notes: text("notes").notNull(),
    status: text("status").notNull().default("new"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("project_inquiries_created_idx").on(table.createdAt),
    index("project_inquiries_status_created_idx").on(table.status, table.createdAt),
    index("project_inquiries_email_created_idx").on(table.email, table.createdAt),
  ],
);

export const promptObservations = sqliteTable(
  "prompt_observations",
  {
    id: text("id").primaryKey(),
    ownerKey: text("owner_key").notNull(),
    reportId: text("report_id").notNull(),
    platform: text("platform").notNull(),
    promptKey: text("prompt_key").notNull(),
    promptText: text("prompt_text").notNull(),
    resultState: text("result_state").notNull(),
    sourceUrl: text("source_url"),
    notes: text("notes"),
    observedAt: integer("observed_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("prompt_observations_owner_test_idx").on(table.ownerKey, table.reportId, table.platform, table.promptKey),
    index("prompt_observations_report_idx").on(table.ownerKey, table.reportId, table.updatedAt),
  ],
);

export const automatedPromptRuns = sqliteTable(
  "automated_prompt_runs",
  {
    id: text("id").primaryKey(),
    ownerKey: text("owner_key").notNull(),
    reportId: text("report_id").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    promptKey: text("prompt_key").notNull(),
    promptText: text("prompt_text").notNull(),
    answerText: text("answer_text").notNull(),
    citationsJson: text("citations_json").notNull(),
    targetCited: integer("target_cited", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("automated_prompt_runs_owner_created_idx").on(table.ownerKey, table.createdAt), index("automated_prompt_runs_report_idx").on(table.ownerKey, table.reportId, table.createdAt)],
);
