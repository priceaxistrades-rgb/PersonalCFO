import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(accounts).orderBy(accounts.id);
    return Response.json({ ok: true, rows });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const [row] = await db.insert(accounts).values({
      name: b.name,
      type: b.type,
      category: b.category || "liquid",
      balance: String(b.balance || 0),
    }).returning();
    return Response.json({ ok: true, row });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json();
    if (updates.balance !== undefined) updates.balance = String(updates.balance);
    await db.update(accounts).set(updates).where(eq(accounts.id, Number(id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.delete(accounts).where(eq(accounts.id, Number(id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
