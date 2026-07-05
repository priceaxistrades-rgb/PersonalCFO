import { db } from "@/db";
import { investments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, investmentCreateSchema, investmentUpdateSchema, idDeleteSchema } from "@/lib/validation";

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
    const raw = await req.json();
    const result = validate(investmentCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const [row] = await db.insert(investments).values({
      userId: session.userId,
      name: b.name,
      type: b.type,
      invested: b.invested,
      currentValue: b.currentValue,
      annualReturn: b.annualReturn,
      symbol: b.symbol ?? null,
      schemeCode: b.schemeCode ?? null,
      units: b.units ?? null,
      startDate: b.startDate ?? null,
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
    const result = validate(investmentUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    const safeUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.type !== undefined) safeUpdates.type = updates.type;
    if (updates.invested !== undefined) safeUpdates.invested = updates.invested;
    if (updates.currentValue !== undefined) safeUpdates.currentValue = updates.currentValue;
    if (updates.annualReturn !== undefined) safeUpdates.annualReturn = updates.annualReturn;
    if (updates.symbol !== undefined) safeUpdates.symbol = updates.symbol;
    if (updates.schemeCode !== undefined) safeUpdates.schemeCode = updates.schemeCode;
    if (updates.units !== undefined) safeUpdates.units = updates.units;
    if (updates.startDate !== undefined) safeUpdates.startDate = updates.startDate;
    if (updates.memberId !== undefined) safeUpdates.memberId = updates.memberId;

    await db.update(investments).set(safeUpdates).where(and(eq(investments.id, id), eq(investments.userId, session.userId)));
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

    await db.delete(investments).where(and(eq(investments.id, id), eq(investments.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
