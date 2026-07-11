import { ownerKey } from "../reports/store";

export type SandboxPlan = "full-audit" | "done-for-you";

const plans = {
  "full-audit": { amountCents: 1999, entitlement: "full_audit" },
  "done-for-you": { amountCents: 200000, entitlement: "consultation" },
} as const;

async function database() {
  const runtime = await import("cloudflare:workers");
  if (!runtime.env.DB) throw new Error("Sandbox billing storage is unavailable.");
  return runtime.env.DB;
}

export function isSandboxPlan(value: unknown): value is SandboxPlan {
  return value === "full-audit" || value === "done-for-you";
}

export async function completeSandboxOrder(email: string, plan: SandboxPlan) {
  const owner = await ownerKey(email);
  const selected = plans[plan];
  const id = crypto.randomUUID();
  const now = Date.now();
  const db = await database();
  await db.batch([
    db.prepare(`
      INSERT INTO sandbox_orders (id, owner_key, plan, amount_cents, currency, status, created_at)
      VALUES (?, ?, ?, ?, 'USD', 'test_paid', ?)
    `).bind(id, owner, plan, selected.amountCents, now),
    db.prepare(`
      INSERT INTO sandbox_entitlements (owner_key, full_audit, consultation, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(owner_key) DO UPDATE SET
        full_audit = MAX(full_audit, excluded.full_audit),
        consultation = MAX(consultation, excluded.consultation),
        updated_at = excluded.updated_at
    `).bind(owner, selected.entitlement === "full_audit" ? 1 : 0, selected.entitlement === "consultation" ? 1 : 0, now),
  ]);
  return { id, plan, amountCents: selected.amountCents, status: "test_paid" as const };
}

export async function getSandboxStatus(email: string) {
  const owner = await ownerKey(email);
  const db = await database();
  const entitlement = await db.prepare(`
    SELECT full_audit AS fullAudit, consultation, updated_at AS updatedAt
    FROM sandbox_entitlements WHERE owner_key = ? LIMIT 1
  `).bind(owner).first<{ fullAudit: number; consultation: number; updatedAt: number }>();
  const orders = await db.prepare(`
    SELECT id, plan, amount_cents AS amountCents, currency, status, created_at AS createdAt
    FROM sandbox_orders WHERE owner_key = ? ORDER BY created_at DESC LIMIT 10
  `).bind(owner).all();
  return {
    testMode: true,
    fullAudit: Boolean(entitlement?.fullAudit),
    consultation: Boolean(entitlement?.consultation),
    orders: orders.results,
  };
}
