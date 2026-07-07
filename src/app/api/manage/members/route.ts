import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { members } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, memberCreateSchema, memberUpdateSchema, idDeleteSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(members).where(eq(members.userId, session.userId)).orderBy(members.id);
    return Response.json({ ok: true, rows });
  } catch (err) {
    return catchErr("manage_members", err, session?.userId);
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(memberCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const [row] = await db.insert(members).values({
      userId: session.userId,
      name: b.name,
      role: b.role,
      color: b.color,
    }).returning();
    return Response.json({ ok: true, row });
  } catch (err) {
    return catchErr("manage_members", err, session?.userId);
  }
}

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(memberUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    // Previously this passed `updates` directly — mass assignment vulnerability.
    // Now only whitelisted fields are forwarded.
    const safeUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.role !== undefined) safeUpdates.role = updates.role;
    if (updates.color !== undefined) safeUpdates.color = updates.color;

    await db.update(members).set(safeUpdates).where(and(eq(members.id, id), eq(members.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_members", err, session?.userId);
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

    await db.delete(members).where(and(eq(members.id, id), eq(members.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_members", err, session?.userId);
  }
}
