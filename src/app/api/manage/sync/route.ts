import { catchErr } from "@/lib/catch";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { syncAccountBalances } from "@/lib/data";

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    await syncAccountBalances();
    return Response.json({ ok: true, message: "Account balances synchronized with transaction history." });
  } catch (err) {
    return catchErr("manage_sync", err, session.userId);
  }
}
