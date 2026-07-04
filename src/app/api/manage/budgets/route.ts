import { db } from "@/db";
import { budgets } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(budgets).where(eq(budgets.userId, session.userId)).orderBy(budgets.id);
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
    if (!b.category) return Response.json({ error: "Category is required" }, { status: 400 });
    const [row] = await db.insert(budgets).values({
      userId: session.userId,
      category: b.category,
      monthlyLimit: String(b.monthlyLimit || 0),
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
    if (updates.monthlyLimit !== undefined) updates.monthlyLimit = String(updates.monthlyLimit || 0);
    await db.update(budgets).set(updates).where(and(eq(budgets.id, Number(id)), eq(budgets.userId, session.userId)));
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
    await db.delete(budgets).where(and(eq(budgets.id, Number(id)), eq(budgets.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
