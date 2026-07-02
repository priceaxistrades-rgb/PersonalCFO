import { db } from "@/db";
import { investments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(investments).orderBy(investments.id);
    return Response.json({ ok: true, rows });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const [row] = await db.insert(investments).values({
      name: b.name,
      type: b.type,
      invested: String(b.invested || 0),
      currentValue: String(b.currentValue || 0),
      annualReturn: String(b.annualReturn || 0),
      symbol: b.symbol || null,
      schemeCode: b.schemeCode ? String(b.schemeCode) : null,
      units: b.units ? String(b.units) : null,
      startDate: b.startDate || null,
    }).returning();
    return Response.json({ ok: true, row });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json();
    if (updates.invested !== undefined) updates.invested = String(updates.invested);
    if (updates.currentValue !== undefined) updates.currentValue = String(updates.currentValue);
    if (updates.annualReturn !== undefined) updates.annualReturn = String(updates.annualReturn);
    if (updates.units !== undefined) updates.units = updates.units ? String(updates.units) : null;
    await db.update(investments).set(updates).where(eq(investments.id, Number(id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.delete(investments).where(eq(investments.id, Number(id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
