import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { debts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, debtCreateSchema, debtUpdateSchema, idDeleteSchema } from "@/lib/validation";
import { verifyDebtOwnership } from "@/lib/ownership";
import { getClientIp, rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(debts).where(eq(debts.userId, session.userId)).orderBy(debts.id);
    return Response.json({ ok: true, rows });
  } catch (err) {
    return catchErr("manage_debts", err, session?.userId);
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
  } catch (err) {
    return catchErr("manage_debts", err, session?.userId);
  }
}

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  // Rate limit + ownership verification
  const limited = await rateLimitAsync(`debts:${session.userId}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    const raw = await req.json();
    const result = validate(debtUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    // CRITICAL: Explicit ownership verification to prevent IDOR
    if (!(await verifyDebtOwnership(id, session.userId))) {
      return Response.json({ ok: false, error: "Debt not found or access denied" }, { status: 404 });
    }

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
  } catch (err) {
    return catchErr("manage_debts", err, session?.userId);
  }
}

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  const limited = await rateLimitAsync(`debts:${session.userId}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    const raw = await req.json();
    const result = validate(idDeleteSchema, raw);
    if (!result.ok) return result.error;
    const { id } = result.data;

    // CRITICAL: Explicit ownership verification
    if (!(await verifyDebtOwnership(id, session.userId))) {
      return Response.json({ ok: false, error: "Debt not found or access denied" }, { status: 404 });
    }

    await db.delete(debts).where(and(eq(debts.id, id), eq(debts.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_debts", err, session?.userId);
  }
}
