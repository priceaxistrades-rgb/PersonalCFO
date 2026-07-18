import crypto from "crypto";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, accountTransfers } from "@/db/schema";
import { apiError, apiHandler, apiSuccess } from "@/lib/api-utils";
import { fromPaise, toPaise } from "@/lib/finance-math";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";

const transferSchema = z.object({
  fromAccountId: z.number().int().positive(),
  toAccountId: z.number().int().positive(),
  amount: z.union([z.string(), z.number()]).transform(String),
  transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(500).nullable().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.fromAccountId === value.toAccountId) ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Accounts must be different" });
  try {
    if (toPaise(value.amount) <= 0n) ctx.addIssue({ code: "custom", path: ["amount"], message: "Amount must be positive" });
  } catch {
    ctx.addIssue({ code: "custom", path: ["amount"], message: "Invalid amount" });
  }
});

export const GET = apiHandler(async (req) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  const rows = await db.select().from(accountTransfers)
    .where(eq(accountTransfers.userId, session.userId))
    .orderBy(desc(accountTransfers.transferDate), desc(accountTransfers.id));
  return apiSuccess({ rows });
});

export const POST = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  const limited = await rateLimitAsync(`transfers:${session.userId}:${getClientIp(req)}`, 20, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);
  const parsed = transferSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("Invalid transfer", 400);

  const input = parsed.data;
  const amount = fromPaise(toPaise(input.amount));
  const groupId = `trf_${crypto.randomUUID()}`;

  const result = await db.transaction(async (tx) => {
    const ownedAccounts = await tx.select({ id: accounts.id, balance: accounts.balance })
      .from(accounts)
      .where(and(
        eq(accounts.userId, session.userId),
        sql`${accounts.id} IN (${input.fromAccountId}, ${input.toAccountId})`,
      ));
    if (ownedAccounts.length !== 2) throw new Error("TRANSFER_ACCOUNT_NOT_FOUND");
    const source = ownedAccounts.find((account) => account.id === input.fromAccountId);
    if (!source || toPaise(source.balance) < toPaise(amount)) throw new Error("TRANSFER_INSUFFICIENT_FUNDS");

    const debit = await tx.update(accounts)
      .set({ balance: sql`${accounts.balance} - ${amount}`, updatedAt: new Date() })
      .where(and(eq(accounts.id, input.fromAccountId), eq(accounts.userId, session.userId)))
      .returning({ id: accounts.id });
    const credit = await tx.update(accounts)
      .set({ balance: sql`${accounts.balance} + ${amount}`, updatedAt: new Date() })
      .where(and(eq(accounts.id, input.toAccountId), eq(accounts.userId, session.userId)))
      .returning({ id: accounts.id });
    if (debit.length !== 1 || credit.length !== 1) throw new Error("TRANSFER_ACCOUNT_NOT_FOUND");

    const [row] = await tx.insert(accountTransfers).values({
      userId: session.userId,
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount,
      transferDate: input.transferDate,
      note: input.note || null,
      transferGroupId: groupId,
    }).returning();
    return row;
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message.startsWith("TRANSFER_")) return error;
    throw error;
  });

  if (result instanceof Error) {
    if (result.message === "TRANSFER_INSUFFICIENT_FUNDS") return apiError("Insufficient source account balance", 409);
    return apiError("One or both accounts were not found", 404);
  }
  writeAuditLog({
    userId: session.userId,
    action: "create",
    table: "account_transfers",
    recordId: result.id,
    ip: getClientIp(req),
    changes: { fromAccountId: input.fromAccountId, toAccountId: input.toAccountId, amount, transferDate: input.transferDate },
  });
  log.info("Account transfer completed", { userId: session.userId, transferId: result.id });
  return apiSuccess({ row: result });
});
