import { db } from "@/db";
import { debts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(debts).where(eq(debts.userId, session.userId)).orderBy(debts.id);
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
    const [row] = await db.insert(debts).values({
      userId: session.userId,
      name: b.name,
      type: b.type,
      principal: String(b.principal || 0),
      outstanding: String(b.outstanding || 0),
      interestRate: String(b.interestRate || 0),
      emi: String(b.emi || 0),
      tenureMonths: Number(b.tenureMonths || 0),
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
    if (updates.principal !== undefined) updates.principal = updates.principal ? String(updates.principal) : "0";
    if (updates.outstanding !== undefined) updates.outstanding = updates.outstanding ? String(updates.outstanding) : "0";
    if (updates.interestRate !== undefined) updates.interestRate = updates.interestRate ? String(updates.interestRate) : "0";
    if (updates.emi !== undefined) updates.emi = updates.emi ? String(updates.emi) : "0";
    if (updates.tenureMonths !== undefined) updates.tenureMonths = Number(updates.tenureMonths);
    if (updates.memberId !== undefined) updates.memberId = updates.memberId ? Number(updates.memberId) : null;
    await db.update(debts).set(updates).where(and(eq(debts.id, Number(id)), eq(debts.userId, session.userId)));
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
    await db.delete(debts).where(and(eq(debts.id, Number(id)), eq(debts.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
