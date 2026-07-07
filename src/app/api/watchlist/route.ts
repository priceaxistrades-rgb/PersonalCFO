import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, watchlistCreateSchema, watchlistDeleteSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(watchlistCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const [row] = await db
      .insert(watchlist)
      .values({
        userId: session.userId,
        kind: b.kind,
        symbol: b.symbol ?? null,
        schemeCode: b.schemeCode ? String(b.schemeCode) : null,
        label: b.label,
      })
      .returning();
    return Response.json({ ok: true, row });
  } catch (err) {
    return catchErr("watchlist", err, session?.userId);
  }
}

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(watchlistDeleteSchema, raw);
    if (!result.ok) return result.error;
    const { id } = result.data;

    await db.delete(watchlist).where(and(eq(watchlist.id, id), eq(watchlist.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("watchlist", err, session?.userId);
  }
}
