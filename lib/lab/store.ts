import { ownerKey } from "../reports/store";

export type ObservationState = "not_run" | "cited" | "mentioned" | "not_found";

export type PromptObservationInput = {
  reportId: string;
  platform: string;
  promptKey: string;
  promptText: string;
  resultState: ObservationState;
  sourceUrl?: string;
  notes?: string;
};

async function database() {
  const runtime = await import("cloudflare:workers");
  if (!runtime.env.DB) throw new Error("Visibility lab storage is unavailable.");
  return runtime.env.DB;
}

async function digest(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function listObservations(email: string, reportId: string) {
  const owner = await ownerKey(email);
  const rows = await (await database()).prepare(`
    SELECT id, platform, prompt_key AS promptKey, prompt_text AS promptText,
      result_state AS resultState, source_url AS sourceUrl, notes, observed_at AS observedAt, updated_at AS updatedAt
    FROM prompt_observations WHERE owner_key = ? AND report_id = ? ORDER BY platform, prompt_key
  `).bind(owner, reportId).all();
  return rows.results;
}

export async function saveObservation(email: string, input: PromptObservationInput) {
  const owner = await ownerKey(email);
  const id = (await digest(`${owner}:${input.reportId}:${input.platform}:${input.promptKey}`)).slice(0, 32);
  const now = Date.now();
  await (await database()).prepare(`
    INSERT INTO prompt_observations
      (id, owner_key, report_id, platform, prompt_key, prompt_text, result_state, source_url, notes, observed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(owner_key, report_id, platform, prompt_key) DO UPDATE SET
      prompt_text = excluded.prompt_text,
      result_state = excluded.result_state,
      source_url = excluded.source_url,
      notes = excluded.notes,
      observed_at = excluded.observed_at,
      updated_at = excluded.updated_at
  `).bind(id, owner, input.reportId, input.platform, input.promptKey, input.promptText, input.resultState, input.sourceUrl || null, input.notes || null, now, now).run();
  return id;
}
