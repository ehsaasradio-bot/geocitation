import { cookies } from "next/headers";
import {
  DEEPDIVE_ACCESS_COOKIE,
  DEEPDIVE_ACCESS_TOKEN,
} from "../../../lib/deepdive/access";
import { SCRUNCH_HTML } from "../scrunch-html";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const unlocked =
    cookieStore.get(DEEPDIVE_ACCESS_COOKIE)?.value === DEEPDIVE_ACCESS_TOKEN;

  if (!unlocked) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/deepdive", "Cache-Control": "no-store" },
    });
  }

  return new Response(SCRUNCH_HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
