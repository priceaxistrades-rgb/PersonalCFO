import { db } from "@/db";
import {
  accounts,
  bills,
  budgets,
  debts,
  goals,
  insurance,
  investments,
  members,
  netWorthSnapshots,
  transactions,
  annualPlans,
  taxProfile,
  emergencyItems,
  watchlist,
} from "@/db/schema";
import { desc, asc, inArray, eq, and, sql, count, lt, gte } from "drizzle-orm";
import {
  toPaise,
  fromPaise,
  paiseToNumber,
} from "./finance-math";
import { requireServerSession } from "./server-auth";
import { logger } from "./logger";
import type { PaginationInput } from "./types";

// Import client-safe utilities locally + re-export for consumers
import {
  monthKey,
  lastNMonths,
  currentMonthKey,
  sumByPaise,
  sumBy,
  monthlyFlow,
  expenseByCategory,
  healthScore,
  type TxnLike,
} from "./data-utils";

export {
  monthKey,
  lastNMonths,
  currentMonthKey,
  sumByPaise,
  sumBy,
  monthlyFlow,
  expenseByCategory,
  healthScore,
};

async function uid() {
  return (await requireServerSession()).userId;
}

export async function getCurrentUser() {
  return requireServerSession();
}

// ─── Pagination helper ─────────────────────────────────────────

export async function getPaginated<T>(
  query: any,
  table: any,
  userIdFilter: any,
  pagination: { page: number; limit: number; offset: number },
) {
  // Count total rows
  const [{ total }] = await db
    .select({ total: count() })
    .from(table)
    .where(userIdFilter);

  // Get paginated rows
  const rows = await query;

  return {
    rows,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
    hasMore: pagination.page * pagination.limit < total,
  };
}

// ─── Basic getters (no pagination) ────────────────────────────

export async function getMembers() {
  const userId = await uid();
  return db.select().from(members).where(eq(members.userId, userId)).orderBy(asc(members.id));
}
export async function getAccounts() {
  const userId = await uid();
  return db.select().from(accounts).where(eq(accounts.userId, userId)).orderBy(asc(accounts.id));
}

export async function getAccountsByMember(memberIds: number[]) {
  const userId = await uid();
  if (memberIds.length === 0) return getAccounts();
  return db.select().from(accounts).where(and(eq(accounts.userId, userId), inArray(accounts.memberId, memberIds))).orderBy(asc(accounts.id));
}

// ─── Transactions with pagination ──────────────────────────────

export async function getTransactions(opts?: PaginationInput & { type?: string; from?: string; to?: string }) {
  const userId = await uid();
  const page = opts?.page || 1;
  const limit = opts?.limit || 50;
  const offset = (page - 1) * limit;

  const conditions = [eq(transactions.userId, userId)];
  if (opts?.type) conditions.push(eq(transactions.type, opts.type as "income" | "expense"));
  if (opts?.from) conditions.push(gte(transactions.txnDate, opts.from));
  if (opts?.to) conditions.push(lt(transactions.txnDate, opts.to));

  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(transactions).where(where).orderBy(desc(transactions.txnDate), desc(transactions.id)).limit(limit).offset(offset),
    db.select({ total: count() }).from(transactions).where(where),
  ]);

  return {
    rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}

// ─── All transactions (for dashboard, no pagination) ───────────

export async function getAllTransactions() {
  const userId = await uid();
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.txnDate), desc(transactions.id));
}

export async function getBudgets() {
  const userId = await uid();
  return db.select().from(budgets).where(eq(budgets.userId, userId)).orderBy(asc(budgets.id));
}
export async function getGoals() {
  const userId = await uid();
  return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.id));
}
export async function getInvestments() {
  const userId = await uid();
  return db.select().from(investments).where(eq(investments.userId, userId)).orderBy(asc(investments.id));
}

export async function getInvestmentsByMember(memberIds: number[]) {
  const userId = await uid();
  if (memberIds.length === 0) return getInvestments();
  return db.select().from(investments).where(and(eq(investments.userId, userId), inArray(investments.memberId, memberIds))).orderBy(asc(investments.id));
}
export async function getDebts() {
  const userId = await uid();
  return db.select().from(debts).where(eq(debts.userId, userId)).orderBy(asc(debts.id));
}

export async function getDebtsByMember(memberIds: number[]) {
  const userId = await uid();
  if (memberIds.length === 0) return getDebts();
  return db.select().from(debts).where(and(eq(debts.userId, userId), inArray(debts.memberId, memberIds))).orderBy(asc(debts.id));
}
export async function getBills() {
  const userId = await uid();
  return db.select().from(bills).where(eq(bills.userId, userId)).orderBy(asc(bills.dueDate));
}
export async function getInsurance() {
  const userId = await uid();
  return db.select().from(insurance).where(eq(insurance.userId, userId)).orderBy(asc(insurance.renewalDate));
}
export async function getSnapshots() {
  const userId = await uid();
  return db.select().from(netWorthSnapshots).where(eq(netWorthSnapshots.userId, userId)).orderBy(asc(netWorthSnapshots.snapshotDate));
}
export async function getAnnualPlans() {
  const userId = await uid();
  return db.select().from(annualPlans).where(eq(annualPlans.userId, userId)).orderBy(asc(annualPlans.id));
}
export async function getTaxProfile() {
  const userId = await uid();
  const rows = await db.select().from(taxProfile).where(eq(taxProfile.userId, userId));
  return rows[0] ?? null;
}
export async function getEmergencyItems() {
  const userId = await uid();
  return db.select().from(emergencyItems).where(eq(emergencyItems.userId, userId)).orderBy(asc(emergencyItems.id));
}
export async function getWatchlist() {
  const userId = await uid();
  return db.select().from(watchlist).where(eq(watchlist.userId, userId)).orderBy(asc(watchlist.id));
}

export type Txn = Awaited<ReturnType<typeof getAllTransactions>>[number];

export async function computeNetWorth(memberIds: number[] = []) {
  const [accs, invs, dbts] = await Promise.all([
    memberIds.length ? getAccountsByMember(memberIds) : getAccounts(),
    memberIds.length ? getInvestmentsByMember(memberIds) : getInvestments(),
    memberIds.length ? getDebtsByMember(memberIds) : getDebts(),
  ]);
  // BigInt accumulation — zero floating-point drift
  const liquidAssets = sumByPaise(accs, (a) => a.balance);
  const investmentValue = sumByPaise(invs, (i) => i.currentValue);
  const totalAssets = liquidAssets + investmentValue;
  const liabilities = sumByPaise(dbts, (d) => d.outstanding);
  return {
    liquidAssets,
    investmentValue,
    totalAssets,
    liabilities,
    netWorth: totalAssets - liabilities,
  };
}

export async function syncAccountBalances() {
  const userId = await uid();
  logger.info("Syncing account balances", { userId });

  try {
    // Use SQL SUM instead of loading all transactions into memory
    const allAccs = await db.select().from(accounts).where(eq(accounts.userId, userId));

    // For each account, compute balance from transactions
    const balances = new Map<number, bigint>();
    allAccs.forEach((a) => balances.set(a.id, 0n));

    // Still need to iterate transactions for per-account balance,
    // but this is more efficient than loading everything
    const allTxns = await db.select().from(transactions).where(eq(transactions.userId, userId));

    for (const t of allTxns) {
      if (t.accountId) {
        const amount = toPaise(t.amount);
        const delta = t.type === "income" ? amount : -amount;
        balances.set(t.accountId, (balances.get(t.accountId) || 0n) + delta);
      }
    }

    if (balances.size > 0) {
      await db.transaction(async (tx) => {
        for (const [id, bal] of balances.entries()) {
          await tx.update(accounts).set({ balance: fromPaise(bal) }).where(eq(accounts.id, id));
        }
      });
    }

    logger.info("Account balances synced", { userId, accountCount: balances.size });
    return { success: true };
  } catch (err) {
    logger.error("Failed to sync account balances", err, { userId });
    throw err;
  }
}

export { estimateTax } from "./tax";
export type { TaxInput } from "./tax";
