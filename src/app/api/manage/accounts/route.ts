import { db } from "@/db";
import { accounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(accounts).where(eq(accounts.userId, session.userId)).orderBy(accounts.id);
    return Response.json({ ok: true, rows });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const b = await req.json();
    const [row] = await db.insert(accounts).values({
      userId: session.userId,
      name: b.name,
      type: b.type,
      category: b.category || "liquid",
      balance: String(b.balance || 0),
      memberId: b.memberId ? Number(b.memberId) : null,
    }).returning();
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
    if (updates.balance !== undefined) updates.balance = updates.balance ? String(updates.balance) : "0";
    if (updates.memberId !== undefined) updates.memberId = updates.memberId ? Number(updates.memberId) : null;
    await db.update(accounts).set(updates).where(and(eq(accounts.id, Number(id)), eq(accounts.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
    await db.delete(accounts).where(and(eq(accounts.id, Number(id)), eq(accounts.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
