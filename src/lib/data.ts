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
import { desc, asc, inArray, eq, and } from "drizzle-orm";
import { num } from "./format";
import { requireServerSession } from "./server-auth";

async function uid() {
  return (await requireServerSession()).userId;
}

export async function getCurrentUser() {
  return requireServerSession();
}

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
export async function getTransactions() {
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

export type Txn = Awaited<ReturnType<typeof getTransactions>>[number];

export function monthKey(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function lastNMonths(n: number): { key: string; label: string; date: Date }[] {
  const out: { key: string; label: string; date: Date }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: monthKey(d),
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      date: d,
    });
  }
  return out;
}

export function sumBy<T>(arr: T[], fn: (x: T) => number): number {
  return arr.reduce((s, x) => s + fn(x), 0);
}

export function monthlyFlow(txns: Txn[], months: { key: string; label: string }[]) {
  return months.map((m) => {
    const income = sumBy(
      txns.filter((t) => t.type === "income" && monthKey(t.txnDate) === m.key),
      (t) => num(t.amount)
    );
    const expense = sumBy(
      txns.filter((t) => t.type === "expense" && monthKey(t.txnDate) === m.key),
      (t) => num(t.amount)
    );
    return { ...m, income, expense, savings: income - expense };
  });
}

export function expenseByCategory(txns: Txn[], monthKeys?: string[]) {
  const map = new Map<string, number>();
  txns
    .filter((t) => t.type === "expense" && (!monthKeys || monthKeys.includes(monthKey(t.txnDate))))
    .forEach((t) => map.set(t.category, (map.get(t.category) || 0) + num(t.amount)));
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function currentMonthKey(): string {
  return monthKey(new Date());
}

export async function computeNetWorth(memberIds: number[] = []) {
  const [accs, invs, dbts] = await Promise.all([
    memberIds.length ? getAccountsByMember(memberIds) : getAccounts(),
    memberIds.length ? getInvestmentsByMember(memberIds) : getInvestments(),
    memberIds.length ? getDebtsByMember(memberIds) : getDebts(),
  ]);
  const liquidAssets = sumBy(accs, (a) => num(a.balance));
  const investmentValue = sumBy(invs, (i) => num(i.currentValue));
  const totalAssets = liquidAssets + investmentValue;
  const liabilities = sumBy(dbts, (d) => num(d.outstanding));
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
  const allTxns = await db.select().from(transactions).where(eq(transactions.userId, userId));
  const allAccs = await db.select().from(accounts).where(eq(accounts.userId, userId));
  
  const balances = new Map<number, number>();
  allAccs.forEach(a => balances.set(a.id, 0));

  for (const t of allTxns) {
    if (t.accountId) {
      const amount = num(t.amount);
      const delta = t.type === "income" ? amount : -amount;
      balances.set(t.accountId, (balances.get(t.accountId) || 0) + delta);
    }
  }

  if (balances.size > 0) {
    await db.transaction(async (tx) => {
      for (const [id, bal] of balances.entries()) {
        await tx.update(accounts).set({ balance: String(bal) }).where(eq(accounts.id, id));
      }
    });
  }
  return { success: true };
}

export { estimateTax } from "./tax";
export type { TaxInput } from "./tax";

export function healthScore(input: {
  savingsRate: number;
  emergencyMonths: number;
  debtToIncome: number;
  investmentRate: number;
}) {
  let score = 0;
  score += Math.min(30, (input.savingsRate / 30) * 30);
  score += Math.min(25, (input.emergencyMonths / 6) * 25);
  score += Math.max(0, Math.min(25, 25 - ((input.debtToIncome - 20) / 40) * 25));
  score += Math.min(20, (input.investmentRate / 50) * 20);
  return Math.round(Math.max(0, Math.min(100, score)));
}
