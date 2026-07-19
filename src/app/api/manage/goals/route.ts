import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, goalCreateSchema, goalUpdateSchema, idDeleteSchema } from "@/lib/validation";
import { verifyGoalOwnership } from "@/lib/ownership";
import { getClientIp, rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(goals).where(eq(goals.userId, session.userId)).orderBy(goals.id);
    return Response.json({ ok: true, rows });
  } catch (err) {
    return catchErr("manage_goals", err, session?.userId);
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(goalCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const [row] = await db.insert(goals).values({
      userId: session.userId,
      name: b.name,
      category: b.category,
      target: b.target,
      saved: b.saved,
      deadline: b.deadline ?? null,
      icon: b.icon,
    }).returning();
    return Response.json({ ok: true, row });
  } catch (err) {
    return catchErr("manage_goals", err, session?.userId);
  }
}

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  const limited = await rateLimitAsync(`goals:${session.userId}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    const raw = await req.json();
    const result = validate(goalUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    if (!(await verifyGoalOwnership(id, session.userId))) {
      return Response.json({ ok: false, error: "Goal not found or access denied" }, { status: 404 });
    }

    const safeUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.category !== undefined) safeUpdates.category = updates.category;
    if (updates.target !== undefined) safeUpdates.target = updates.target;
    if (updates.saved !== undefined) safeUpdates.saved = updates.saved;
    if (updates.deadline !== undefined) safeUpdates.deadline = updates.deadline;
    if (updates.icon !== undefined) safeUpdates.icon = updates.icon;

    await db.update(goals).set(safeUpdates).where(and(eq(goals.id, id), eq(goals.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_goals", err, session?.userId);
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

    await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_goals", err, session?.userId);
  }
}
