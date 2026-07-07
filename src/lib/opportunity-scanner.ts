/**
 * ═══════════════════════════════════════════════════════════════
 * OPPORTUNITY SCANNER ENGINE — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 * Continuously detects financial opportunities and risks.
 * ═══════════════════════════════════════════════════════════════
 */

import { sumMoneyToNumber } from "./finance-math";
import { num } from "./format";
import { monthKey, currentMonthKey, sumByPaise, lastNMonths } from "./data-utils";
import type {
  TransactionRow, AccountRow, InvestmentRow, DebtRow,
  BillRow, GoalRow, BudgetRow,
} from "./types";

export type Opportunity = {
  id: string;
  category: "unused-cash" | "overspending" | "subscriptions" | "tax-savings" | "investment" | "debt-optimize";
  icon: string;
  title: string;
  detail: string;
  potentialSaving: number; // monthly saving potential
  tone: "success" | "warning" | "danger" | "primary";
  action: string; // href
};

export function scanOpportunities(data: {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
  budgets: BudgetRow[];
}): Opportunity[] {
  const { txns, accounts, investments, debts, bills, goals, budgets } = data;
  const opportunities: Opportunity[] = [];
  const cm = currentMonthKey();
  const now = new Date();

  // Core metrics
  const liquidAssets = sumMoneyToNumber(accounts.map(a => a.balance));
  const investmentValue = sumMoneyToNumber(investments.map(i => i.currentValue));
  const totalAssets = liquidAssets + investmentValue;
  const thisMonthTxns = txns.filter(t => t.txnDate.startsWith(cm));
  const monthlyIncome = sumMoneyToNumber(thisMonthTxns.filter(t => t.type === "income").map(t => t.amount));
  const monthlyExpense = sumMoneyToNumber(thisMonthTxns.filter(t => t.type === "expense").map(t => t.amount));
  const investmentRate = totalAssets > 0 ? (investmentValue / totalAssets) * 100 : 0;

  // 1. UNUSED CASH — Too much sitting idle
  if (liquidAssets > monthlyExpense * 6 && investmentRate < 40) {
    const excessCash = liquidAssets - monthlyExpense * 6;
    const monthlyLost = Math.round(excessCash * 0.06 / 12); // 6% annual return
    opportunities.push({
      id: "unused-cash",
      category: "unused-cash",
      icon: "🪙",
      title: "Idle Cash Detected",
      detail: `₹${excessCash.toLocaleString("en-IN")} sitting in low-yield accounts. You're losing ~₹${monthlyLost.toLocaleString("en-IN")}/month to inflation.`,
      potentialSaving: monthlyLost,
      tone: "warning",
      action: "/investments",
    });
  }

  // 2. OVERSPENDING — Compare last 3 months
  const months3 = lastNMonths(3);
  const monthExpenses = months3.map(m => {
    const exp = sumByPaise(
      txns.filter(t => t.type === "expense" && monthKey(t.txnDate) === m.key),
      t => t.amount,
    );
    return exp;
  });
  if (monthExpenses.length >= 2) {
    const latest = monthExpenses[monthExpenses.length - 1];
    const prev = monthExpenses[monthExpenses.length - 2];
    if (latest > prev * 1.2 && prev > 0) {
      const increase = latest - prev;
      opportunities.push({
        id: "overspending",
        category: "overspending",
        icon: "🚨",
        title: "Spending Surge Detected",
        detail: `This month's expenses (₹${latest.toLocaleString("en-IN")}) are ${((increase / prev) * 100).toFixed(0)}% higher than last month.`,
        potentialSaving: Math.round(increase * 0.5),
        tone: "danger",
        action: "/expenses",
      });
    }
  }

  // 3. SUBSCRIPTIONS — Recurring small expenses
  const subCategories = ["Subscriptions", "Entertainment", "Shopping", "Gym / Fitness"];
  const subSpend = thisMonthTxns
    .filter(t => t.type === "expense" && subCategories.includes(t.category))
    .reduce((s, t) => s + num(t.amount), 0);
  if (subSpend > monthlyIncome * 0.1 && monthlyIncome > 0) {
    opportunities.push({
      id: "subscriptions",
      category: "subscriptions",
      icon: "📺",
      title: "High Subscription Spend",
      detail: `₹${subSpend.toLocaleString("en-IN")} spent on subscriptions/entertainment this month (${((subSpend / monthlyIncome) * 100).toFixed(0)}% of income). Review and cancel unused ones.`,
      potentialSaving: Math.round(subSpend * 0.3),
      tone: "warning",
      action: "/expenses",
    });
  }

  // 4. TAX SAVINGS
  const annualIncome = monthlyIncome * 12;
  if (annualIncome > 500000) {
    const current80c = sumMoneyToNumber(investments.filter(i => i.type === "PPF" || i.type === "EPF" || i.type === "NPS").map(i => i.invested));
    const max80c = 150000;
    const remaining = Math.max(0, max80c - current80c);
    if (remaining > 0) {
      const taxSaved = Math.round(remaining * 0.3); // ~30% tax bracket
      opportunities.push({
        id: "tax-savings",
        category: "tax-savings",
        icon: "🧮",
        title: "Tax Savings Opportunity",
        detail: `₹${remaining.toLocaleString("en-IN")} of Section 80C limit unused. Invest in PPF/ELSS to save ~₹${taxSaved.toLocaleString("en-IN")} in tax.`,
        potentialSaving: Math.round(taxSaved / 12),
        tone: "primary",
        action: "/tax",
      });
    }
  }

  // 5. INVESTMENT OPPORTUNITIES
  if (investmentRate < 30 && liquidAssets > monthlyExpense * 3) {
    const investable = liquidAssets - monthlyExpense * 3;
    opportunities.push({
      id: "invest-opp",
      category: "investment",
      icon: "📈",
      title: "Investment Opportunity",
      detail: `Only ${investmentRate.toFixed(0)}% of assets are invested. Move ₹${investable.toLocaleString("en-IN")} to SIP/mutual funds for 10-12% returns.`,
      potentialSaving: Math.round(investable * 0.01 / 12), // 12% annual / 12
      tone: "primary",
      action: "/investments",
    });
  }

  // Under-diversified
  const investmentTypes = new Set(investments.map(i => i.type));
  if (investments.length > 0 && investmentTypes.size < 3) {
    opportunities.push({
      id: "diversify",
      category: "investment",
      icon: "🔄",
      title: "Portfolio Not Diversified",
      detail: `Only ${investmentTypes.size} asset class(es). Diversify across equity, debt, and gold to reduce risk.`,
      potentialSaving: 0,
      tone: "warning",
      action: "/investments",
    });
  }

  // 6. DEBT OPTIMIZATION
  if (debts.length > 0) {
    const highInterestDebts = debts.filter(d => num(d.interestRate) > 10);
    if (highInterestDebts.length > 0) {
      const totalHighInterest = sumMoneyToNumber(highInterestDebts.map(d => d.outstanding));
      const monthlyInterest = Math.round(totalHighInterest * 0.12 / 12); // rough
      opportunities.push({
        id: "debt-optimize",
        category: "debt-optimize",
        icon: "🏦",
        title: "Expensive Debt Found",
        detail: `${highInterestDebts.length} loan(s) above 10% interest. Consider balance transfer or prepayment to save ₹${monthlyInterest.toLocaleString("en-IN")}/month.`,
        potentialSaving: monthlyInterest,
        tone: "danger",
        action: "/debt",
      });
    }

    // Suggest prepayment if savings > EMI
    const totalEMI = sumMoneyToNumber(debts.map(d => d.emi));
    const monthlySavings = monthlyIncome - monthlyExpense;
    if (monthlySavings > totalEMI * 1.5 && totalEMI > 0) {
      opportunities.push({
        id: "prepay-debt",
        category: "debt-optimize",
        icon: "💳",
        title: "Prepay Debt Faster",
        detail: `You can afford to prepay loans. Direct extra ₹${Math.round(monthlySavings - totalEMI).toLocaleString("en-IN")}/month to clear debt faster.`,
        potentialSaving: Math.round(sumMoneyToNumber(debts.map(d => d.outstanding)) * 0.05 / 12),
        tone: "primary",
        action: "/debt",
      });
    }
  }

  return opportunities;
}
