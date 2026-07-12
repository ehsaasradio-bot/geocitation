type InquiryInput = {
  name: string;
  email: string;
  website: string;
  market: string;
  services: string;
  notes: string;
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
  await (await database()).prepare(`
    INSERT INTO project_inquiries (id, name, email, website, market, services, notes, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
  `).bind(
    id,
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
