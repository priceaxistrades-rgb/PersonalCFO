import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { insurance } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, insuranceCreateSchema, insuranceUpdateSchema, idDeleteSchema } from "@/lib/validation";
import { verifyInsuranceOwnership } from "@/lib/ownership";
import { rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(insurance).where(eq(insurance.userId, session.userId)).orderBy(insurance.renewalDate);
    return Response.json({ ok: true, rows });
  } catch (err) {
    return catchErr("manage_insurance", err, session?.userId);
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(insuranceCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const [row] = await db.insert(insurance).values({
      userId: session.userId,
      name: b.name,
      type: b.type,
      provider: b.provider,
      premium: b.premium,
      coverage: b.coverage,
      renewalDate: b.renewalDate,
    }).returning();
    return Response.json({ ok: true, row });
  } catch (err) {
    return catchErr("manage_insurance", err, session?.userId);
  }
}

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  const limited = await rateLimitAsync(`insurance:${session.userId}`, 25, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    const raw = await req.json();
    const result = validate(insuranceUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    if (!(await verifyInsuranceOwnership(id, session.userId))) {
      return Response.json({ ok: false, error: "Policy not found or access denied" }, { status: 404 });
    }

    const safeUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.type !== undefined) safeUpdates.type = updates.type;
    if (updates.provider !== undefined) safeUpdates.provider = updates.provider;
    if (updates.premium !== undefined) safeUpdates.premium = updates.premium;
    if (updates.coverage !== undefined) safeUpdates.coverage = updates.coverage;
    if (updates.renewalDate !== undefined) safeUpdates.renewalDate = updates.renewalDate;

    await db.update(insurance).set(safeUpdates).where(and(eq(insurance.id, id), eq(insurance.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_insurance", err, session?.userId);
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

    await db.delete(insurance).where(and(eq(insurance.id, id), eq(insurance.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_insurance", err, session?.userId);
  }
}
