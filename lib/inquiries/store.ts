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
  ownerKey?: string | null;
  name: string;
  email: string;
  website: string;
  market: string;
  services: string;
  notes: string;
  status: string;
  priority: string;
  adminNote: string;
  reviewerEmail: string | null;
  reviewedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type AccountInquirySummary = {
  id: string;
  orderId: string | null;
  website: string;
  market: string;
  services: string;
  status: string;
  priority: string;
  createdAt: number;
  updatedAt: number;
  reviewedAt: number | null;
};

export async function listProjectInquiries(email: string): Promise<AccountInquirySummary[]> {
  const owner = await ownerKey(email);
  const rows = await (await database()).prepare(`
    SELECT id, order_id AS orderId, website, market, services, status, priority, reviewed_at AS reviewedAt, created_at AS createdAt, updated_at AS updatedAt
    FROM project_inquiries WHERE owner_key = ? ORDER BY created_at DESC LIMIT 20
  `).bind(owner).all<AccountInquirySummary>();
  return rows.results;
}

export async function listAllProjectInquiries(): Promise<InquirySummary[]> {
  const rows = await (await database()).prepare(`
    SELECT id, owner_key AS ownerKey, order_id AS orderId, name, email, website, market, services, notes, status, priority, admin_note AS adminNote, reviewer_email AS reviewerEmail, reviewed_at AS reviewedAt, created_at AS createdAt, updated_at AS updatedAt
    FROM project_inquiries ORDER BY created_at DESC LIMIT 100
  `).all<InquirySummary>();
  return rows.results;
}

const inquiryStatuses = ["new", "reviewing", "scoped", "closed"] as const;
export type InquiryStatus = (typeof inquiryStatuses)[number];
const inquiryPriorities = ["standard", "high", "urgent"] as const;
export type InquiryPriority = (typeof inquiryPriorities)[number];

export function isInquiryStatus(value: unknown): value is InquiryStatus {
  return typeof value === "string" && inquiryStatuses.includes(value as InquiryStatus);
}

export function isInquiryPriority(value: unknown): value is InquiryPriority {
  return typeof value === "string" && inquiryPriorities.includes(value as InquiryPriority);
}

export async function updateProjectInquiryReview(id: string, review: { status: InquiryStatus; priority: InquiryPriority; adminNote: string }, reviewerEmail: string) {
  const now = Date.now();
  const result = await (await database()).prepare(`
    UPDATE project_inquiries
    SET status = ?, priority = ?, admin_note = ?, reviewer_email = ?, reviewed_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(review.status, review.priority, review.adminNote, reviewerEmail, now, now, id).run();
  if (Number(result.meta.changes ?? 0) <= 0) return null;
  return {
    id,
    status: review.status,
    priority: review.priority,
    adminNote: review.adminNote,
    reviewerEmail,
    reviewedAt: now,
    updatedAt: now,
  };
}
