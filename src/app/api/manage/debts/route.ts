import { db } from "@/db";
import { debts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(debts).orderBy(debts.id);
    return Response.json({ ok: true, rows });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const [row] = await db.insert(debts).values({
      name: b.name,
      type: b.type,
      principal: String(b.principal || 0),
      outstanding: String(b.outstanding || 0),
      interestRate: String(b.interestRate || 0),
      emi: String(b.emi || 0),
      tenureMonths: Number(b.tenureMonths || 0),
    }).returning();
    return Response.json({ ok: true, row });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json();
    if (updates.principal !== undefined) updates.principal = String(updates.principal);
    if (updates.outstanding !== undefined) updates.outstanding = String(updates.outstanding);
    if (updates.interestRate !== undefined) updates.interestRate = String(updates.interestRate);
    if (updates.emi !== undefined) updates.emi = String(updates.emi);
    if (updates.tenureMonths !== undefined) updates.tenureMonths = Number(updates.tenureMonths);
    await db.update(debts).set(updates).where(eq(debts.id, Number(id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.delete(debts).where(eq(debts.id, Number(id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
