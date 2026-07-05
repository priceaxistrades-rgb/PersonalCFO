import { db } from "@/db";
import { bills } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, billCreateSchema, billUpdateSchema, idDeleteSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(bills).where(eq(bills.userId, session.userId)).orderBy(bills.dueDate);
    return Response.json({ ok: true, rows });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(billCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const [row] = await db.insert(bills).values({
      userId: session.userId,
      name: b.name,
      category: b.category,
      amount: b.amount,
      dueDate: b.dueDate,
      frequency: b.frequency,
      paid: b.paid,
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
    const raw = await req.json();
    const result = validate(billUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    const safeUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.category !== undefined) safeUpdates.category = updates.category;
    if (updates.amount !== undefined) safeUpdates.amount = updates.amount;
    if (updates.dueDate !== undefined) safeUpdates.dueDate = updates.dueDate;
    if (updates.frequency !== undefined) safeUpdates.frequency = updates.frequency;
    if (updates.paid !== undefined) safeUpdates.paid = updates.paid;

    await db.update(bills).set(safeUpdates).where(and(eq(bills.id, id), eq(bills.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(idDeleteSchema, raw);
    if (!result.ok) return result.error;
    const { id } = result.data;

    await db.delete(bills).where(and(eq(bills.id, id), eq(bills.userId, session.userId)));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
