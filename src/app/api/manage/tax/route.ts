import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { taxProfile } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, taxProfileCreateSchema, taxProfileUpdateSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(taxProfile).where(eq(taxProfile.userId, session.userId));
    return Response.json({ ok: true, row: rows[0] || null });
  } catch (err) {
    return catchErr("manage_tax", err, session?.userId);
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(taxProfileCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    await db.delete(taxProfile).where(eq(taxProfile.userId, session.userId));
    const [row] = await db.insert(taxProfile).values({
      userId: session.userId,
      regime: b.regime,
      grossSalary: b.grossSalary,
      businessIncome: b.businessIncome,
      capitalGains: b.capitalGains,
      section80c: b.section80c,
      section80d: b.section80d,
      hraExemption: b.hraExemption,
      homeLoanInterest: b.homeLoanInterest,
    }).returning();
    return Response.json({ ok: true, row });
  } catch (err) {
    return catchErr("manage_tax", err, session?.userId);
  }
}

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(taxProfileUpdateSchema, raw);
    if (!result.ok) return result.error;
    const updates = result.data;

    const existing = await db.select().from(taxProfile).where(eq(taxProfile.userId, session.userId));
    if (existing.length) {
      await db.update(taxProfile).set(updates).where(and(eq(taxProfile.id, existing[0].id), eq(taxProfile.userId, session.userId)));
    } else {
      await db.insert(taxProfile).values({
        userId: session.userId,
        regime: updates.regime ?? "new",
        grossSalary: updates.grossSalary ?? "0",
        businessIncome: updates.businessIncome ?? "0",
        capitalGains: updates.capitalGains ?? "0",
        section80c: updates.section80c ?? "0",
        section80d: updates.section80d ?? "0",
        hraExemption: updates.hraExemption ?? "0",
        homeLoanInterest: updates.homeLoanInterest ?? "0",
      });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_tax", err, session?.userId);
  }
}

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    await db.delete(taxProfile).where(eq(taxProfile.userId, session.userId));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_tax", err, session?.userId);
  }
}
