import { db } from "@/db";
import { emergencyItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request) {
  try {
    const { id, done } = await req.json();
    await db.update(emergencyItems).set({ done: Boolean(done) }).where(eq(emergencyItems.id, Number(id)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
