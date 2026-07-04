import { db } from "@/db";
import { investments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(investments).where(eq(investments.userId, session.userId)).orderBy(investments.id);
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
    const [row] = await db.insert(investments).values({
      userId: session.userId,
      name: b.name,
      type: b.type,
      invested: String(b.invested || 0),
      currentValue: String(b.currentValue || 0),
      annualReturn: String(b.annualReturn || 0),
      symbol: b.symbol || null,
      schemeCode: b.schemeCode || null,
      units: b.units ? String(b.units) : null,
      startDate: b.startDate || null,
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
    if (updates.invested !== undefined) updates.invested = updates.invested ? String(updates.invested) : "0";
    if (updates.currentValue !== undefined) updates.currentValue = updates.currentValue ? String(updates.currentValue) : "0";
    if (updates.annualReturn !== undefined) updates.annualReturn = updates.annualReturn ? String(updates.annualReturn) : "0";
    if (updates.units !== undefined) updates.units = updates.units ? String(updates.units) : "0";
    if (updates.memberId !== undefined) updates.memberId = updates.memberId ? Number(updates.memberId) : null;
    await db.update(investments).set(updates).where(and(eq(investments.id, Number(id)), eq(investments.userId, session.userId)));
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
    await db.delete(investments).where(and(eq(investments.id, Number(id)), eq(investments.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
