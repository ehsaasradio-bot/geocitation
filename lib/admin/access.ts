import { getChatGPTUser, requireChatGPTUser } from "../../app/chatgpt-auth";

type AdminEnv = { SIGNAL_ADMIN_EMAILS?: string };

async function runtimeEnv(): Promise<AdminEnv> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env;
  } catch {
    return (globalThis as { __TEST_ENV__?: AdminEnv }).__TEST_ENV__ ?? {};
  }
}

async function adminAllowlist() {
  const env = await runtimeEnv();
  return (env.SIGNAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export async function isSignalAdmin(email: string) {
  const allowlist = await adminAllowlist();
  return allowlist.includes(email.trim().toLowerCase());
}

export async function requireSignalAdmin(returnTo: string) {
  const user = await requireChatGPTUser(returnTo);
  if (!(await isSignalAdmin(user.email))) return null;
  return user;
}

export async function currentAdminUser() {
  const user = await getChatGPTUser();
  if (!user) return null;
  return (await isSignalAdmin(user.email)) ? user : null;
}
