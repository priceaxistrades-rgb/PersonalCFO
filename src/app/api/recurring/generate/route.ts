import { and, eq, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, recurringRules, transactions } from "@/db/schema";
import { apiError, apiHandler, apiSuccess } from "@/lib/api-utils";
import { nextRecurringDate, type RecurringFrequency } from "@/lib/recurring";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { getClientIp, rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";

export const POST = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req); if (!isSession(session)) return session;
  const limited = await rateLimitAsync(`recurring-generate:${session.userId}:${getClientIp(req)}`, 5, 60_000); if (!limited.ok) return rateLimitResponse(limited.resetAt);
  const today = new Date().toISOString().slice(0, 10);
  const due = await db.select().from(recurringRules).where(and(
    eq(recurringRules.userId, session.userId), eq(recurringRules.active, true), lte(recurringRules.nextRunDate, today),
    or(sql`${recurringRules.endDate} IS NULL`, sql`${recurringRules.nextRunDate} <= ${recurringRules.endDate}`),
  ));
  let generated = 0; let skipped = 0;
  for (const rule of due) {
    try {
      await db.transaction(async (tx) => {
        const [existing] = await tx.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.recurringRuleId, rule.id), eq(transactions.txnDate, rule.nextRunDate))).limit(1);
        if (existing) { skipped += 1; return; }
        if (rule.accountId) {
          const [owned] = await tx.select({ id: accounts.id }).from(accounts).where(and(eq(accounts.id, rule.accountId), eq(accounts.userId, session.userId)));
          if (!owned) throw new Error("Recurring account no longer exists");
        }
        await tx.insert(transactions).values({ userId: session.userId, type: rule.transactionType as "income" | "expense", category: rule.category, amount: rule.amount, txnDate: rule.nextRunDate, accountId: rule.accountId, note: rule.note, recurringRuleId: rule.id });
        if (rule.accountId) await tx.update(accounts).set({ balance: rule.transactionType === "income" ? sql`${accounts.balance} + ${rule.amount}` : sql`${accounts.balance} - ${rule.amount}`, updatedAt: new Date() }).where(and(eq(accounts.id, rule.accountId), eq(accounts.userId, session.userId)));
        const nextDate = nextRecurringDate(rule.nextRunDate, rule.frequency as RecurringFrequency, rule.intervalCount);
        const remainsActive = !rule.endDate || nextDate <= rule.endDate;
        await tx.update(recurringRules).set({ nextRunDate: nextDate, active: remainsActive, lastGeneratedAt: new Date(), updatedAt: new Date() }).where(and(eq(recurringRules.id, rule.id), eq(recurringRules.userId, session.userId)));
        generated += 1;
      });
    } catch (error) { skipped += 1; log.warn("Recurring rule generation skipped", { ruleId: rule.id, error: String(error) }); }
  }
  if (!due.length) return apiSuccess({ generated: 0, skipped: 0, message: "No recurring entries are due." });
  return apiSuccess({ generated, skipped, message: `Generated ${generated} recurring entr${generated === 1 ? "y" : "ies"}.` });
});
