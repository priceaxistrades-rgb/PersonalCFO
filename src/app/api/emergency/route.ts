import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { emergencyItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, emergencyToggleSchema } from "@/lib/validation";

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(emergencyToggleSchema, raw);
    if (!result.ok) return result.error;
    const { id, done } = result.data;

    await db.update(emergencyItems).set({ done }).where(and(eq(emergencyItems.id, id), eq(emergencyItems.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("emergency", err, session?.userId);
  }
}
