import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
