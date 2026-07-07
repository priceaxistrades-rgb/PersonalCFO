import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { annualPlans } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, annualPlanCreateSchema, annualPlanUpdateSchema, idDeleteSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(annualPlans).where(eq(annualPlans.userId, session.userId)).orderBy(annualPlans.year, annualPlans.id);
    return Response.json({ ok: true, rows });
  } catch (err) {
    return catchErr("manage_annual", err, session?.userId);
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(annualPlanCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const [row] = await db.insert(annualPlans).values({
      userId: session.userId,
      year: b.year,
      title: b.title,
      category: b.category,
      targetAmount: b.targetAmount,
      progress: b.progress,
      status: b.status,
    }).returning();
    return Response.json({ ok: true, row });
  } catch (err) {
    return catchErr("manage_annual", err, session?.userId);
  }
}

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(annualPlanUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    const safeUpdates: Record<string, unknown> = {};
    if (updates.year !== undefined) safeUpdates.year = updates.year;
    if (updates.title !== undefined) safeUpdates.title = updates.title;
    if (updates.category !== undefined) safeUpdates.category = updates.category;
    if (updates.targetAmount !== undefined) safeUpdates.targetAmount = updates.targetAmount;
    if (updates.progress !== undefined) safeUpdates.progress = updates.progress;
    if (updates.status !== undefined) safeUpdates.status = updates.status;

    await db.update(annualPlans).set(safeUpdates).where(and(eq(annualPlans.id, id), eq(annualPlans.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_annual", err, session?.userId);
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

    await db.delete(annualPlans).where(and(eq(annualPlans.id, id), eq(annualPlans.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_annual", err, session?.userId);
  }
}
