import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, recurringRules } from "@/db/schema";
import { apiError, apiHandler, apiSuccess } from "@/lib/api-utils";
import { toPaise, fromPaise } from "@/lib/finance-math";
import { getClientIp, rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { writeAuditLog } from "@/lib/audit";

const frequency = z.enum(["weekly", "monthly", "quarterly", "yearly"]);
const createSchema = z.object({
  accountId: z.number().int().positive().nullable().optional(),
  transactionType: z.enum(["income", "expense"]),
  category: z.string().trim().min(1).max(50),
  amount: z.union([z.string(), z.number()]).transform(String),
  note: z.string().trim().max(500).nullable().optional(),
  frequency,
  intervalCount: z.number().int().min(1).max(120).default(1),
  nextRunDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).strict();
const updateSchema = z.object({ id: z.number().int().positive(), active: z.boolean() }).strict();
const deleteSchema = z.object({ id: z.number().int().positive() }).strict();

export const GET = apiHandler(async (req) => {
  const session = requireApiSession(req); if (!isSession(session)) return session;
  const rows = await db.select().from(recurringRules).where(eq(recurringRules.userId, session.userId)).orderBy(asc(recurringRules.nextRunDate));
  return apiSuccess({ rows });
});

export const POST = apiHandler(async (req) => {
  const session = requireApiSession(req); if (!isSession(session)) return session;
  const limited = await rateLimitAsync(`recurring:${session.userId}:${getClientIp(req)}`, 20, 60_000); if (!limited.ok) return rateLimitResponse(limited.resetAt);
  const parsed = createSchema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return apiError("Invalid recurring rule", 400);
  let amount: string; try { const paise = toPaise(parsed.data.amount); if (paise <= 0n) return apiError("Amount must be positive", 400); amount = fromPaise(paise); } catch { return apiError("Invalid amount", 400); }
  if (parsed.data.endDate && parsed.data.endDate < parsed.data.nextRunDate) return apiError("End date must not be before the next run date", 400);
  if (parsed.data.accountId) {
    const [owned] = await db.select({ id: accounts.id }).from(accounts).where(and(eq(accounts.id, parsed.data.accountId), eq(accounts.userId, session.userId)));
    if (!owned) return apiError("Account not found", 404);
  }
  const [row] = await db.insert(recurringRules).values({ ...parsed.data, amount, userId: session.userId, note: parsed.data.note || null, endDate: parsed.data.endDate || null }).returning();
  writeAuditLog({ userId: session.userId, action: "create", table: "recurring_rules", recordId: row.id, ip: getClientIp(req), changes: { type: row.transactionType, amount, frequency: row.frequency } });
  return apiSuccess({ row });
});

export const PATCH = apiHandler(async (req) => {
  const session = requireApiSession(req); if (!isSession(session)) return session;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return apiError("Invalid recurring rule update", 400);
  const [row] = await db.update(recurringRules).set({ active: parsed.data.active, updatedAt: new Date() }).where(and(eq(recurringRules.id, parsed.data.id), eq(recurringRules.userId, session.userId))).returning();
  if (!row) return apiError("Recurring rule not found", 404);
  writeAuditLog({ userId: session.userId, action: "update", table: "recurring_rules", recordId: row.id, changes: { active: row.active } }); return apiSuccess({ row });
});

export const DELETE = apiHandler(async (req) => {
  const session = requireApiSession(req); if (!isSession(session)) return session;
  const parsed = deleteSchema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return apiError("Invalid recurring rule", 400);
  const [row] = await db.delete(recurringRules).where(and(eq(recurringRules.id, parsed.data.id), eq(recurringRules.userId, session.userId))).returning({ id: recurringRules.id });
  if (!row) return apiError("Recurring rule not found", 404);
  writeAuditLog({ userId: session.userId, action: "delete", table: "recurring_rules", recordId: row.id }); return apiSuccess({ id: row.id });
});
