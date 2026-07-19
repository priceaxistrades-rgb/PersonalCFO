import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, budgetCreateSchema, budgetUpdateSchema, idDeleteSchema } from "@/lib/validation";
import { rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(budgets).where(eq(budgets.userId, session.userId)).orderBy(budgets.id);
    return Response.json({ ok: true, rows });
  } catch (err) {
    return catchErr("manage_budgets", err, session?.userId);
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(budgetCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const [row] = await db.insert(budgets).values({
      userId: session.userId,
      category: b.category,
      monthlyLimit: b.monthlyLimit,
    }).returning();
    return Response.json({ ok: true, row });
  } catch (err) {
    return catchErr("manage_budgets", err, session?.userId);
  }
}

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  const limited = await rateLimitAsync(`budgets:${session.userId}`, 40, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    const raw = await req.json();
    const result = validate(budgetUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    // Ownership check
    const [existing] = await db.select({ id: budgets.id }).from(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, session.userId))).limit(1);
    if (!existing) {
      return Response.json({ ok: false, error: "Budget not found or access denied" }, { status: 404 });
    }

    const safeUpdates: Record<string, unknown> = {};
    if (updates.category !== undefined) safeUpdates.category = updates.category;
    if (updates.monthlyLimit !== undefined) safeUpdates.monthlyLimit = updates.monthlyLimit;

    await db.update(budgets).set(safeUpdates).where(and(eq(budgets.id, id), eq(budgets.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_budgets", err, session?.userId);
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

    await db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_budgets", err, session?.userId);
  }
}
