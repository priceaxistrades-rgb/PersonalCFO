/**
 * ═══════════════════════════════════════════════════════════════
 * MISSION CONTROL ENGINE — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Aggregates all AI-powered features into a single premium
 * command center view.
 * ═══════════════════════════════════════════════════════════════
 */

import { sumMoneyToNumber } from "./finance-math";
import { num } from "./format";
import { monthlyFlow, lastNMonths } from "./data-utils";
import { computeHealthScore, type HealthScoreBreakdown } from "./health-score-engine";
import { calculateStress, type StressReport } from "./stress-meter";
import { scanOpportunities, type Opportunity } from "./opportunity-scanner";
import { generateMorningBrief, type MorningBrief } from "./morning-brief";
import { generateWealthTimeline, type WealthTimeline } from "./wealth-timeline";
import type {
  TransactionRow, AccountRow, InvestmentRow, DebtRow,
  BillRow, GoalRow, InsuranceRow, BudgetRow,
} from "./types";

// ─── Types ────────────────────────────────────────────────────

export type MissionControlData = {
  healthScore: HealthScoreBreakdown;
  stress: StressReport;
  brief: MorningBrief;
  timeline: WealthTimeline;
  opportunities: Opportunity[];

  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  savingsRate: number;

  totalDebt: number;
  totalEMI: number;
  debtToIncome: number;

  investmentValue: number;
  investedAmount: number;
  investmentGrowth: number;

  emergencyMonths: number;

  upcomingBills: { name: string; amount: number; dueDate: string; paid: boolean }[];
  goalProgress: { name: string; saved: number; target: number; pct: number }[];

  topRecommendations: string[];
};

// ─── Engine ───────────────────────────────────────────────────

export function generateMissionControl(data: {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
  insurance: InsuranceRow[];
  budgets: BudgetRow[];
}): MissionControlData {
  const { txns, accounts, investments, debts, bills, goals, insurance, budgets } = data;

  // ─── Core calculations ───
  const liquidAssets = sumMoneyToNumber(accounts.map(a => a.balance));
  const investmentValue = sumMoneyToNumber(investments.map(i => i.currentValue));
  const investedAmount = sumMoneyToNumber(investments.map(i => i.invested));
  const investmentGrowth = investmentValue - investedAmount;
  const totalDebt = sumMoneyToNumber(debts.map(d => d.outstanding));
  const totalEMI = sumMoneyToNumber(debts.map(d => d.emi));
  const netWorth = liquidAssets + investmentValue - totalDebt;

  const months = lastNMonths(3);
  const flow = monthlyFlow(txns, months);
  const avgIncome = flow.length > 0 ? flow.reduce((s, m) => s + m.income, 0) / flow.length : 0;
  const avgExpense = flow.length > 0 ? flow.reduce((s, m) => s + m.expense, 0) / flow.length : 0;
  const monthlySavings = avgIncome - avgExpense;
  const savingsRate = avgIncome > 0 ? (monthlySavings / avgIncome) * 100 : 0;
  const debtToIncome = avgIncome > 0 ? (totalEMI / avgIncome) * 100 : 0;
  const emergencyMonths = avgExpense > 0 ? liquidAssets / avgExpense : 0;

  // ─── Sub-engines ───
  const healthScore = computeHealthScore({ txns, accounts, investments, debts, bills, goals, insurance, budgets });
  const stress = calculateStress({ txns, accounts, investments, debts, bills, goals });
  const brief = generateMorningBrief({ txns, accounts, investments, debts, bills, goals, insurance, budgets });
  const timeline = generateWealthTimeline({ txns, accounts, investments, debts, goals });
  const opportunities = scanOpportunities({ txns, accounts, investments, debts, bills, goals, budgets });

  // ─── Upcoming bills ───
  const upcomingBills = bills
    .filter(b => !b.paid)
    .map(b => ({
      name: b.name,
      amount: num(b.amount),
      dueDate: b.dueDate,
      paid: b.paid,
    }))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // ─── Goal progress ───
  const goalProgress = goals.map(g => ({
    name: g.name,
    saved: num(g.saved),
    target: num(g.target),
    pct: num(g.target) > 0 ? Math.min(100, (num(g.saved) / num(g.target)) * 100) : 0,
  }));

  // ─── Top recommendations ───
  const recs: string[] = [];
  if (healthScore.overall < 50) recs.push("Focus on improving your Financial Health Score — it's below 50");
  if (stress.level === "High" || stress.level === "Critical") recs.push("Your financial stress is high — build emergency fund first");
  if (emergencyMonths < 3) recs.push(`Emergency fund covers only ${emergencyMonths.toFixed(1)} months — target 6+`);
  if (savingsRate < 20) recs.push(`Savings rate at ${savingsRate.toFixed(0)}% — aim for 30%+`);
  if (debtToIncome > 40) recs.push(`EMI burden at ${debtToIncome.toFixed(0)}% of income — reduce debt`);
  if (upcomingBills.length > 0) recs.push(`${upcomingBills.length} unpaid bill(s) due soon — pay on time`);
  if (opportunities.length > 0) recs.push(`${opportunities.length} money-saving opportunity(ies) found — check Opportunities`);
  if (brief.items.filter(i => i.tone === "danger").length > 0) recs.push(`${brief.items.filter(i => i.tone === "danger").length} critical alert(s) in your Morning Brief`);
  if (investmentGrowth < 0) recs.push("Investments showing losses — review your portfolio allocation");
  if (recs.length === 0) recs.push("You're on track! Keep building your financial future 🚀");

  return {
    healthScore,
    stress,
    brief,
    timeline,
    opportunities,

    netWorth,
    monthlyIncome: Math.round(avgIncome),
    monthlyExpense: Math.round(avgExpense),
    monthlySavings: Math.round(monthlySavings),
    savingsRate,

    totalDebt,
    totalEMI,
    debtToIncome,

    investmentValue,
    investedAmount,
    investmentGrowth,

    emergencyMonths,

    upcomingBills,
    goalProgress,

    topRecommendations: recs.slice(0, 5),
  };
}
