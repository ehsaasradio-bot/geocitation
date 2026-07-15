export const RESEARCH_ACCESS_COOKIE = "geocitation_research_access";
export const RESEARCH_ACCESS_TOKEN =
  "aedf56cf8888ed021269942e142521a8cb5fa1df811d09d708adee86b1576a56";

const RESEARCH_PASSWORD_SALT = "geocitation-research-v1";
const RESEARCH_PASSWORD_HASH =
  "69b0931da166e2d59fbe4d7cdf86baaf58634b8476d528f219eaac4c39d7410e";

export async function isResearchPassword(value: string): Promise<boolean> {
  const submittedHash = await sha256Hex(`${RESEARCH_PASSWORD_SALT}:${value}`);
  return safeEqual(submittedHash, RESEARCH_PASSWORD_HASH);
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
