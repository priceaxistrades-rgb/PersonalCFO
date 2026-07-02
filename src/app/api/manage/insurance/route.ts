import { db } from "@/db";
import { insurance } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(insurance).orderBy(insurance.renewalDate);
    return Response.json({ ok: true, rows });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const [row] = await db.insert(insurance).values({
      name: b.name,
      type: b.type,
      provider: b.provider,
      premium: String(b.premium || 0),
      coverage: String(b.coverage || 0),
      renewalDate: b.renewalDate,
    }).returning();
    return Response.json({ ok: true, row });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json();
    if (updates.premium !== undefined) updates.premium = String(updates.premium);
    if (updates.coverage !== undefined) updates.coverage = String(updates.coverage);
    await db.update(insurance).set(updates).where(eq(insurance.id, Number(id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.delete(insurance).where(eq(insurance.id, Number(id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
