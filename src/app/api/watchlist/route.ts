import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const b = await req.json();
    if (!b.kind || !b.label) return Response.json({ error: "Missing fields" }, { status: 400 });
    const [row] = await db
      .insert(watchlist)
      .values({
        userId: session.userId,
        kind: b.kind,
        symbol: b.symbol || null,
        schemeCode: b.schemeCode ? String(b.schemeCode) : null,
        label: b.label,
      })
      .returning();
    return Response.json({ ok: true, row });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const { id } = await req.json();
    await db.delete(watchlist).where(and(eq(watchlist.id, Number(id)), eq(watchlist.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
