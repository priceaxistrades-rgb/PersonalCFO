import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, goalContributeSchema } from "@/lib/validation";

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const result = validate(goalContributeSchema, await req.json());
    if (!result.ok) return result.error;
    const { id, amount } = result.data;
    await db
      .update(goals)
      .set({ saved: sql`${goals.saved} + ${amount}`, updatedAt: new Date() })
      .where(and(eq(goals.id, id), eq(goals.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("goals", err, session?.userId);
  }
}
