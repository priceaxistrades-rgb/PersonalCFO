/**
 * ═══════════════════════════════════════════════════════════════
 * AI WEALTH COACH ENGINE — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 * Generates weekly financial reports with wins, mistakes,
 * analysis, and recommendations.
 * ═══════════════════════════════════════════════════════════════
 */

import { sumMoneyToNumber } from "./finance-math";
import { num } from "./format";
import { monthKey, currentMonthKey, sumByPaise, lastNMonths, monthlyFlow } from "./data-utils";
import type {
  TransactionRow, AccountRow, InvestmentRow, DebtRow,
  BillRow, GoalRow, BudgetRow,
} from "./types";

export type CoachSection = {
  title: string;
  icon: string;
  items: string[];
  tone: "success" | "warning" | "danger" | "primary" | "neutral";
};

export type WealthCoachReport = {
  period: string;
  overallTone: "success" | "warning" | "danger";
  sections: CoachSection[];
  weeklyGoal: string;
  nextWeekActions: string[];
};

export function generateWealthCoachReport(data: {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
  budgets: BudgetRow[];
}): WealthCoachReport {
  const { txns, accounts, investments, debts, bills, goals, budgets } = data;
  const cm = currentMonthKey();
  const months = lastNMonths(2);
  const flow = monthlyFlow(txns, months);

  const thisMonth = flow[flow.length - 1] || { income: 0, expense: 0, savings: 0 };
  const prevMonth = flow[flow.length - 2] || thisMonth;

  const liquidAssets = sumMoneyToNumber(accounts.map(a => a.balance));
  const investmentValue = sumMoneyToNumber(investments.map(i => i.currentValue));
  const investedAmount = sumMoneyToNumber(investments.map(i => i.invested));
  const totalDebt = sumMoneyToNumber(debts.map(d => d.outstanding));
  const totalEMI = sumMoneyToNumber(debts.map(d => d.emi));
  const netWorth = liquidAssets + investmentValue - totalDebt;

  const savingsRate = thisMonth.income > 0 ? (thisMonth.savings / thisMonth.income) * 100 : 0;
  const prevSavingsRate = prevMonth.income > 0 ? (prevMonth.savings / prevMonth.income) * 100 : 0;
  const investmentGrowth = investmentValue - investedAmount;
  const growthPct = investedAmount > 0 ? (investmentGrowth / investedAmount) * 100 : 0;
  const debtToIncome = thisMonth.income > 0 ? (totalEMI / thisMonth.income) * 100 : 0;

  const thisMonthTxns = txns.filter(t => t.txnDate.startsWith(cm));
  const emergencyGoal = goals.find(g => g.category === "Emergency");
  const emergencySaved = emergencyGoal ? num(emergencyGoal.saved) : 0;
  const emergencyMonths = thisMonth.expense > 0 ? emergencySaved / thisMonth.expense : 0;

  const sections: CoachSection[] = [];

  // 1. WINS
  const wins: string[] = [];
  if (thisMonth.savings > 0) wins.push(`Saved ₹${thisMonth.savings.toLocaleString("en-IN")} this month (${savingsRate.toFixed(0)}% rate)`);
  if (savingsRate > prevSavingsRate) wins.push(`Savings rate improved from ${prevSavingsRate.toFixed(0)}% to ${savingsRate.toFixed(0)}%`);
  if (thisMonth.expense < prevMonth.expense) wins.push(`Reduced spending by ₹${(prevMonth.expense - thisMonth.expense).toLocaleString("en-IN")}`);
  if (investmentGrowth > 0) wins.push(`Investments grew by ${growthPct.toFixed(1)}% (₹${investmentGrowth.toLocaleString("en-IN")})`);
  if (totalDebt === 0) wins.push("You're completely debt-free!");
  if (emergencyMonths >= 6) wins.push(`Emergency fund covers ${emergencyMonths.toFixed(1)} months — strong!`);
  const unpaidBills = bills.filter(b => !b.paid);
  if (unpaidBills.length === 0) wins.push("All bills are paid this period");
  if (wins.length === 0) wins.push("You're actively tracking your finances — that's a win!");
  sections.push({ title: "Wins", icon: "🏆", items: wins, tone: "success" });

  // 2. MISTAKES
  const mistakes: string[] = [];
  if (thisMonth.savings < 0) mistakes.push(`Overspent by ₹${Math.abs(thisMonth.savings).toLocaleString("en-IN")} this month`);
  if (savingsRate < 10 && thisMonth.income > 0) mistakes.push(`Savings rate is very low at ${savingsRate.toFixed(0)}%`);
  if (thisMonth.expense > prevMonth.expense * 1.2 && prevMonth.expense > 0) mistakes.push(`Spending increased by ${((thisMonth.expense / prevMonth.expense - 1) * 100).toFixed(0)}% compared to last month`);
  if (debtToIncome > 40) mistakes.push(`EMI burden at ${debtToIncome.toFixed(0)}% of income — too high`);
  if (emergencyMonths < 3) mistakes.push(`Emergency fund only covers ${emergencyMonths.toFixed(1)} months — dangerously low`);
  if (investmentGrowth < 0) mistakes.push(`Investments lost ${Math.abs(growthPct).toFixed(1)}% — consider rebalancing`);
  const overdue = bills.filter(b => !b.paid && new Date(b.dueDate) < new Date());
  if (overdue.length > 0) mistakes.push(`${overdue.length} overdue bill(s) — pay immediately to avoid penalties`);
  if (mistakes.length === 0) mistakes.push("No major mistakes this period — keep it up!");
  sections.push({ title: "Mistakes & Warnings", icon: "⚠️", items: mistakes, tone: mistakes.length > 2 ? "danger" : "warning" });

  // 3. SPENDING ANALYSIS
  const expCats = new Map<string, number>();
  thisMonthTxns.filter(t => t.type === "expense").forEach(t => expCats.set(t.category, (expCats.get(t.category) || 0) + num(t.amount)));
  const topCats = [...expCats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const spendingItems = topCats.map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString("en-IN")} (${thisMonth.expense > 0 ? ((amt / thisMonth.expense) * 100).toFixed(0) : 0}%)`);
  if (spendingItems.length === 0) spendingItems.push("No expense data for this period");
  sections.push({ title: "Spending Analysis", icon: "🧾", items: spendingItems, tone: "neutral" });

  // 4. SAVINGS ANALYSIS
  const savingsItems: string[] = [];
  savingsItems.push(`Monthly savings: ₹${thisMonth.savings.toLocaleString("en-IN")} (${savingsRate.toFixed(0)}% rate)`);
  savingsItems.push(`Target: 30%+ savings rate — you're ${savingsRate >= 30 ? "on track ✅" : "below target ❌"}`);
  savingsItems.push(`Emergency fund: ${emergencyMonths.toFixed(1)} months (target: 12)`);
  if (goals.length > 0) {
    const avgGoalPct = goals.reduce((s, g) => s + (num(g.target) > 0 ? (num(g.saved) / num(g.target)) * 100 : 0), 0) / goals.length;
    savingsItems.push(`Average goal progress: ${avgGoalPct.toFixed(0)}%`);
  }
  sections.push({ title: "Savings Analysis", icon: "💰", items: savingsItems, tone: savingsRate >= 20 ? "success" : "warning" });

  // 5. INVESTMENT ANALYSIS
  const investItems: string[] = [];
  investItems.push(`Portfolio value: ₹${investmentValue.toLocaleString("en-IN")}`);
  investItems.push(`Invested amount: ₹${investedAmount.toLocaleString("en-IN")}`);
  investItems.push(`Unrealized gains: ₹${investmentGrowth.toLocaleString("en-IN")} (${growthPct.toFixed(1)}%)`);
  const invTypes = new Set(investments.map(i => i.type));
  investItems.push(`Diversification: ${invTypes.size} asset classes across ${investments.length} investments`);
  if (investments.length === 0) investItems.push("⚠️ No investments — start SIP to build wealth");
  sections.push({ title: "Investment Analysis", icon: "📈", items: investItems, tone: growthPct >= 5 ? "success" : "primary" });

  // 6. NEXT WEEK'S GOALS
  const nextWeekActions: string[] = [];
  if (emergencyMonths < 6) nextWeekActions.push("Save ₹" + Math.round((thisMonth.expense * 6 - emergencySaved) / 12).toLocaleString("en-IN") + " toward emergency fund");
  if (debtToIncome > 30) nextWeekActions.push("Make an extra payment toward your highest-interest loan");
  if (savingsRate < 20) nextWeekActions.push("Cut ₹5,000 from discretionary spending this week");
  if (investments.length === 0) nextWeekActions.push("Start a SIP of at least ₹5,000 in an index fund");
  if (overdue.length > 0) nextWeekActions.push("Clear all overdue bills this week");
  if (nextWeekActions.length === 0) nextWeekActions.push("Review your investment portfolio for rebalancing opportunities");

  const overallTone = mistakes.length > 3 ? "danger" : mistakes.length > 1 ? "warning" : "success";
  const weeklyGoal = savingsRate >= 30
    ? "Maintain your excellent savings rate and invest the surplus"
    : savingsRate >= 20
    ? "Push savings rate to 30%+ by optimizing one spending category"
    : "Focus on building positive savings momentum this week";

  return {
    period: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    overallTone,
    sections,
    weeklyGoal,
    nextWeekActions,
  };
}
