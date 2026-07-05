import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, transactionCreateSchema, transactionUpdateSchema, transactionDeleteSchema } from "@/lib/validation";
import { toPaise, fromPaise } from "@/lib/finance-math";

/**
 * Apply account balance impact using PostgreSQL NUMERIC arithmetic.
 * The delta is computed as a precise string to avoid JavaScript float errors.
 * PostgreSQL's NUMERIC type performs exact decimal arithmetic internally.
 */
async function applyAccountImpact(
  tx: any,
  input: { accountId: number | null; type: string; amountStr: string; userId: number },
  multiplier: 1 | -1 = 1,
) {
  if (!input.accountId) return;

  // Compute delta as a string using BigInt paise arithmetic
  const amountPaise = toPaise(input.amountStr);
  const deltaPaise = input.type === "income" ? amountPaise * BigInt(multiplier) : -amountPaise * BigInt(multiplier);
  const deltaStr = fromPaise(deltaPaise);

  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} + ${deltaStr}` })
    .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, input.userId)));
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const raw = await req.json();
    const result = validate(transactionCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const amount = Number(b.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Invalid amount", details: { amount: "Must be a positive number" } }, { status: 400 });
    }

    const accountId = b.accountId ? Number(b.accountId) : null;

    const [row] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(transactions)
        .values({
          userId: session.userId,
          type: b.type,
          category: b.category,
          amount: b.amount,
          txnDate: b.txnDate,
          memberId: b.memberId ? Number(b.memberId) : null,
          accountId,
          note: b.note ?? null,
        })
        .returning();
      return [created];
    });

    // Apply account impact in a separate transaction using the stored string amount
    if (accountId) {
      await db.transaction(async (tx) => {
        await applyAccountImpact(tx, {
          accountId,
          type: b.type,
          amountStr: b.amount,
          userId: session.userId,
        }, 1);
      });
    }

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
    const result = validate(transactionUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, session.userId)));

    if (!existing) return Response.json({ error: "Transaction not found" }, { status: 404 });

    const nextType = updates.type ?? existing.type;
    const nextAmount = updates.amount !== undefined ? updates.amount : existing.amount;
    const nextAccountId = updates.accountId !== undefined ? (updates.accountId ? Number(updates.accountId) : null) : existing.accountId;

    const nextAmountNum = Number(nextAmount);
    if (!Number.isFinite(nextAmountNum) || nextAmountNum <= 0) {
      return Response.json({ error: "Invalid amount", details: { amount: "Must be a positive number" } }, { status: 400 });
    }

    // Build safe update object — only whitelisted fields
    const safeUpdates: Record<string, unknown> = {};
    if (updates.type !== undefined) safeUpdates.type = updates.type;
    if (updates.category !== undefined) safeUpdates.category = updates.category;
    if (updates.amount !== undefined) safeUpdates.amount = nextAmount;
    if (updates.txnDate !== undefined) safeUpdates.txnDate = updates.txnDate;
    if (updates.memberId !== undefined) safeUpdates.memberId = updates.memberId;
    if (updates.accountId !== undefined) safeUpdates.accountId = nextAccountId;
    if (updates.note !== undefined) safeUpdates.note = updates.note;

    await db.transaction(async (tx) => {
      // Reverse the old impact
      await applyAccountImpact(tx, {
        accountId: existing.accountId,
        type: existing.type,
        amountStr: existing.amount,
        userId: session.userId,
      }, -1);

      // Apply the new impact
      await tx
        .update(transactions)
        .set(safeUpdates)
        .where(and(eq(transactions.id, id), eq(transactions.userId, session.userId)));

      await applyAccountImpact(tx, {
        accountId: nextAccountId,
        type: nextType,
        amountStr: nextAmount,
        userId: session.userId,
      }, 1);
    });

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
    const result = validate(transactionDeleteSchema, raw);
    if (!result.ok) return result.error;
    const { id, ids } = result.data;

    if (ids && Array.isArray(ids)) {
      const rows = await db.select().from(transactions).where(and(eq(transactions.userId, session.userId), inArray(transactions.id, ids)));
      await db.transaction(async (tx) => {
        for (const row of rows) {
          await applyAccountImpact(tx, { accountId: row.accountId, type: row.type, amountStr: row.amount, userId: session.userId }, -1);
        }
        await tx.delete(transactions).where(and(eq(transactions.userId, session.userId), inArray(transactions.id, ids)));
      });
    } else if (id) {
      const [row] = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, session.userId)));
      if (!row) return Response.json({ error: "Transaction not found" }, { status: 404 });
      await db.transaction(async (tx) => {
        await applyAccountImpact(tx, { accountId: row.accountId, type: row.type, amountStr: row.amount, userId: session.userId }, -1);
        await tx.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, session.userId)));
      });
    } else {
      return Response.json({ error: "No id or ids provided" }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
