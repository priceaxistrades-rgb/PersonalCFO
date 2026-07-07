/**
 * ═══════════════════════════════════════════════════════════════
 * FINANCIAL STRESS METER — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 */

import { sumMoneyToNumber } from "./finance-math";
import { num } from "./format";
import { currentMonthKey, sumByPaise } from "./data-utils";
import type {
  TransactionRow, AccountRow, InvestmentRow, DebtRow,
  BillRow, GoalRow,
} from "./types";

export type StressFactor = {
  id: string;
  label: string;
  icon: string;
  value: string;
  score: number; // 0-100 where 0=no stress, 100=extreme stress
  weight: number;
  tip: string;
};

export type StressReport = {
  overallScore: number; // 0-100
  level: "Low" | "Moderate" | "High" | "Critical";
  emoji: string;
  factors: StressFactor[];
  burnRate: number;
  cashRunway: number;
  monthlyRisk: number;
  recommendations: string[];
};

export function calculateStress(data: {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
}): StressReport {
  const { txns, accounts, investments, debts, bills, goals } = data;
  const cm = currentMonthKey();
  const factors: StressFactor[] = [];

  const liquidAssets = sumMoneyToNumber(accounts.map(a => a.balance));
  const thisMonthTxns = txns.filter(t => t.txnDate.startsWith(cm));
  const monthlyIncome = sumMoneyToNumber(thisMonthTxns.filter(t => t.type === "income").map(t => t.amount));
  const monthlyExpense = sumMoneyToNumber(thisMonthTxns.filter(t => t.type === "expense").map(t => t.amount));
  const monthlySavings = monthlyIncome - monthlyExpense;

  const totalDebt = sumMoneyToNumber(debts.map(d => d.outstanding));
  const totalEMI = sumMoneyToNumber(debts.map(d => d.emi));
  const investmentValue = sumMoneyToNumber(investments.map(i => i.currentValue));

  const emergencyGoal = goals.find(g => g.category === "Emergency");
  const emergencySaved = emergencyGoal ? num(emergencyGoal.saved) : 0;
  const emergencyMonths = monthlyExpense > 0 ? emergencySaved / monthlyExpense : 0;
  const cashRunway = monthlyExpense > 0 ? liquidAssets / monthlyExpense : 999;
  const burnRate = monthlySavings;
  const debtToIncome = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;

  // 1. BURN RATE (20% weight)
  const burnScore = monthlySavings <= 0 ? 100 : monthlySavings < monthlyIncome * 0.1 ? 70 : monthlySavings < monthlyIncome * 0.2 ? 40 : 10;
  factors.push({
    id: "burn-rate",
    label: "Burn Rate",
    icon: "🔥",
    value: monthlySavings >= 0 ? `Saving ₹${monthlySavings.toLocaleString("en-IN")}/mo` : `Losing ₹${Math.abs(monthlySavings).toLocaleString("en-IN")}/mo`,
    score: burnScore,
    weight: 20,
    tip: monthlySavings <= 0 ? "You're spending more than earning — cut expenses immediately" : "Maintain positive burn rate to build wealth",
  });

  // 2. DEBT PRESSURE (20% weight)
  const debtScore = debtToIncome > 50 ? 100 : debtToIncome > 35 ? 70 : debtToIncome > 20 ? 40 : totalDebt === 0 ? 0 : 10;
  factors.push({
    id: "debt-pressure",
    label: "Debt Pressure",
    icon: "🏦",
    value: `${debtToIncome.toFixed(0)}% of income`,
    score: debtScore,
    weight: 20,
    tip: debtToIncome > 35 ? "Reduce debt using avalanche method — pay highest interest first" : "Debt is manageable — keep paying on time",
  });

  // 3. EMERGENCY READINESS (20% weight)
  const emergScore = emergencyMonths >= 12 ? 0 : emergencyMonths >= 6 ? 20 : emergencyMonths >= 3 ? 50 : emergencyMonths >= 1 ? 80 : 100;
  factors.push({
    id: "emergency-readiness",
    label: "Emergency Readiness",
    icon: "🛟",
    value: `${emergencyMonths.toFixed(1)} months`,
    score: emergScore,
    weight: 20,
    tip: emergencyMonths < 6 ? "Build emergency fund to 6 months as top priority" : "Good coverage — aim for 12 months",
  });

  // 4. SALARY DEPENDENCY (15% weight)
  const passiveIncome = investmentValue * 0.08 / 12; // 8% annual return
  const salaryDepPct = monthlyIncome > 0 ? ((monthlyIncome - passiveIncome) / monthlyIncome) * 100 : 100;
  const salaryScore = salaryDepPct > 90 ? 80 : salaryDepPct > 70 ? 50 : salaryDepPct > 50 ? 30 : 10;
  factors.push({
    id: "salary-dependency",
    label: "Salary Dependency",
    icon: "💼",
    value: `${salaryDepPct.toFixed(0)}% from salary`,
    score: salaryScore,
    weight: 15,
    tip: salaryDepPct > 80 ? "You're highly dependent on salary — build passive income through investments" : "Good diversification of income sources",
  });

  // 5. CASH RUNWAY (15% weight)
  const runwayScore = cashRunway >= 12 ? 0 : cashRunway >= 6 ? 20 : cashRunway >= 3 ? 50 : cashRunway >= 1 ? 80 : 100;
  factors.push({
    id: "cash-runway",
    label: "Cash Runway",
    icon: "⏳",
    value: `${cashRunway.toFixed(1)} months`,
    score: runwayScore,
    weight: 15,
    tip: cashRunway < 6 ? "Your cash runway is dangerously short — build liquid reserves" : "Healthy runway — you can weather financial storms",
  });

  // 6. MONTHLY RISK (10% weight)
  const unpaidBills = bills.filter(b => !b.paid && new Date(b.dueDate) < new Date());
  const riskScore = monthlySavings < 0 ? 90 : unpaidBills.length > 2 ? 70 : unpaidBills.length > 0 ? 40 : 10;
  factors.push({
    id: "monthly-risk",
    label: "Monthly Risk",
    icon: "⚡",
    value: unpaidBills.length > 0 ? `${unpaidBills.length} overdue bills` : "No immediate risks",
    score: riskScore,
    weight: 10,
    tip: unpaidBills.length > 0 ? "Pay overdue bills immediately to avoid late fees" : "No immediate financial risks detected",
  });

  // Overall score
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const overallScore = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight);

  const level: StressReport["level"] = overallScore >= 70 ? "Critical" : overallScore >= 50 ? "High" : overallScore >= 25 ? "Moderate" : "Low";
  const emoji = overallScore >= 70 ? "🔴" : overallScore >= 50 ? "🟠" : overallScore >= 25 ? "🟡" : "🟢";

  // Recommendations
  const recommendations: string[] = [];
  if (emergencyMonths < 6) recommendations.push("Build emergency fund to 6 months as top priority");
  if (debtToIncome > 35) recommendations.push("Reduce debt-to-income ratio below 35% using avalanche method");
  if (monthlySavings < monthlyIncome * 0.1) recommendations.push("Increase savings rate to at least 10% of income");
  if (salaryDepPct > 80) recommendations.push("Start SIP in mutual funds to build passive income");
  if (cashRunway < 6) recommendations.push("Build liquid reserves to cover 6+ months of expenses");
  if (unpaidBills.length > 0) recommendations.push("Clear overdue bills immediately");
  if (recommendations.length === 0) recommendations.push("Your finances are in great shape! Keep it up.");

  return {
    overallScore,
    level,
    emoji,
    factors,
    burnRate,
    cashRunway,
    monthlyRisk: overallScore,
    recommendations,
  };
}
