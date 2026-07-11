import { getChatGPTUser } from "../../../chatgpt-auth";
import { getSandboxStatus } from "../../../../lib/billing/sandbox";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ testMode: true, fullAudit: false, consultation: false, orders: [] }, { headers: { "Cache-Control": "no-store" } });
  return Response.json(await getSandboxStatus(user.email), { headers: { "Cache-Control": "private, no-store" } });
}
