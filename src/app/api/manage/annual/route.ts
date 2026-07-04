import { db } from "@/db";
import { annualPlans } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(annualPlans).where(eq(annualPlans.userId, session.userId)).orderBy(annualPlans.year, annualPlans.id);
    return Response.json({ ok: true, rows });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const b = await req.json();
    const [row] = await db.insert(annualPlans).values({
      userId: session.userId,
      year: Number(b.year),
      title: b.title,
      category: b.category,
      targetAmount: String(b.targetAmount || 0),
      progress: Number(b.progress || 0),
      status: b.status || "Planned",
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
    const { id, userId: _ignoredUserId, ...updates } = await req.json();
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
    if (updates.targetAmount !== undefined) updates.targetAmount = updates.targetAmount ? String(updates.targetAmount) : "0";
    if (updates.progress !== undefined) updates.progress = Number(updates.progress);
    if (updates.year !== undefined) updates.year = Number(updates.year);
    await db.update(annualPlans).set(updates).where(and(eq(annualPlans.id, Number(id)), eq(annualPlans.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
    await db.delete(annualPlans).where(and(eq(annualPlans.id, Number(id)), eq(annualPlans.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
