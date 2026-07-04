import { db } from "@/db";
import { transactions } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const b = await req.json();
    if (!b.type || !b.category || !b.amount || !b.txnDate) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }
    const [row] = await db
      .insert(transactions)
      .values({
        userId: session.userId,
        type: b.type,
        category: b.category,
        amount: String(b.amount),
        txnDate: b.txnDate,
        memberId: b.memberId ? Number(b.memberId) : null,
        note: b.note || null,
      })
      .returning();
    return Response.json({ ok: true, row });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const { id, userId: _ignoredUserId, ...updates } = await req.json();
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
    if (updates.amount !== undefined) updates.amount = String(updates.amount || 0);
    if (updates.memberId !== undefined) updates.memberId = updates.memberId ? Number(updates.memberId) : null;
    await db.update(transactions).set(updates).where(and(eq(transactions.id, Number(id)), eq(transactions.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const { id, ids } = await req.json();
    if (ids && Array.isArray(ids)) {
      await db.delete(transactions).where(and(eq(transactions.userId, session.userId), inArray(transactions.id, ids.map(Number))));
    } else if (id) {
      await db.delete(transactions).where(and(eq(transactions.id, Number(id)), eq(transactions.userId, session.userId)));
    } else {
      return Response.json({ error: "No id or ids provided" }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
