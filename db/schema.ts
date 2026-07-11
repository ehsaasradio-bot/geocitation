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
