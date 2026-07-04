import { db } from "@/db";
import { insurance } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(insurance).where(eq(insurance.userId, session.userId)).orderBy(insurance.renewalDate);
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
    const [row] = await db.insert(insurance).values({
      userId: session.userId,
      name: b.name,
      type: b.type,
      provider: b.provider,
      premium: String(b.premium || 0),
      coverage: String(b.coverage || 0),
      renewalDate: b.renewalDate,
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
    if (updates.premium !== undefined) updates.premium = updates.premium ? String(updates.premium) : "0";
    if (updates.coverage !== undefined) updates.coverage = updates.coverage ? String(updates.coverage) : "0";
    await db.update(insurance).set(updates).where(and(eq(insurance.id, Number(id)), eq(insurance.userId, session.userId)));
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
    await db.delete(insurance).where(and(eq(insurance.id, Number(id)), eq(insurance.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
