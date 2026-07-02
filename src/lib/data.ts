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
import { desc, asc, inArray } from "drizzle-orm";
import { num } from "./format";

export async function getMembers() {
  return db.select().from(members).orderBy(asc(members.id));
}
export async function getAccounts() {
  return db.select().from(accounts).orderBy(asc(accounts.id));
}

export async function getAccountsByMember(memberIds: number[]) {
  if (memberIds.length === 0) return getAccounts();
  return db.select().from(accounts).where(inArray(accounts.memberId, memberIds)).orderBy(asc(accounts.id));
}
export async function getTransactions() {
  return db.select().from(transactions).orderBy(desc(transactions.txnDate), desc(transactions.id));
}
export async function getBudgets() {
  return db.select().from(budgets).orderBy(asc(budgets.id));
}
export async function getGoals() {
  return db.select().from(goals).orderBy(asc(goals.id));
}
export async function getInvestments() {
  return db.select().from(investments).orderBy(asc(investments.id));
}

export async function getInvestmentsByMember(memberIds: number[]) {
  if (memberIds.length === 0) return getInvestments();
  return db.select().from(investments).where(inArray(investments.memberId, memberIds)).orderBy(asc(investments.id));
}
export async function getDebts() {
  return db.select().from(debts).orderBy(asc(debts.id));
}

export async function getDebtsByMember(memberIds: number[]) {
  if (memberIds.length === 0) return getDebts();
  return db.select().from(debts).where(inArray(debts.memberId, memberIds)).orderBy(asc(debts.id));
}
export async function getBills() {
  return db.select().from(bills).orderBy(asc(bills.dueDate));
}
export async function getInsurance() {
  return db.select().from(insurance).orderBy(asc(insurance.renewalDate));
}
export async function getSnapshots() {
  return db.select().from(netWorthSnapshots).orderBy(asc(netWorthSnapshots.snapshotDate));
}
export async function getAnnualPlans() {
  return db.select().from(annualPlans).orderBy(asc(annualPlans.id));
}
export async function getTaxProfile() {
  const rows = await db.select().from(taxProfile);
  return rows[0] ?? null;
}
export async function getEmergencyItems() {
  return db.select().from(emergencyItems).orderBy(asc(emergencyItems.id));
}
export async function getWatchlist() {
  return db.select().from(watchlist).orderBy(asc(watchlist.id));
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

// Aggregate income & expense per month
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

// Net worth current computation
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

export { estimateTax } from "./tax";
export type { TaxInput } from "./tax";

// Financial health score (0-100)
export function healthScore(input: {
  savingsRate: number; // %
  emergencyMonths: number;
  debtToIncome: number; // %
  investmentRate: number; // % of assets invested
}) {
  let score = 0;
  // savings rate up to 30 pts (>=30% => full)
  score += Math.min(30, (input.savingsRate / 30) * 30);
  // emergency fund up to 25 pts (>=6 months full)
  score += Math.min(25, (input.emergencyMonths / 6) * 25);
  // debt ratio up to 25 pts (<=20% full, >=60% zero)
  score += Math.max(0, Math.min(25, 25 - ((input.debtToIncome - 20) / 40) * 25));
  // investment rate up to 20 pts (>=50% full)
  score += Math.min(20, (input.investmentRate / 50) * 20);
  return Math.round(Math.max(0, Math.min(100, score)));
}
