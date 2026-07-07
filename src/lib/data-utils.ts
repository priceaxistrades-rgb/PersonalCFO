/**
 * ═══════════════════════════════════════════════════════════════
 * CLIENT-SAFE DATA UTILITIES — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Pure utility functions that operate on data arrays.
 * Safe to import from client components — no DB/Node.js dependencies.
 * Server components can also import these from @/lib/data (re-exported).
 * ═══════════════════════════════════════════════════════════════
 */

import {
  toPaise,
  paiseToNumber,
} from "./finance-math";

// ─── Txn type (mirrors the DB row shape) ──────────────────────

export type TxnLike = {
  type: string;
  category: string;
  amount: string | number;
  txnDate: string | Date;
  memberId: number | null;
};

// ─── Month helpers ─────────────────────────────────────────────

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

export function currentMonthKey(): string {
  return monthKey(new Date());
}

// ─── BigInt-precise sum ────────────────────────────────────────

export function sumByPaise<T>(arr: T[], fn: (x: T) => string | number | null | undefined): number {
  let total = 0n;
  for (const x of arr) {
    total += toPaise(fn(x));
  }
  return paiseToNumber(total);
}

export function sumBy<T>(arr: T[], fn: (x: T) => number): number {
  return arr.reduce((s, x) => s + fn(x), 0);
}

// ─── Monthly flow & category aggregation ──────────────────────

export function monthlyFlow(txns: TxnLike[], months: { key: string; label: string }[]) {
  return months.map((m) => {
    const income = sumByPaise(
      txns.filter((t) => t.type === "income" && monthKey(t.txnDate) === m.key),
      (t) => t.amount,
    );
    const expense = sumByPaise(
      txns.filter((t) => t.type === "expense" && monthKey(t.txnDate) === m.key),
      (t) => t.amount,
    );
    return { ...m, income, expense, savings: income - expense };
  });
}

export function expenseByCategory(txns: TxnLike[], monthKeys?: string[]) {
  const mapPaise = new Map<string, bigint>();
  txns
    .filter((t) => t.type === "expense" && (!monthKeys || monthKeys.includes(monthKey(t.txnDate))))
    .forEach((t) => mapPaise.set(t.category, (mapPaise.get(t.category) || 0n) + toPaise(t.amount)));
  return [...mapPaise.entries()]
    .map(([label, paise]) => ({ label, value: paiseToNumber(paise) }))
    .sort((a, b) => b.value - a.value);
}

// ─── Health score ──────────────────────────────────────────────

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
