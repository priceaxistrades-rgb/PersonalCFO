import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { bills } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, billToggleSchema } from "@/lib/validation";

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const result = validate(billToggleSchema, await req.json());
    if (!result.ok) return result.error;
    const { id, paid } = result.data;
    await db.update(bills).set({ paid, updatedAt: new Date() }).where(and(eq(bills.id, id), eq(bills.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("bills", err, session?.userId);
  }
}
