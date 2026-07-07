/**
 * ═══════════════════════════════════════════════════════════════
 * AI MORNING CFO BRIEF ENGINE — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Generates a personalized financial briefing every login.
 * Includes: cash position, bills due, spending alerts,
 * investment reminders, savings opportunities, financial risks,
 * and recommended actions.
 *
 * Pure deterministic analysis — no external AI API needed.
 * ═══════════════════════════════════════════════════════════════
 */

import { sumMoneyToNumber } from "./finance-math";
import { num } from "./format";
import { monthKey, currentMonthKey, sumByPaise, lastNMonths, monthlyFlow } from "./data-utils";
import type {
  TransactionRow, AccountRow, InvestmentRow, DebtRow,
  BillRow, GoalRow, InsuranceRow, BudgetRow,
} from "./types";

// ─── Types ────────────────────────────────────────────────────

export type BriefItem = {
  id: string;
  category: "cash" | "bills" | "spending" | "investment" | "savings" | "risk" | "action";
  icon: string;
  title: string;
  detail: string;
  tone: "success" | "warning" | "danger" | "primary" | "neutral";
  action?: string; // href to navigate to
};

export type MorningBrief = {
  date: string;
  greeting: string;
  cashPosition: number;
  items: BriefItem[];
  summary: string;
  topAction: string;
};

// ─── Engine ───────────────────────────────────────────────────

export function generateMorningBrief(data: {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
  insurance: InsuranceRow[];
  budgets: BudgetRow[];
  userName?: string;
}): MorningBrief {
  const { txns, accounts, investments, debts, bills, goals, insurance, budgets, userName } = data;
  const items: BriefItem[] = [];
  const now = new Date();
  const cm = currentMonthKey();

  // Cash position
  const liquidAssets = sumMoneyToNumber(accounts.map(a => a.balance));
  const cashInHand = sumMoneyToNumber(accounts.filter(a => a.type === "Cash").map(a => a.balance));
  const bankBalance = sumMoneyToNumber(accounts.filter(a => a.type === "Bank").map(a => a.balance));

  // Monthly flow
  const thisMonthTxns = txns.filter(t => t.txnDate.startsWith(cm));
  const monthlyIncome = sumMoneyToNumber(thisMonthTxns.filter(t => t.type === "income").map(t => t.amount));
  const monthlyExpense = sumMoneyToNumber(thisMonthTxns.filter(t => t.type === "expense").map(t => t.amount));
  const monthlySavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  // 1. CASH POSITION
  items.push({
    id: "cash-position",
    category: "cash",
    icon: "💵",
    title: "Cash Position",
    detail: `Liquid: ₹${liquidAssets.toLocaleString("en-IN")} (Bank: ₹${bankBalance.toLocaleString("en-IN")}, Cash: ₹${cashInHand.toLocaleString("en-IN")})`,
    tone: liquidAssets > monthlyExpense * 3 ? "success" : liquidAssets > monthlyExpense ? "warning" : "danger",
    action: "/networth",
  });

  // 2. BILLS DUE
  const unpaidBills = bills.filter(b => !b.paid);
  const overdueBills = unpaidBills.filter(b => new Date(b.dueDate) < now);
  const upcomingBills = unpaidBills
    .filter(b => new Date(b.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  if (overdueBills.length > 0) {
    const overdueTotal = sumMoneyToNumber(overdueBills.map(b => b.amount));
    items.push({
      id: "bills-overdue",
      category: "bills",
      icon: "🚨",
      title: `${overdueBills.length} Overdue Bill${overdueBills.length > 1 ? "s" : ""}`,
      detail: `Total overdue: ₹${overdueTotal.toLocaleString("en-IN")}. ${overdueBills.map(b => b.name).join(", ")}`,
      tone: "danger",
      action: "/bills",
    });
  } else if (upcomingBills.length > 0) {
    const nextBill = upcomingBills[0];
    const daysLeft = Math.ceil((new Date(nextBill.dueDate).getTime() - now.getTime()) / 86400000);
    items.push({
      id: "bills-upcoming",
      category: "bills",
      icon: "🔔",
      title: `${upcomingBills.length} Bill${upcomingBills.length > 1 ? "s" : ""} Due`,
      detail: `Next: ${nextBill.name} — ₹${num(nextBill.amount).toLocaleString("en-IN")} in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      tone: daysLeft <= 3 ? "warning" : "neutral",
      action: "/bills",
    });
  } else {
    items.push({
      id: "bills-clear",
      category: "bills",
      icon: "✅",
      title: "All Bills Paid",
      detail: "No outstanding bills this period",
      tone: "success",
    });
  }

  // 3. SPENDING ALERTS
  const isOverspending = monthlyExpense > monthlyIncome && monthlyIncome > 0;
  if (isOverspending) {
    items.push({
      id: "spending-alert",
      category: "spending",
      icon: "🚨",
      title: "Overspending Alert",
      detail: `Expenses (₹${monthlyExpense.toLocaleString("en-IN")}) exceed income (₹${monthlyIncome.toLocaleString("en-IN")}) by ₹${Math.abs(monthlySavings).toLocaleString("en-IN")}`,
      tone: "danger",
      action: "/budget",
    });
  } else if (savingsRate < 20 && monthlyIncome > 0) {
    items.push({
      id: "spending-low-savings",
      category: "spending",
      icon: "⚠️",
      title: "Low Savings Rate",
      detail: `Saving only ${savingsRate.toFixed(0)}% of income — target 20%+`,
      tone: "warning",
      action: "/budget",
    });
  }

  // Budget check
  const budgetCategories = new Map(budgets.map(b => [b.category, num(b.monthlyLimit)]));
  const categorySpend = new Map<string, number>();
  thisMonthTxns.filter(t => t.type === "expense").forEach(t => {
    categorySpend.set(t.category, (categorySpend.get(t.category) || 0) + num(t.amount));
  });
  const overBudgetCats: string[] = [];
  budgetCategories.forEach((limit, cat) => {
    const spent = categorySpend.get(cat) || 0;
    if (spent > limit) overBudgetCats.push(cat);
  });
  if (overBudgetCats.length > 0) {
    items.push({
      id: "budget-over",
      category: "spending",
      icon: "📊",
      title: `${overBudgetCats.length} Categor${overBudgetCats.length > 1 ? "ies" : "y"} Over Budget`,
      detail: overBudgetCats.join(", "),
      tone: "warning",
      action: "/budget",
    });
  }

  // 4. INVESTMENT REMINDERS
  const investmentValue = sumMoneyToNumber(investments.map(i => i.currentValue));
  const investedAmount = sumMoneyToNumber(investments.map(i => i.invested));
  const investmentGrowth = investmentValue - investedAmount;
  const growthPct = investedAmount > 0 ? (investmentGrowth / investedAmount) * 100 : 0;
  const investmentRate = (liquidAssets + investmentValue) > 0 ? (investmentValue / (liquidAssets + investmentValue)) * 100 : 0;

  if (investments.length === 0) {
    items.push({
      id: "invest-reminder",
      category: "investment",
      icon: "📈",
      title: "Start Investing",
      detail: "You have no investments. Inflation is eroding ₹" + Math.round(liquidAssets * 0.06 / 12).toLocaleString("en-IN") + "/month in purchasing power",
      tone: "warning",
      action: "/investments",
    });
  } else if (growthPct < 0) {
    items.push({
      id: "invest-declining",
      category: "investment",
      icon: "📉",
      title: "Portfolio Declining",
      detail: `Investments down ${Math.abs(growthPct).toFixed(1)}% — review allocation`,
      tone: "danger",
      action: "/investments",
    });
  } else if (growthPct > 10) {
    items.push({
      id: "invest-growing",
      category: "investment",
      icon: "📈",
      title: "Portfolio Growing",
      detail: `Investments up ${growthPct.toFixed(1)}% — keep it up!`,
      tone: "success",
      action: "/investments",
    });
  }

  // 5. SAVINGS OPPORTUNITIES
  if (monthlyExpense > 0) {
    const potentialSavings = Math.round(monthlyExpense * 0.15);
    items.push({
      id: "savings-opp",
      category: "savings",
      icon: "💡",
      title: "Savings Opportunity",
      detail: `You could save ~₹${potentialSavings.toLocaleString("en-IN")}/month by optimizing discretionary spending`,
      tone: "primary",
      action: "/expenses",
    });
  }

  // Emergency fund check
  const emergencyGoal = goals.find(g => g.category === "Emergency");
  const emergencySaved = emergencyGoal ? num(emergencyGoal.saved) : 0;
  const emergencyMonths = monthlyExpense > 0 ? emergencySaved / monthlyExpense : 0;
  if (emergencyMonths < 6) {
    items.push({
      id: "emergency-low",
      category: "savings",
      icon: "🛟",
      title: "Emergency Fund Low",
      detail: `Only ${emergencyMonths.toFixed(1)} months covered — target 6-12 months`,
      tone: emergencyMonths < 3 ? "danger" : "warning",
      action: "/savings",
    });
  }

  // 6. FINANCIAL RISKS
  const totalDebt = sumMoneyToNumber(debts.map(d => d.outstanding));
  const totalEMI = sumMoneyToNumber(debts.map(d => d.emi));
  const debtToIncome = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;
  const cashRunway = monthlyExpense > 0 ? liquidAssets / monthlyExpense : 999;

  if (debtToIncome > 50) {
    items.push({
      id: "risk-debt",
      category: "risk",
      icon: "🏦",
      title: "High Debt Risk",
      detail: `EMI burden is ${debtToIncome.toFixed(0)}% of income — critical level`,
      tone: "danger",
      action: "/debt",
    });
  } else if (debtToIncome > 35) {
    items.push({
      id: "risk-debt-warn",
      category: "risk",
      icon: "🏦",
      title: "Elevated Debt Burden",
      detail: `EMI burden is ${debtToIncome.toFixed(0)}% of income — watch closely`,
      tone: "warning",
      action: "/debt",
    });
  }

  if (cashRunway < 3) {
    items.push({
      id: "risk-cashrunway",
      category: "risk",
      icon: "⏳",
      title: "Short Cash Runway",
      detail: `Only ${cashRunway.toFixed(1)} months of expenses covered by liquid assets`,
      tone: "danger",
      action: "/networth",
    });
  }

  // Insurance gap
  const hasHealth = insurance.some(i => i.type === "Health");
  if (!hasHealth && monthlyIncome > 0) {
    items.push({
      id: "risk-insurance",
      category: "risk",
      icon: "🛡️",
      title: "No Health Insurance",
      detail: "Medical emergencies can wipe out savings — get covered today",
      tone: "danger",
      action: "/insurance",
    });
  }

  // 7. RECOMMENDED ACTIONS (always include one)
  const goalProgress = goals.map(g => num(g.target) > 0 ? (num(g.saved) / num(g.target)) * 100 : 0);
  const avgGoalProgress = goalProgress.length > 0 ? goalProgress.reduce((s, p) => s + p, 0) / goalProgress.length : 0;

  if (goals.length > 0 && avgGoalProgress < 50) {
    items.push({
      id: "action-goals",
      category: "action",
      icon: "🎯",
      title: "Boost Goal Progress",
      detail: `Average goal progress: ${avgGoalProgress.toFixed(0)}%. Add ₹${Math.round(monthlySavings * 0.2).toLocaleString("en-IN")}/month to accelerate`,
      tone: "primary",
      action: "/savings",
    });
  }

  // Greeting
  const hour = now.getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greeting = `${timeGreeting}, ${userName || "CFO"}! Here's your financial briefing for today.`;

  // Summary
  const positiveItems = items.filter(i => i.tone === "success").length;
  const warningItems = items.filter(i => i.tone === "warning" || i.tone === "danger").length;
  let summary: string;
  if (warningItems === 0) {
    summary = `Everything looks good! No urgent financial concerns today. Keep up the great work.`;
  } else if (warningItems <= 2) {
    summary = `Mostly on track with ${warningItems} item${warningItems > 1 ? "s" : ""} needing attention. Review the alerts above.`;
  } else {
    summary = `${warningItems} items need your attention today. Focus on the critical ones first.`;
  }

  // Top action
  const criticalItem = items.find(i => i.tone === "danger");
  const topAction = criticalItem
    ? `🚨 ${criticalItem.title} — ${criticalItem.detail}`
    : "Review your financial briefing and stay on track!";

  return {
    date: now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    greeting,
    cashPosition: liquidAssets,
    items,
    summary,
    topAction,
  };
}
