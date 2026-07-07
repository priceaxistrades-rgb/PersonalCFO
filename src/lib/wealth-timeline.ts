/**
 * ═══════════════════════════════════════════════════════════════
 * WEALTH TIMELINE ENGINE — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 * Automatically generates a future financial timeline
 * with milestones like Emergency Fund Complete, Debt Free,
 * ₹10L/50L/1Cr Net Worth, Financial Freedom, Retirement.
 * ═══════════════════════════════════════════════════════════════
 */

import { sumMoneyToNumber } from "./finance-math";
import { num } from "./format";
import { monthKey, currentMonthKey } from "./data-utils";
import type {
  TransactionRow, AccountRow, InvestmentRow, DebtRow,
  BillRow, GoalRow,
} from "./types";

export type TimelineMilestone = {
  id: string;
  title: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  progressPct: number;
  estimatedDate: string; // ISO date or "Achieved!"
  status: "achieved" | "on-track" | "at-risk" | "off-track";
  description: string;
};

export type WealthTimeline = {
  milestones: TimelineMilestone[];
  currentNetWorth: number;
  monthlyGrowthRate: number;
  projectedNetWorth1Yr: number;
  projectedNetWorth5Yr: number;
};

export function generateWealthTimeline(data: {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  goals: GoalRow[];
}): WealthTimeline {
  const { txns, accounts, investments, debts, goals } = data;
  const cm = currentMonthKey();

  // Core metrics
  const liquidAssets = sumMoneyToNumber(accounts.map(a => a.balance));
  const investmentValue = sumMoneyToNumber(investments.map(i => i.currentValue));
  const totalDebt = sumMoneyToNumber(debts.map(d => d.outstanding));
  const totalEMI = sumMoneyToNumber(debts.map(d => d.emi));
  const netWorth = liquidAssets + investmentValue - totalDebt;

  // Monthly savings (average over 6 months)
  const now = new Date();
  let totalSavings6m = 0;
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthTxns = txns.filter(t => t.txnDate.startsWith(mk));
    const inc = sumMoneyToNumber(monthTxns.filter(t => t.type === "income").map(t => t.amount));
    const exp = sumMoneyToNumber(monthTxns.filter(t => t.type === "expense").map(t => t.amount));
    totalSavings6m += inc - exp;
  }
  const avgMonthlySavings = totalSavings6m / 6;
  const monthlyGrowthRate = netWorth > 0 ? (avgMonthlySavings / netWorth) * 100 : 0;

  // Emergency fund
  const emergencyGoal = goals.find(g => g.category === "Emergency");
  const emergencySaved = emergencyGoal ? num(emergencyGoal.saved) : liquidAssets * 0.5;
  const monthlyExpense = sumMoneyToNumber(
    txns.filter(t => t.type === "expense" && t.txnDate.startsWith(cm)).map(t => t.amount)
  ) || 1;
  const emergencyTarget = monthlyExpense * 6;
  const emergencyMonthsLeft = avgMonthlySavings > 0
    ? Math.max(0, Math.ceil((emergencyTarget - emergencySaved) / avgMonthlySavings))
    : 999;

  // Debt freedom
  const monthsToDebtFreedom = (avgMonthlySavings > totalEMI && totalDebt > 0)
    ? Math.ceil(totalDebt / (avgMonthlySavings - totalEMI))
    : totalDebt === 0 ? 0 : 999;

  // Build milestones
  const milestones: TimelineMilestone[] = [];

  // 1. Emergency Fund Complete
  milestones.push(buildMilestone(
    "emergency", "🛟 Emergency Fund Complete", emergencyTarget, emergencySaved,
    emergencyMonthsLeft, avgMonthlySavings,
    "6 months of expenses saved for rainy day protection",
  ));

  // 2. Debt Free
  milestones.push(buildMilestone(
    "debt-free", "🎯 Debt Free", totalDebt, totalDebt - sumMoneyToNumber(debts.map(d => d.principal)) + sumMoneyToNumber(debts.map(d => d.outstanding)),
    monthsToDebtFreedom, avgMonthlySavings,
    totalDebt > 0 ? `₹${totalDebt.toLocaleString("en-IN")} outstanding across ${debts.length} loan(s)` : "You're already debt-free!",
  ));

  // 3. Net Worth milestones
  const nwMilestones = [
    { id: "nw-1l", title: "₹1 Lakh Net Worth", icon: "🌱", target: 100000 },
    { id: "nw-10l", title: "₹10 Lakh Net Worth", icon: "🌿", target: 1000000 },
    { id: "nw-25l", title: "₹25 Lakh Net Worth", icon: "🌳", target: 2500000 },
    { id: "nw-50l", title: "₹50 Lakh Net Worth", icon: "🏔️", target: 5000000 },
    { id: "nw-1cr", title: "₹1 Crore Net Worth", icon: "💎", target: 10000000 },
    { id: "nw-5cr", title: "₹5 Crore Net Worth", icon: "👑", target: 50000000 },
    { id: "nw-10cr", title: "₹10 Crore Net Worth", icon: "🏆", target: 100000000 },
  ];

  for (const nw of nwMilestones) {
    if (netWorth < nw.target * 2) { // Only show milestones within 2x of current
      const monthsLeft = avgMonthlySavings > 0
        ? Math.max(0, Math.ceil((nw.target - netWorth) / avgMonthlySavings))
        : 999;
      milestones.push(buildMilestone(
        nw.id, `${nw.icon} ${nw.title}`, nw.target, netWorth,
        monthsLeft, avgMonthlySavings,
        `Current net worth: ₹${(netWorth / 100000).toFixed(1)}L`,
      ));
    }
  }

  // 4. Financial Freedom (FIRE - 25x annual expenses)
  const annualExpenses = monthlyExpense * 12;
  const fireTarget = annualExpenses * 25;
  const monthsToFire = avgMonthlySavings > 0
    ? Math.max(0, Math.ceil((fireTarget - netWorth) / avgMonthlySavings))
    : 999;
  milestones.push(buildMilestone(
    "fire", "🏝️ Financial Freedom (FIRE)", fireTarget, netWorth,
    monthsToFire, avgMonthlySavings,
    `Passive income from investments will cover all expenses`,
  ));

  // 5. Retirement (65 years)
  milestones.push(buildMilestone(
    "retirement", "🏖️ Retirement Ready", fireTarget * 0.8, netWorth,
    monthsToFire > 0 ? Math.round(monthsToFire * 0.8) : 0, avgMonthlySavings,
    `80% FIRE target — comfortable retirement`,
  ));

  // Sort by progress (closest to achievement first, then by target)
  milestones.sort((a, b) => {
    if (a.status === "achieved" && b.status !== "achieved") return -1;
    if (b.status === "achieved" && a.status !== "achieved") return 1;
    return b.progressPct - a.progressPct;
  });

  // Projections
  const investmentReturn = investmentValue * 0.08 / 12; // 8% annual
  const monthlyTotalGrowth = avgMonthlySavings + investmentReturn;
  const projected1Yr = netWorth + monthlyTotalGrowth * 12;
  const projected5Yr = netWorth + monthlyTotalGrowth * 60 * (1 + 0.03 * 60 / 12); // simple compounding approx

  return {
    milestones,
    currentNetWorth: netWorth,
    monthlyGrowthRate,
    projectedNetWorth1Yr: Math.round(projected1Yr),
    projectedNetWorth5Yr: Math.round(projected5Yr),
  };
}

function buildMilestone(
  id: string, title: string, target: number, current: number,
  monthsLeft: number, monthlySavings: number, description: string,
): TimelineMilestone {
  const progressPct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const achieved = current >= target;

  let estimatedDate: string;
  if (achieved) {
    estimatedDate = "Achieved!";
  } else if (monthsLeft >= 999) {
    estimatedDate = "Needs income increase";
  } else if (monthsLeft <= 0) {
    estimatedDate = "This month!";
  } else {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsLeft);
    estimatedDate = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }

  const status: TimelineMilestone["status"] = achieved
    ? "achieved"
    : progressPct >= 75
    ? "on-track"
    : progressPct >= 40
    ? "at-risk"
    : "off-track";

  return {
    id,
    title,
    icon: title.split(" ")[0],
    targetAmount: target,
    currentAmount: current,
    progressPct,
    estimatedDate,
    status,
    description,
  };
}
