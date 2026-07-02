import { db } from "@/db";
import { annualPlans } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(annualPlans).orderBy(annualPlans.year, annualPlans.id);
    return Response.json({ ok: true, rows });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const [row] = await db.insert(annualPlans).values({
      year: b.year,
      title: b.title,
      category: b.category,
      targetAmount: String(b.targetAmount || 0),
      progress: b.progress || 0,
      status: b.status || "Planned",
    }).returning();
    return Response.json({ ok: true, row });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json();
    if (updates.targetAmount !== undefined) updates.targetAmount = String(updates.targetAmount);
    await db.update(annualPlans).set(updates).where(eq(annualPlans.id, Number(id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.delete(annualPlans).where(eq(annualPlans.id, Number(id)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
