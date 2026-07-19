import { catchErr } from "@/lib/catch";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { syncAccountBalances } from "@/lib/data";
import { rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  const limited = await rateLimitAsync(`sync:${session.userId}`, 10, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    await syncAccountBalances();
    return Response.json({ ok: true, message: "Account balances synchronized with transaction history." });
  } catch (err) {
    return catchErr("manage_sync", err, session.userId);
  }
}
