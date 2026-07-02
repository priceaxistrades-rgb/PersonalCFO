import { db } from "@/db";
import { bills } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request) {
  try {
    const { id, paid } = await req.json();
    await db.update(bills).set({ paid: Boolean(paid) }).where(eq(bills.id, Number(id)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
