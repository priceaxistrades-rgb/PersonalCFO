import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { bills } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const { id, paid } = await req.json();
    await db.update(bills).set({ paid: Boolean(paid) }).where(and(eq(bills.id, Number(id)), eq(bills.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("bills", err, session?.userId);
  }
}
