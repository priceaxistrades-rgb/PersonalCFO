import { db } from "@/db";
import { debts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, debtCreateSchema, debtUpdateSchema, idDeleteSchema } from "@/lib/validation";

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
    const raw = await req.json();
    const result = validate(debtCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const [row] = await db.insert(debts).values({
      userId: session.userId,
      name: b.name,
      type: b.type,
      principal: b.principal,
      outstanding: b.outstanding,
      interestRate: b.interestRate,
      emi: b.emi,
      tenureMonths: b.tenureMonths,
      memberId: b.memberId,
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
    const raw = await req.json();
    const result = validate(debtUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    const safeUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.type !== undefined) safeUpdates.type = updates.type;
    if (updates.principal !== undefined) safeUpdates.principal = updates.principal;
    if (updates.outstanding !== undefined) safeUpdates.outstanding = updates.outstanding;
    if (updates.interestRate !== undefined) safeUpdates.interestRate = updates.interestRate;
    if (updates.emi !== undefined) safeUpdates.emi = updates.emi;
    if (updates.tenureMonths !== undefined) safeUpdates.tenureMonths = updates.tenureMonths;
    if (updates.memberId !== undefined) safeUpdates.memberId = updates.memberId;

    await db.update(debts).set(safeUpdates).where(and(eq(debts.id, id), eq(debts.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(idDeleteSchema, raw);
    if (!result.ok) return result.error;
    const { id } = result.data;

    await db.delete(debts).where(and(eq(debts.id, id), eq(debts.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
