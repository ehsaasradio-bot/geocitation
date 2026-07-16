// Shared-secret "magic link" gate for the hidden /deepdive area.
// The secret key travels in the invite link (/deepdive?key=<KEY>); on a valid
// key we set an HttpOnly access cookie so the unlock persists for the session.
// The raw key is never stored — only its salted SHA-256 hash is compared here.

export const DEEPDIVE_ACCESS_COOKIE = "geocitation_deepdive_access";
export const DEEPDIVE_ACCESS_TOKEN =
  "6323d9430d3e96af809dee8cff425f3e6aa7e91768c3d9a955b973d4adacec33";

const DEEPDIVE_KEY_SALT = "geocitation-deepdive-v1";
const DEEPDIVE_KEY_HASH =
  "f241b04fa40d582863ca1d868d2f112dcf0a3d0f9b89d6b4889e3032d3af47ab";

export async function isDeepdiveKey(value: string): Promise<boolean> {
  if (!value) return false;
  const submitted = await sha256Hex(`${DEEPDIVE_KEY_SALT}:${value}`);
  return safeEqual(submitted, DEEPDIVE_KEY_HASH);
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
