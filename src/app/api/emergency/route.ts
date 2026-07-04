import { db } from "@/db";
import { emergencyItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const { id, done } = await req.json();
    await db.update(emergencyItems).set({ done: Boolean(done) }).where(and(eq(emergencyItems.id, Number(id)), eq(emergencyItems.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
