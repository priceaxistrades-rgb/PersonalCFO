import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, transactionCreateSchema, transactionUpdateSchema, transactionDeleteSchema } from "@/lib/validation";
import { toPaise, fromPaise } from "@/lib/finance-math";
import { apiHandler, apiSuccess, apiError, parsePagination, paginatedResponse } from "@/lib/api-utils";
import { writeAuditLog } from "@/lib/audit";
import { sanitize, isSafeInput } from "@/lib/sanitize";

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

  const amountPaise = toPaise(input.amountStr);
  const deltaPaise = input.type === "income" ? amountPaise * BigInt(multiplier) : -amountPaise * BigInt(multiplier);
  const deltaStr = fromPaise(deltaPaise);

  await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} + ${deltaStr}` })
    .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, input.userId)));
}

export const GET = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  const url = new URL(req.url);
  const pagination = parsePagination({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  });
  const type = url.searchParams.get("type") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;

  try {
    // Import data function dynamically to avoid circular deps
    const { getTransactions } = await import("@/lib/data");
    const result = await getTransactions({ ...pagination, type, from, to });
    log.info("Fetched transactions", { page: pagination.page, limit: pagination.limit, total: result.total });
    return apiSuccess(result);
  } catch (err) {
    log.error("Failed to fetch transactions", err);
    return apiError("Failed to fetch transactions", 500, undefined, err);
  }
});

export const POST = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const raw = await req.json();
    const result = validate(transactionCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    const amount = Number(b.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return apiError("Invalid amount", 400, { amount: "Must be a positive number" });
    }

    const accountId = b.accountId ? Number(b.accountId) : null;

    // Input sanitization — prevent XSS in note/category
    if (b.note && !isSafeInput(b.note)) return apiError("Note contains disallowed content", 400);
    if (b.category && !isSafeInput(b.category)) return apiError("Invalid category", 400);

    // Single transaction: create txn + update account balance atomically
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

      // Apply account impact within the same transaction
      if (accountId) {
        await applyAccountImpact(tx, {
          accountId,
          type: b.type,
          amountStr: b.amount,
          userId: session.userId,
        }, 1);
      }

      return [created];
    });

    log.info("Transaction created", { id: row.id, type: b.type, amount: b.amount });
    writeAuditLog({ userId: session.userId, action: "create", table: "transactions", recordId: row.id, changes: { type: b.type, amount: b.amount, category: b.category } });
    return apiSuccess({ row });
  } catch (err) {
    return apiError("Failed to create transaction", 500, undefined, err);
  }
});

export const PATCH = apiHandler(async (req, { log }) => {
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

    if (!existing) return apiError("Transaction not found", 404);

    const nextType = updates.type ?? existing.type;
    const nextAmount = updates.amount !== undefined ? updates.amount : existing.amount;
    const nextAccountId = updates.accountId !== undefined ? (updates.accountId ? Number(updates.accountId) : null) : existing.accountId;

    const nextAmountNum = Number(nextAmount);
    if (!Number.isFinite(nextAmountNum) || nextAmountNum <= 0) {
      return apiError("Invalid amount", 400, { amount: "Must be a positive number" });
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

    // Atomic: reverse old + apply new in one transaction
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

    log.info("Transaction updated", { id });
    writeAuditLog({ userId: session.userId, action: "update", table: "transactions", recordId: id, changes: safeUpdates });
    return apiSuccess();
  } catch (err) {
    return apiError("Failed to update transaction", 500, undefined, err);
  }
});

export const DELETE = apiHandler(async (req, { log }) => {
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
      log.info("Bulk transactions deleted", { count: ids.length });
      writeAuditLog({ userId: session.userId, action: "delete", table: "transactions", changes: { count: ids.length } });
    } else if (id) {
      const [row] = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, session.userId)));
      if (!row) return apiError("Transaction not found", 404);
      await db.transaction(async (tx) => {
        await applyAccountImpact(tx, { accountId: row.accountId, type: row.type, amountStr: row.amount, userId: session.userId }, -1);
        await tx.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, session.userId)));
      });
      log.info("Transaction deleted", { id });
      writeAuditLog({ userId: session.userId, action: "delete", table: "transactions", recordId: id });
    } else {
      return apiError("No id or ids provided", 400);
    }

    return apiSuccess();
  } catch (err) {
    return apiError("Failed to delete transaction", 500, undefined, err);
  }
});
