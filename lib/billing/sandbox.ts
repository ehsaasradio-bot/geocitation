import { ownerKey } from "../reports/store";

export type SandboxPlan = "full-audit" | "done-for-you";
export type SandboxOrderStatus = "created" | "processing" | "test_paid";
export type SandboxOrderRecord = {
  id: string;
  reference: string;
  plan: SandboxPlan;
  reportId: string | null;
  entitlementKey: "full_audit" | "consultation";
  amountCents: number;
  currency: string;
  status: SandboxOrderStatus;
  statusDetail: string;
  createdAt: number;
  updatedAt: number;
  fulfilledAt: number | null;
};

const plans = {
  "full-audit": { amountCents: 1999, entitlement: "full_audit" },
  "done-for-you": { amountCents: 200000, entitlement: "consultation" },
} as const;

async function database() {
  try {
    const runtime = await import("cloudflare:workers");
    if (!runtime.env.DB) throw new Error("Sandbox billing storage is unavailable.");
    return runtime.env.DB;
  } catch {
    const env = (globalThis as { __TEST_ENV__?: { DB?: D1Database } }).__TEST_ENV__;
    if (!env?.DB) throw new Error("Sandbox billing storage is unavailable.");
    return env.DB;
  }
}

export function isSandboxPlan(value: unknown): value is SandboxPlan {
  return value === "full-audit" || value === "done-for-you";
}

function createReference() {
  return `sndb_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function paidStatusDetail(entitlement: "full_audit" | "consultation") {
  return entitlement === "full_audit"
    ? "Sandbox payment confirmed. Full Audit access is active."
    : "Sandbox payment confirmed. Consultation intake is active.";
}

async function readOrder(owner: string, id: string) {
  const db = await database();
  return db.prepare(`
    SELECT id, reference, plan, report_id AS reportId, entitlement_key AS entitlementKey, amount_cents AS amountCents, currency, status, status_detail AS statusDetail, created_at AS createdAt, updated_at AS updatedAt, fulfilled_at AS fulfilledAt
    FROM sandbox_orders WHERE owner_key = ? AND id = ? LIMIT 1
  `).bind(owner, id).first<SandboxOrderRecord>();
}

export async function createSandboxOrder(email: string, plan: SandboxPlan, reportId?: string) {
  const owner = await ownerKey(email);
  const selected = plans[plan];
  const id = crypto.randomUUID();
  const reference = createReference();
  const now = Date.now();
  const db = await database();
  await db.prepare(`
    INSERT INTO sandbox_orders (id, owner_key, reference, plan, report_id, entitlement_key, amount_cents, currency, status, status_detail, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'USD', 'created', 'Awaiting sandbox confirmation.', ?, ?)
  `).bind(id, owner, reference, plan, reportId ?? null, selected.entitlement, selected.amountCents, now, now).run();
  const order = await readOrder(owner, id);
  if (!order) throw new Error("SANDBOX_ORDER_CREATE_FAILED");
  return order;
}

export async function completeSandboxOrder(email: string, orderId: string) {
  const owner = await ownerKey(email);
  const current = await readOrder(owner, orderId);
  if (!current) throw new Error("SANDBOX_ORDER_NOT_FOUND");
  if (current.status === "test_paid") return current;
  const now = Date.now();
  const db = await database();
  await db.prepare(`
    UPDATE sandbox_orders
    SET status = 'processing', status_detail = 'Simulating authorization and entitlement delivery.', updated_at = ?
    WHERE owner_key = ? AND id = ?
  `).bind(now, owner, orderId).run();
  await new Promise((resolve) => setTimeout(resolve, 150));
  const fulfilledAt = Date.now();
  await db.batch([
    db.prepare(`
      UPDATE sandbox_orders
      SET status = 'test_paid', status_detail = ?, updated_at = ?, fulfilled_at = ?
      WHERE owner_key = ? AND id = ?
    `).bind(paidStatusDetail(current.entitlementKey), fulfilledAt, fulfilledAt, owner, orderId),
    db.prepare(`
      INSERT INTO sandbox_entitlements (owner_key, full_audit, consultation, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(owner_key) DO UPDATE SET
        full_audit = MAX(full_audit, excluded.full_audit),
        consultation = MAX(consultation, excluded.consultation),
        updated_at = excluded.updated_at
    `).bind(owner, current.entitlementKey === "full_audit" ? 1 : 0, current.entitlementKey === "consultation" ? 1 : 0, fulfilledAt),
  ]);
  const order = await readOrder(owner, orderId);
  if (!order) throw new Error("SANDBOX_ORDER_COMPLETE_FAILED");
  return order;
}

export async function getSandboxStatus(email: string) {
  const owner = await ownerKey(email);
  const db = await database();
  const entitlement = await db.prepare(`
    SELECT full_audit AS fullAudit, consultation, updated_at AS updatedAt
    FROM sandbox_entitlements WHERE owner_key = ? LIMIT 1
  `).bind(owner).first<{ fullAudit: number; consultation: number; updatedAt: number }>();
  const orders = await db.prepare(`
    SELECT id, reference, plan, report_id AS reportId, entitlement_key AS entitlementKey, amount_cents AS amountCents, currency, status, status_detail AS statusDetail, created_at AS createdAt, updated_at AS updatedAt, fulfilled_at AS fulfilledAt
    FROM sandbox_orders WHERE owner_key = ? ORDER BY created_at DESC LIMIT 10
  `).bind(owner).all<SandboxOrderRecord>();
  return {
    testMode: true,
    fullAudit: Boolean(entitlement?.fullAudit),
    consultation: Boolean(entitlement?.consultation),
    orders: orders.results,
  };
}

export async function hasFullAuditAccess(email: string) {
  const owner = await ownerKey(email);
  const row = await (await database()).prepare(
    "SELECT full_audit AS fullAudit FROM sandbox_entitlements WHERE owner_key = ? LIMIT 1",
  ).bind(owner).first<{ fullAudit: number }>();
  return Boolean(row?.fullAudit);
}
