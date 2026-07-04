import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

function signedAmount(type: string, amount: number) {
  return type === "income" ? amount : -amount;
}

async function applyAccountImpact(tx: any, input: { accountId: number | null; type: string; amount: number; userId: number }, multiplier = 1) {
  if (!input.accountId || !Number.isFinite(input.amount)) return;
  const delta = signedAmount(input.type, input.amount) * multiplier;
  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} + ${String(delta)}` })
    .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, input.userId)));
}

export async function POST(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  try {
    const b = await req.json();
    if (!b.type || !b.category || !b.amount || !b.txnDate) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const amount = Number(b.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    const accountId = b.accountId ? Number(b.accountId) : null;

    const [row] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(transactions)
        .values({
          userId: session.userId,
          type: b.type,
          category: b.category,
          amount: String(amount),
          txnDate: b.txnDate,
          memberId: b.memberId ? Number(b.memberId) : null,
          accountId,
          note: b.note || null,
        })
        .returning();

      await applyAccountImpact(tx, { accountId, type: b.type, amount, userId: session.userId }, 1);
      return [created];
    });

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

    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, Number(id)), eq(transactions.userId, session.userId)));

    if (!existing) return Response.json({ error: "Transaction not found" }, { status: 404 });

    const nextType = updates.type ?? existing.type;
    const nextAmount = updates.amount !== undefined ? Number(updates.amount) : Number(existing.amount);
    const nextAccountId = updates.accountId !== undefined ? (updates.accountId ? Number(updates.accountId) : null) : existing.accountId;

    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (updates.amount !== undefined) updates.amount = String(nextAmount);
    if (updates.memberId !== undefined) updates.memberId = updates.memberId ? Number(updates.memberId) : null;
    if (updates.accountId !== undefined) updates.accountId = nextAccountId;

    await db.transaction(async (tx) => {
      await applyAccountImpact(tx, {
        accountId: existing.accountId,
        type: existing.type,
        amount: Number(existing.amount),
        userId: session.userId,
      }, -1);

      await tx
        .update(transactions)
        .set(updates)
        .where(and(eq(transactions.id, Number(id)), eq(transactions.userId, session.userId)));

      await applyAccountImpact(tx, {
        accountId: nextAccountId,
        type: nextType,
        amount: nextAmount,
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
    const { id, ids } = await req.json();

    if (ids && Array.isArray(ids)) {
      const rows = await db.select().from(transactions).where(and(eq(transactions.userId, session.userId), inArray(transactions.id, ids.map(Number))));
      await db.transaction(async (tx) => {
        for (const row of rows) {
          await applyAccountImpact(tx, { accountId: row.accountId, type: row.type, amount: Number(row.amount), userId: session.userId }, -1);
        }
        await tx.delete(transactions).where(and(eq(transactions.userId, session.userId), inArray(transactions.id, ids.map(Number))));
      });
    } else if (id) {
      const [row] = await db.select().from(transactions).where(and(eq(transactions.id, Number(id)), eq(transactions.userId, session.userId)));
      if (!row) return Response.json({ error: "Transaction not found" }, { status: 404 });
      await db.transaction(async (tx) => {
        await applyAccountImpact(tx, { accountId: row.accountId, type: row.type, amount: Number(row.amount), userId: session.userId }, -1);
        await tx.delete(transactions).where(and(eq(transactions.id, Number(id)), eq(transactions.userId, session.userId)));
      });
    } else {
      return Response.json({ error: "No id or ids provided" }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
