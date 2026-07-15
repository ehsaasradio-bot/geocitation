import {
  isResearchPassword,
  RESEARCH_ACCESS_COOKIE,
  RESEARCH_ACCESS_TOKEN,
} from "../../../lib/research/access";

export async function POST(request: Request) {
  let password = "";
  try {
    const payload = await request.json();
    password = typeof payload?.password === "string" ? payload.password : "";
  } catch {
    return Response.json(
      { error: "Enter the research password." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!(await isResearchPassword(password))) {
    return Response.json(
      { error: "That password did not unlock the research page." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Set-Cookie": `${RESEARCH_ACCESS_COOKIE}=${RESEARCH_ACCESS_TOKEN}; Path=/research; Max-Age=604800; HttpOnly; SameSite=Lax${secure}`,
  });

  return Response.json({ ok: true }, { headers });
}
