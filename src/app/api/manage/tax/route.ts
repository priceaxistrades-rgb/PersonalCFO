import { db } from "@/db";
import { taxProfile } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

const moneyFields = [
  "grossSalary",
  "businessIncome",
  "capitalGains",
  "section80c",
  "section80d",
  "hraExemption",
  "homeLoanInterest",
];

function normalize(updates: Record<string, any>) {
  for (const f of moneyFields) {
    if (updates[f] !== undefined) updates[f] = String(updates[f] || 0);
  }
  return updates;
}

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(taxProfile).where(eq(taxProfile.userId, session.userId));
    return Response.json({ ok: true, row: rows[0] || null });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const b = normalize(await req.json());
    await db.delete(taxProfile).where(eq(taxProfile.userId, session.userId));
    const [row] = await db.insert(taxProfile).values({
      userId: session.userId,
      regime: b.regime || "new",
      grossSalary: b.grossSalary || "0",
      businessIncome: b.businessIncome || "0",
      capitalGains: b.capitalGains || "0",
      section80c: b.section80c || "0",
      section80d: b.section80d || "0",
      hraExemption: b.hraExemption || "0",
      homeLoanInterest: b.homeLoanInterest || "0",
    }).returning();
    return Response.json({ ok: true, row });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const updates = normalize(await req.json());
    const existing = await db.select().from(taxProfile).where(eq(taxProfile.userId, session.userId));
    if (existing.length) {
      await db.update(taxProfile).set(updates).where(and(eq(taxProfile.id, existing[0].id), eq(taxProfile.userId, session.userId)));
    } else {
      await db.insert(taxProfile).values({
        userId: session.userId,
        regime: updates.regime || "new",
        grossSalary: updates.grossSalary || "0",
        businessIncome: updates.businessIncome || "0",
        capitalGains: updates.capitalGains || "0",
        section80c: updates.section80c || "0",
        section80d: updates.section80d || "0",
        hraExemption: updates.hraExemption || "0",
        homeLoanInterest: updates.homeLoanInterest || "0",
      });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    await db.delete(taxProfile).where(eq(taxProfile.userId, session.userId));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
