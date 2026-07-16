import { cookies } from "next/headers";
import {
  RESEARCH_ACCESS_COOKIE,
  RESEARCH_ACCESS_TOKEN,
} from "../../../lib/research/access";
import { SAUDI_HTML } from "../saudi-support-html";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const unlocked =
    cookieStore.get(RESEARCH_ACCESS_COOKIE)?.value === RESEARCH_ACCESS_TOKEN;

  if (!unlocked) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/research", "Cache-Control": "no-store" },
    });
  }

  return new Response(SAUDI_HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
