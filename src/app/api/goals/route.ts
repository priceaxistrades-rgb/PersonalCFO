import { db } from "@/db";
import { goals } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const { id, amount } = await req.json();
    const value = Number(amount);
    if (!Number.isFinite(value)) return Response.json({ error: "Invalid amount" }, { status: 400 });
    await db
      .update(goals)
      .set({ saved: sql`${goals.saved} + ${value}` })
      .where(and(eq(goals.id, Number(id)), eq(goals.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
