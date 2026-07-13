import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, accountCreateSchema, accountUpdateSchema, idDeleteSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const rows = await db.select().from(accounts).where(eq(accounts.userId, session.userId)).orderBy(accounts.id);
    return Response.json({ ok: true, rows });
  } catch (err) {
    return catchErr("manage_accounts", err, session?.userId);
  }
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(accountCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const dbType: "Cash" | "Bank" | "Wallet" | "Gold" | "RealEstate" | "Other" =
      b.type === "Cash" || b.type === "Bank" || b.type === "Wallet" || b.type === "Gold" || b.type === "RealEstate" || b.type === "Other"
        ? b.type
        : b.type === "CreditCard"
        ? "Bank"
        : "Other";

    const [row] = await db.insert(accounts).values({
      userId: session.userId,
      name: b.name,
      type: dbType,
      category: b.category,
      balance: b.balance,
      memberId: b.memberId,
    }).returning();
    return Response.json({ ok: true, row });
  } catch (err) {
    return catchErr("manage_accounts", err, session?.userId);
  }
}

export async function PATCH(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(accountUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    // Build safe update object — only explicitly provided fields
    const safeUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.type !== undefined) {
      safeUpdates.type =
        updates.type === "Cash" || updates.type === "Bank" || updates.type === "Wallet" || updates.type === "Gold" || updates.type === "RealEstate" || updates.type === "Other"
          ? updates.type
          : updates.type === "CreditCard"
          ? "Bank"
          : "Other";
    }
    if (updates.category !== undefined) safeUpdates.category = updates.category;
    if (updates.balance !== undefined) safeUpdates.balance = updates.balance;
    if (updates.memberId !== undefined) safeUpdates.memberId = updates.memberId;

    await db.update(accounts).set(safeUpdates).where(and(eq(accounts.id, id), eq(accounts.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_accounts", err, session?.userId);
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

    await db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, session.userId)));
    return Response.json({ ok: true });
  } catch (err) {
    return catchErr("manage_accounts", err, session?.userId);
  }
}
