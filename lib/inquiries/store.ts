import { getSandboxOrder } from "../billing/sandbox";
import { ownerKey } from "../reports/store";

type InquiryInput = {
  accountEmail?: string | null;
  name: string;
  email: string;
  website: string;
  market: string;
  services: string;
  notes: string;
  orderId?: string | null;
};

async function runtimeEnv(): Promise<{ DB?: D1Database }> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env;
  } catch {
    return (globalThis as { __TEST_ENV__?: { DB?: D1Database } }).__TEST_ENV__ ?? {};
  }
}

async function database() {
  const env = await runtimeEnv();
  if (!env.DB) throw new Error("Project intake storage is unavailable.");
  return env.DB;
}

export async function createProjectInquiry(input: InquiryInput) {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const owner = input.accountEmail ? await ownerKey(input.accountEmail) : null;
  if (input.orderId && !input.accountEmail) throw new Error("ORDER_LINK_REQUIRES_SIGN_IN");
  if (input.orderId && input.accountEmail) {
    const order = await getSandboxOrder(input.accountEmail, input.orderId);
    if (!order || order.plan !== "done-for-you") throw new Error("UNKNOWN_CONSULTATION_ORDER");
  }
  await (await database()).prepare(`
    INSERT INTO project_inquiries (id, owner_key, order_id, name, email, website, market, services, notes, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
  `).bind(
    id,
    owner,
    input.orderId ?? null,
    input.name,
    input.email,
    input.website,
    input.market,
    input.services,
    input.notes,
    createdAt,
    createdAt,
  ).run();
  return { id, createdAt };
}

export type InquirySummary = {
  id: string;
  orderId: string | null;
  name: string;
  email: string;
  website: string;
  market: string;
  services: string;
  notes: string;
  status: string;
  createdAt: number;
  updatedAt: number;
};

export async function listProjectInquiries(email: string): Promise<InquirySummary[]> {
  const owner = await ownerKey(email);
  const rows = await (await database()).prepare(`
    SELECT id, order_id AS orderId, name, email, website, market, services, notes, status, created_at AS createdAt, updated_at AS updatedAt
    FROM project_inquiries WHERE owner_key = ? ORDER BY created_at DESC LIMIT 20
  `).bind(owner).all<InquirySummary>();
  return rows.results;
}
