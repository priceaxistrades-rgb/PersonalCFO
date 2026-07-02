import { db } from "@/db";
import { taxProfile } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(taxProfile);
    return Response.json({ ok: true, row: rows[0] || null });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    // Clear existing and create new (only one tax profile)
    await db.delete(taxProfile);
    const [row] = await db.insert(taxProfile).values({
      regime: b.regime || "new",
      grossSalary: String(b.grossSalary || 0),
      businessIncome: String(b.businessIncome || 0),
      capitalGains: String(b.capitalGains || 0),
      section80c: String(b.section80c || 0),
      section80d: String(b.section80d || 0),
      hraExemption: String(b.hraExemption || 0),
      homeLoanInterest: String(b.homeLoanInterest || 0),
    }).returning();
    return Response.json({ ok: true, row });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const updates = await req.json();
    const fields = ['grossSalary', 'businessIncome', 'capitalGains', 'section80c', 'section80d', 'hraExemption', 'homeLoanInterest'];
    fields.forEach(f => {
      if (updates[f] !== undefined) updates[f] = String(updates[f]);
    });
    
    const existing = await db.select().from(taxProfile);
    if (existing.length > 0) {
      await db.update(taxProfile).set(updates).where(eq(taxProfile.id, existing[0].id));
    } else {
      await db.insert(taxProfile).values({
        regime: updates.regime || "new",
        grossSalary: String(updates.grossSalary || 0),
        businessIncome: String(updates.businessIncome || 0),
        capitalGains: String(updates.capitalGains || 0),
        section80c: String(updates.section80c || 0),
        section80d: String(updates.section80d || 0),
        hraExemption: String(updates.hraExemption || 0),
        homeLoanInterest: String(updates.homeLoanInterest || 0),
      });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await db.delete(taxProfile);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
