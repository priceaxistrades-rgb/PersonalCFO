import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function PATCH(req: Request) {
  try {
    const { id, amount } = await req.json();
    await db
      .update(goals)
      .set({ saved: sql`${goals.saved} + ${Number(amount)}` })
      .where(eq(goals.id, Number(id)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
