import type { AuditResult } from "../../app/audit-types";

type SavedReportSummary = {
  id: string;
  domain: string;
  target: string;
  score: number;
  grade: string;
  scannedAt: string;
  createdAt: number;
};

async function runtimeEnv(): Promise<{ DB?: D1Database; RATE_LIMIT_SALT?: string }> {
  const runtime = await import("cloudflare:workers");
  return runtime.env;
}

async function database() {
  const env = await runtimeEnv();
  if (!env.DB) throw new Error("Report storage is unavailable.");
  return env.DB;
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function ownerKey(email: string) {
  const env = await runtimeEnv();
  if (!env.RATE_LIMIT_SALT) throw new Error("Identity protection is unavailable.");
  return digest(`${env.RATE_LIMIT_SALT}:report-owner:${email.trim().toLowerCase()}`);
}

export async function saveReport(email: string, result: AuditResult) {
  const owner = await ownerKey(email);
  const id = (await digest(`${owner}:${result.target}:${result.scannedAt}`)).slice(0, 32);
  const createdAt = Date.now();
  await (await database()).prepare(`
    INSERT INTO saved_audits (id, owner_key, domain, target, score, grade, scanned_at, created_at, result_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      score = excluded.score,
      grade = excluded.grade,
      result_json = excluded.result_json
  `).bind(id, owner, result.domain, result.target, result.score, result.grade, result.scannedAt, createdAt, JSON.stringify(result)).run();
  return id;
}

export async function listReports(email: string): Promise<SavedReportSummary[]> {
  const owner = await ownerKey(email);
  const rows = await (await database()).prepare(`
    SELECT id, domain, target, score, grade, scanned_at AS scannedAt, created_at AS createdAt
    FROM saved_audits WHERE owner_key = ? ORDER BY created_at DESC LIMIT 50
  `).bind(owner).all<SavedReportSummary>();
  return rows.results;
}

export async function getReport(email: string, id: string): Promise<AuditResult | null> {
  const owner = await ownerKey(email);
  const row = await (await database()).prepare(
    "SELECT result_json AS resultJson FROM saved_audits WHERE id = ? AND owner_key = ? LIMIT 1",
  ).bind(id, owner).first<{ resultJson: string }>();
  if (!row) return null;
  return JSON.parse(row.resultJson) as AuditResult;
}

export async function deleteReport(email: string, id: string) {
  const owner = await ownerKey(email);
  const db = await database();
  const [, result] = await db.batch([
    db.prepare("DELETE FROM prompt_observations WHERE report_id = ? AND owner_key = ?").bind(id, owner),
    db.prepare("DELETE FROM saved_audits WHERE id = ? AND owner_key = ?").bind(id, owner),
  ]);
  return Number(result.meta.changes ?? 0) > 0;
}
