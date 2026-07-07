/**
 * ═══════════════════════════════════════════════════════════════
 * AI FINANCIAL TWIN — Rule-Based Financial Intelligence Engine
 * ═══════════════════════════════════════════════════════════════
 *
 * Creates a digital financial profile that understands the user's
 * complete financial picture and can answer questions like:
 *   - Can I afford this?
 *   - Should I buy this?
 *   - What happens if I lose my job?
 *   - Can I retire early?
 *
 * Uses BigInt precision math for all monetary calculations.
 * No external AI API required — pure deterministic analysis.
 * ═══════════════════════════════════════════════════════════════
 */

import {
  toPaise,
  fromPaise,
  paiseToNumber,
  sumMoneyToNumber,
  applyPercent,
  applyPercentToNumber,
  subtractMoney,
  addMoney,
  compareMoney,
  isPositiveMoney,
  isZeroMoney,
} from "./finance-math";
import { num } from "./format";
import { healthScore } from "./data-utils";
import type {
  TransactionRow,
  AccountRow,
  InvestmentRow,
  DebtRow,
  BillRow,
  GoalRow,
  InsuranceRow,
} from "./types";

// ─── Financial Profile Types ──────────────────────────────────

export type TwinProfile = {
  // Core metrics
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  liquidAssets: number;
  investmentValue: number;

  // Monthly flow
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  savingsRate: number;

  // Debt
  totalDebt: number;
  totalEMI: number;
  debtToIncomeRatio: number;

  // Emergency
  emergencySaved: number;
  emergencyMonths: number;

  // Investments
  investmentRate: number;
  investmentGrowth: number;

  // Health
  healthScore: number;

  // Derived
  cashRunway: number; // months of expenses covered by liquid assets
  burnRate: number; // monthly net burn (negative if saving)
  financialFreedomRatio: number; // passive income / expenses
};

export type TwinQuery = {
  question: string;
  amount?: number; // optional purchase amount
  months?: number; // optional time period
};

export type TwinResponse = {
  answer: string;
  confidence: "high" | "medium" | "low";
  category: string;
  icon: string;
  metrics?: Record<string, string>;
  actions?: string[];
  warnings?: string[];
};

export type TwinScenario = {
  name: string;
  description: string;
  impact: {
    netWorthChange: number;
    monthlyChange: number;
    emergencyMonthsChange: number;
    savingsRateChange: number;
  };
  risk: "low" | "medium" | "high";
  recommendation: string;
  category?: string;
  answer?: string;
  confidence?: "high" | "medium" | "low";
  icon?: string;
};

// ─── Profile Builder ──────────────────────────────────────────

export function buildTwinProfile(data: {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
  insurance: InsuranceRow[];
}): TwinProfile {
  const { txns, accounts, investments, debts, bills, goals, insurance } = data;

  // Current month data
  const now = new Date();
  const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthTxns = txns.filter(t => t.txnDate.startsWith(cm));
  const monthlyIncome = sumMoneyToNumber(thisMonthTxns.filter(t => t.type === "income").map(t => t.amount));
  const monthlyExpense = sumMoneyToNumber(thisMonthTxns.filter(t => t.type === "expense").map(t => t.amount));
  const monthlySavings = monthlyIncome - monthlyExpense;

  // Assets
  const liquidAssets = sumMoneyToNumber(accounts.map(a => a.balance));
  const investmentValue = sumMoneyToNumber(investments.map(i => i.currentValue));
  const investedAmount = sumMoneyToNumber(investments.map(i => i.invested));
  const totalAssets = liquidAssets + investmentValue;

  // Liabilities
  const totalDebt = sumMoneyToNumber(debts.map(d => d.outstanding));
  const totalEMI = sumMoneyToNumber(debts.map(d => d.emi));

  // Net worth
  const netWorth = totalAssets - totalDebt;

  // Ratios
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  const debtToIncomeRatio = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;
  const investmentRate = totalAssets > 0 ? (investmentValue / totalAssets) * 100 : 0;
  const investmentGrowth = investmentValue - investedAmount;

  // Emergency
  const emergencyGoal = goals.find(g => g.category === "Emergency");
  const emergencySaved = emergencyGoal ? num(emergencyGoal.saved) : 0;
  const emergencyMonths = monthlyExpense > 0 ? emergencySaved / monthlyExpense : 0;

  // Cash runway: how many months can you survive on liquid assets alone
  const cashRunway = monthlyExpense > 0 ? liquidAssets / monthlyExpense : 999;

  // Burn rate
  const burnRate = monthlySavings;

  // Financial freedom ratio: investment returns / monthly expenses
  // Assume 8% annual return on investments (conservative equity return)
  const monthlyInvestmentReturn = investmentValue * (0.08 / 12);
  const financialFreedomRatio = monthlyExpense > 0 ? monthlyInvestmentReturn / monthlyExpense : 0;

  // Health score
  const hs = healthScore({
    savingsRate,
    emergencyMonths,
    debtToIncome: debtToIncomeRatio,
    investmentRate,
  });

  return {
    netWorth,
    totalAssets,
    totalLiabilities: totalDebt,
    liquidAssets,
    investmentValue,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    savingsRate,
    totalDebt,
    totalEMI,
    debtToIncomeRatio,
    emergencySaved,
    emergencyMonths,
    investmentRate,
    investmentGrowth,
    healthScore: hs,
    cashRunway,
    burnRate,
    financialFreedomRatio,
  };
}

// ─── Question Analyzer ────────────────────────────────────────

type QuestionPattern = {
  patterns: RegExp[];
  category: string;
  icon: string;
  handler: (profile: TwinProfile, query: TwinQuery) => TwinResponse;
};

const PATTERNS: QuestionPattern[] = [
  {
    patterns: [/can i afford/i, /afford.*(?:this|that|it)/i, /buy.*without.*worry/i],
    category: "Affordability",
    icon: "🛒",
    handler: handleAffordability,
  },
  {
    patterns: [/should i buy/i, /is it worth/i, /worth.*buying/i, /recommend.*buy/i],
    category: "Purchase Decision",
    icon: "🤔",
    handler: handlePurchaseDecision,
  },
  {
    patterns: [/lose.*job/i, /job.*loss/i, /unemploy/i, /laid off/i, /fired/i],
    category: "Job Loss",
    icon: "⚠️",
    handler: handleJobLoss,
  },
  {
    patterns: [/buy.*house/i, /house.*purchase/i, /home loan/i, /mortgage/i, /property/i],
    category: "House Purchase",
    icon: "🏠",
    handler: handleHousePurchase,
  },
  {
    patterns: [/retire.*early/i, /early.*retire/i, /fire/i, /financial.*freedom/i, /financial.*independent/i],
    category: "Early Retirement",
    icon: "🏝️",
    handler: handleEarlyRetirement,
  },
  {
    patterns: [/retire/i, /retirement/i, /pension/i],
    category: "Retirement",
    icon: "🏖️",
    handler: handleRetirement,
  },
  {
    patterns: [/save.*more/i, /save.*better/i, /how.*save/i, /saving.*tip/i],
    category: "Savings",
    icon: "💰",
    handler: handleSavingsAdvice,
  },
  {
    patterns: [/invest.*more/i, /invest.*better/i, /how.*invest/i, /investment.*advice/i],
    category: "Investment",
    icon: "📈",
    handler: handleInvestmentAdvice,
  },
  {
    patterns: [/debt.*free/i, /clear.*debt/i, /pay.*off/i, /repay/i],
    category: "Debt Freedom",
    icon: "🎯",
    handler: handleDebtFreedom,
  },
  {
    patterns: [/emergency/i, /rainy.*day/i, /safety.*net/i],
    category: "Emergency Fund",
    icon: "🛟",
    handler: handleEmergencyFund,
  },
  {
    patterns: [/insurance/i, /cover/i, /protect/i, /risk.*cover/i],
    category: "Insurance",
    icon: "🛡️",
    handler: handleInsurance,
  },
  {
    patterns: [/tax/i, /save.*tax/i, /tax.*plan/i, /80[cC]/i, /deduction/i],
    category: "Tax Planning",
    icon: "🧮",
    handler: handleTaxPlanning,
  },
  {
    patterns: [/goal/i, /target/i, /dream/i, /plan.*for/i],
    category: "Goal Planning",
    icon: "🎯",
    handler: handleGoalPlanning,
  },
  {
    patterns: [/net.*worth/i, /wealth/i, /asset/i],
    category: "Net Worth",
    icon: "💎",
    handler: handleNetWorth,
  },
  {
    patterns: [/cash.*flow/i, /income.*expense/i, /budget/i, /spending/i],
    category: "Cash Flow",
    icon: "💸",
    handler: handleCashFlow,
  },
  {
    patterns: [/health.*score/i, /financial.*health/i, /how.*healthy/i, /score.*improve/i],
    category: "Health Score",
    icon: "❤️",
    handler: handleHealthScoreQuery,
  },
  {
    patterns: [/stress/i, /worried/i, /anxious/i, /risk/i, /secure/i, /safe/i],
    category: "Financial Stress",
    icon: "😰",
    handler: handleStress,
  },
];

function matchQuestion(question: string): QuestionPattern | null {
  for (const p of PATTERNS) {
    for (const regex of p.patterns) {
      if (regex.test(question)) return p;
    }
  }
  return null;
}

// ─── Query Handler ────────────────────────────────────────────

export function answerTwinQuery(profile: TwinProfile, query: TwinQuery): TwinResponse {
  const q = query.question.toLowerCase().trim();

  // Try to match a specific pattern
  const matched = matchQuestion(q);
  if (matched) {
    return matched.handler(profile, query);
  }

  // Default: provide general financial summary with insights
  return handleGeneralQuery(profile, query);
}

// ─── Individual Handlers ──────────────────────────────────────

function handleAffordability(profile: TwinProfile, query: TwinQuery): TwinResponse {
  const amount = query.amount || 0;
  if (amount <= 0) {
    return {
      answer: "Please specify an amount to check affordability. For example: 'Can I afford a ₹50,000 purchase?'",
      confidence: "low",
      category: "Affordability",
      icon: "🛒",
      actions: ["Specify the purchase amount for an accurate analysis"],
    };
  }

  const pctOfSavings = profile.monthlySavings > 0 ? (amount / profile.monthlySavings) * 100 : 999;
  const pctOfEmergency = profile.emergencySaved > 0 ? (amount / profile.emergencySaved) * 100 : 999;
  const pctOfMonthlyIncome = profile.monthlyIncome > 0 ? (amount / profile.monthlyIncome) * 100 : 999;
  const canAffordFromSavings = profile.monthlySavings >= amount;
  const canAffordFromLiquid = profile.liquidAssets >= amount;
  const wouldDrainEmergency = amount > profile.emergencySaved * 0.5;

  let answer: string;
  let confidence: "high" | "medium" | "low";
  const warnings: string[] = [];
  const actions: string[] = [];

  if (pctOfMonthlyIncome <= 30 && canAffordFromSavings) {
    answer = `✅ Yes, you can comfortably afford this! The amount is ${pctOfMonthlyIncome.toFixed(0)}% of your monthly income, which is within the safe spending zone. Your monthly savings of ₹${profile.monthlySavings.toLocaleString("en-IN")} can cover this without stress.`;
    confidence = "high";
  } else if (pctOfMonthlyIncome <= 50 && canAffordFromLiquid) {
    answer = `⚠️ You can afford this, but it's a stretch. The amount is ${pctOfMonthlyIncome.toFixed(0)}% of your monthly income. You'd need to use ${pctOfSavings.toFixed(0)}% of your monthly savings to cover it.`;
    confidence = "medium";
    warnings.push(`This uses ${pctOfSavings.toFixed(0)}% of your monthly savings`);
    actions.push("Consider waiting 1-2 months to save specifically for this");
    actions.push("Look for EMI options if it's a necessary purchase");
  } else if (canAffordFromLiquid) {
    answer = `🚨 Technically you have the money, but this purchase is ${pctOfMonthlyIncome.toFixed(0)}% of your monthly income — that's a significant expense! You'd be draining your liquid assets.`;
    confidence = "medium";
    warnings.push(`This is ${pctOfMonthlyIncome.toFixed(0)}% of your monthly income`);
    if (wouldDrainEmergency) warnings.push("This could drain more than half your emergency fund");
    actions.push("Wait at least 3 months and save specifically for this");
    actions.push("Consider if this is a need vs. want");
    actions.push("Look for cheaper alternatives");
  } else {
    answer = `❌ This purchase exceeds your current liquid assets. At ₹${amount.toLocaleString("en-IN")}, it's ${pctOfMonthlyIncome.toFixed(0)}% of your monthly income and you don't have enough readily available funds.`;
    confidence = "high";
    warnings.push("You don't have enough liquid assets to cover this");
    actions.push("Start a dedicated savings goal for this purchase");
    actions.push(`You'd need to save ₹${Math.ceil(amount / 6).toLocaleString("en-IN")}/month for 6 months`);
    actions.push("Consider whether a loan makes sense given your debt situation");
  }

  return {
    answer,
    confidence,
    category: "Affordability",
    icon: "🛒",
    metrics: {
      "Purchase amount": `₹${amount.toLocaleString("en-IN")}`,
      "% of monthly income": `${pctOfMonthlyIncome.toFixed(0)}%`,
      "% of monthly savings": `${pctOfSavings.toFixed(0)}%`,
      "Monthly savings": `₹${profile.monthlySavings.toLocaleString("en-IN")}`,
      "Liquid assets": `₹${profile.liquidAssets.toLocaleString("en-IN")}`,
    },
    actions,
    warnings,
  };
}

function handlePurchaseDecision(profile: TwinProfile, query: TwinQuery): TwinResponse {
  const amount = query.amount || 0;
  const affordability = handleAffordability(profile, query);

  let answer = affordability.answer;
  answer += `\n\n📊 **Your Financial Position:**\n• Net Worth: ₹${profile.netWorth.toLocaleString("en-IN")}\n• Savings Rate: ${profile.savingsRate.toFixed(0)}%\n• Emergency Cover: ${profile.emergencyMonths.toFixed(1)} months\n• Debt-to-Income: ${profile.debtToIncomeRatio.toFixed(0)}%`;

  if (profile.savingsRate < 20) {
    answer += `\n\n💡 With a savings rate of ${profile.savingsRate.toFixed(0)}% (below the 20% target), every purchase needs careful consideration. Focus on building your savings first.`;
  }

  return {
    ...affordability,
    answer,
    category: "Purchase Decision",
    icon: "🤔",
  };
}

function handleJobLoss(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  const runway = profile.cashRunway;
  const emiBurden = profile.monthlyIncome > 0 ? (profile.totalEMI / profile.monthlyIncome) * 100 : 0;
  const emergencyAfterEMI = profile.monthlyExpense > 0
    ? (profile.emergencySaved - profile.totalEMI * 6) / profile.monthlyExpense
    : 0;

  let severity: "low" | "medium" | "high";
  let answer: string;

  if (runway >= 12) {
    severity = "low";
    answer = `🟢 **Low Risk** — If you lose your job today, you can survive for **${runway.toFixed(1)} months** on your liquid assets alone. This is a strong position.`;
  } else if (runway >= 6) {
    severity = "medium";
    answer = `🟡 **Moderate Risk** — If you lose your job, your liquid assets would last **${runway.toFixed(1)} months**. You need at least 6 months, ideally 12.`;
  } else {
    severity = "high";
    answer = `🔴 **High Risk** — If you lose your job, your liquid assets would last only **${runway.toFixed(1)} months**. This is dangerously low. You need to build your emergency fund immediately.`;
  }

  answer += `\n\n📊 **Impact Analysis:**\n• Monthly expenses: ₹${profile.monthlyExpense.toLocaleString("en-IN")}\n• Liquid assets: ₹${profile.liquidAssets.toLocaleString("en-IN")}\n• Monthly EMI burden: ₹${profile.totalEMI.toLocaleString("en-IN")} (${emiBurden.toFixed(0)}% of income)\n• Emergency fund covers: ${profile.emergencyMonths.toFixed(1)} months\n• After EMI payments for 6 months: ${emergencyAfterEMI.toFixed(1)} months of expenses`;

  const actions = [
    runway < 12 ? "Build emergency fund to cover 12 months of expenses" : "Maintain your strong emergency fund",
    "Review and reduce non-essential subscriptions and expenses",
    "Ensure health insurance is active (not employer-dependent)",
  ];

  if (emiBurden > 40) {
    actions.push("Your EMI burden is high — prioritize prepaying loans to reduce fixed obligations");
  }

  return {
    answer,
    confidence: "high",
    category: "Job Loss",
    icon: "⚠️",
    metrics: {
      "Cash runway": `${runway.toFixed(1)} months`,
      "Emergency cover": `${profile.emergencyMonths.toFixed(1)} months`,
      "EMI burden": `${emiBurden.toFixed(0)}% of income`,
      "Risk level": severity.toUpperCase(),
    },
    actions,
    warnings: runway < 6 ? ["Your cash runway is critically low!"] : [],
  };
}

function handleHousePurchase(profile: TwinProfile, query: TwinQuery): TwinResponse {
  const amount = query.amount || 5000000; // Default 50L
  const downPayment = amount * 0.2; // 20% down payment
  const loanAmount = amount * 0.8;
  const assumedRate = 8.5; // Current home loan rate
  const tenure = 20; // years
  const monthlyEMI = (loanAmount * assumedRate / 1200 * Math.pow(1 + assumedRate / 1200, tenure * 12)) / (Math.pow(1 + assumedRate / 1200, tenure * 12) - 1);
  const newDebtToIncome = profile.monthlyIncome > 0 ? ((profile.totalEMI + monthlyEMI) / profile.monthlyIncome) * 100 : 999;

  let answer = `🏠 **House Purchase Analysis (₹${(amount / 100000).toFixed(0)}L)**\n\n`;
  answer += `• Down payment (20%): ₹${(downPayment / 100000).toFixed(1)}L\n`;
  answer += `• Loan amount: ₹${(loanAmount / 100000).toFixed(1)}L\n`;
  answer += `• EMI at ${assumedRate}% for ${tenure} years: ₹${Math.round(monthlyEMI).toLocaleString("en-IN")}/month\n`;
  answer += `• New debt-to-income ratio: ${newDebtToIncome.toFixed(0)}%\n\n`;

  if (downPayment > profile.liquidAssets) {
    answer += `❌ You don't have enough for the down payment. You need ₹${(downPayment / 100000).toFixed(1)}L but only have ₹${(profile.liquidAssets / 100000).toFixed(1)}L in liquid assets.\n\n`;
    answer += `💡 You'd need to save ₹${Math.ceil((downPayment - profile.liquidAssets) / 24).toLocaleString("en-IN")}/month for 2 years to afford the down payment.`;
  } else if (newDebtToIncome > 50) {
    answer += `🚨 **Not recommended.** The new EMI would push your debt-to-income ratio to ${newDebtToIncome.toFixed(0)}%, which is dangerous. Banks typically approve up to 40-50%.`;
  } else if (newDebtToIncome > 35) {
    answer += `⚠️ **Proceed with caution.** The new EMI would push your debt-to-income ratio to ${newDebtToIncome.toFixed(0)}%. This is manageable but tight.`;
  } else {
    answer += `✅ **Looks feasible!** Your debt-to-income ratio would be ${newDebtToIncome.toFixed(0)}% which is within safe limits. You have the down payment and can manage the EMI.`;
  }

  return {
    answer,
    confidence: "medium",
    category: "House Purchase",
    icon: "🏠",
    metrics: {
      "Property value": `₹${(amount / 100000).toFixed(0)}L`,
      "Down payment": `₹${(downPayment / 100000).toFixed(1)}L`,
      "Monthly EMI": `₹${Math.round(monthlyEMI).toLocaleString("en-IN")}`,
      "New DTI ratio": `${newDebtToIncome.toFixed(0)}%`,
    },
    actions: [
      "Get pre-approved for a home loan to know your eligible amount",
      "Compare rates from at least 3 banks",
      "Don't use your entire emergency fund for down payment",
      "Factor in registration, stamp duty, and interiors (additional 10-15%)",
    ],
    warnings: newDebtToIncome > 40 ? ["EMI burden would be very high after this purchase"] : [],
  };
}

function handleEarlyRetirement(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  // FIRE calculation: Need 25x annual expenses (4% rule)
  const annualExpenses = profile.monthlyExpense * 12;
  const fireTarget = annualExpenses * 25;
  const currentProgress = profile.netWorth / fireTarget * 100;
  const yearsToFire = profile.monthlySavings > 0
    ? Math.ceil((fireTarget - profile.netWorth) / (profile.monthlySavings * 12))
    : 999;
  const monthlyInvestmentNeeded = profile.monthlySavings > 0 ? 0 : fireTarget / (20 * 12); // 20 years default

  let answer = `🏝️ **FIRE (Financial Independence, Retire Early) Analysis**\n\n`;
  answer += `Using the 4% safe withdrawal rule, you need **₹${(fireTarget / 10000000).toFixed(1)} Cr** to be financially free.\n\n`;
  answer += `📊 **Your Position:**\n`;
  answer += `• Current net worth: ₹${(profile.netWorth / 100000).toFixed(1)}L (${currentProgress.toFixed(1)}% of target)\n`;
  answer += `• Annual expenses: ₹${(annualExpenses / 100000).toFixed(1)}L\n`;
  answer += `• Monthly savings: ₹${profile.monthlySavings.toLocaleString("en-IN")}\n`;
  answer += `• Financial freedom ratio: ${(profile.financialFreedomRatio * 100).toFixed(1)}% (passive income covers ${profile.financialFreedomRatio > 1 ? "100%+" : (profile.financialFreedomRatio * 100).toFixed(0) + "%"} of expenses)\n\n`;

  if (profile.financialFreedomRatio >= 1) {
    answer += `🎉 **You may already be financially free!** Your investments generate enough passive income to cover your expenses. Consult a financial advisor to confirm.`;
  } else if (yearsToFire <= 10) {
    answer += `🟢 You could achieve FIRE in approximately **${yearsToFire} years** at your current savings rate. Great progress!`;
  } else if (yearsToFire <= 20) {
    answer += `🟡 At your current savings rate, FIRE is achievable in about **${yearsToFire} years**. You can accelerate this by increasing your savings rate or investment returns.`;
  } else {
    answer += `🔴 At your current rate, FIRE would take **${yearsToFire}+ years**. You need to significantly increase your savings rate and investment income.`;
  }

  return {
    answer,
    confidence: "medium",
    category: "Early Retirement",
    icon: "🏝️",
    metrics: {
      "FIRE target": `₹${(fireTarget / 10000000).toFixed(1)} Cr`,
      "Current progress": `${currentProgress.toFixed(1)}%`,
      "Years to FIRE": yearsToFire > 100 ? "100+" : `${yearsToFire}`,
      "Freedom ratio": `${(profile.financialFreedomRatio * 100).toFixed(1)}%`,
    },
    actions: [
      `Save at least 50% of income to accelerate FIRE`,
      `Invest in equity mutual funds for long-term wealth creation`,
      `Reduce lifestyle inflation — every ₹1,000 saved monthly = ₹3L closer to FIRE`,
      `Track progress monthly and adjust strategy`,
    ],
  };
}

function handleRetirement(profile: TwinProfile, query: TwinQuery): TwinResponse {
  const fireResp = handleEarlyRetirement(profile, query);
  let answer = fireResp.answer.replace("FIRE (Financial Independence, Retire Early)", "Retirement Readiness");
  answer += `\n\n💡 **Retirement-specific tips:**\n• Maximize EPF/PPF contributions for tax-free retirement income\n• Consider NPS for additional ₹50,000 deduction under Section 80CCD\n• Aim for 80% of pre-retirement income as retirement income\n• Account for inflation — ₹1L today will feel like ₹35K in 20 years at 5% inflation`;
  return { ...fireResp, answer, category: "Retirement", icon: "🏖️" };
}

function handleSavingsAdvice(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  const potentialSavings = profile.monthlyExpense * 0.15; // Assume 15% can be optimized
  const savingsRate = profile.savingsRate;
  const targetRate = 30;

  let answer = `💰 **Savings Analysis**\n\n`;
  answer += `Your current savings rate is **${savingsRate.toFixed(0)}%** (target: ${targetRate}%+)\n\n`;

  if (savingsRate >= 30) {
    answer += `✅ Excellent savings rate! You're saving ₹${profile.monthlySavings.toLocaleString("en-IN")}/month. Keep it up and invest wisely.`;
  } else if (savingsRate >= 20) {
    answer += `⚠️ Your savings rate is decent but could be better. You could potentially save an additional ₹${Math.round(potentialSavings).toLocaleString("en-IN")}/month by optimizing expenses.`;
  } else if (savingsRate > 0) {
    answer += `🚨 Your savings rate is dangerously low at ${savingsRate.toFixed(0)}%. You need to cut expenses and/or increase income immediately. Potential savings: ₹${Math.round(potentialSavings).toLocaleString("en-IN")}/month.`;
  } else {
    answer += `❌ You're not saving anything! In fact, you're spending more than you earn. This is unsustainable and needs immediate correction.`;
  }

  answer += `\n\n📊 **Breakdown:**\n• Monthly income: ₹${profile.monthlyIncome.toLocaleString("en-IN")}\n• Monthly expenses: ₹${profile.monthlyExpense.toLocaleString("en-IN")}\n• Monthly savings: ₹${profile.monthlySavings.toLocaleString("en-IN")}\n• Emergency fund: ${profile.emergencyMonths.toFixed(1)} months`;

  return {
    answer,
    confidence: "high",
    category: "Savings",
    icon: "💰",
    metrics: {
      "Savings rate": `${savingsRate.toFixed(0)}%`,
      "Monthly savings": `₹${profile.monthlySavings.toLocaleString("en-IN")}`,
      "Potential extra savings": `₹${Math.round(potentialSavings).toLocaleString("en-IN")}/mo`,
    },
    actions: [
      "Track every expense for 30 days to find leaks",
      "Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings",
      "Automate savings — transfer to a separate account on payday",
      "Review subscriptions quarterly and cancel unused ones",
      "Cook at home more — dining out is often the biggest leak",
    ],
  };
}

function handleInvestmentAdvice(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  const invRate = profile.investmentRate;
  const growth = profile.investmentGrowth;
  const growthPct = profile.investmentValue > 0 ? (growth / (profile.investmentValue - growth)) * 100 : 0;

  let answer = `📈 **Investment Analysis**\n\n`;
  answer += `• Investment value: ₹${profile.investmentValue.toLocaleString("en-IN")}\n`;
  answer += `• Total invested: ₹${(profile.investmentValue - growth).toLocaleString("en-IN")}\n`;
  answer += `• Unrealized gains: ₹${growth.toLocaleString("en-IN")} (${growthPct.toFixed(1)}%)\n`;
  answer += `• Investment allocation: ${invRate.toFixed(0)}% of total assets\n\n`;

  if (invRate < 20) {
    answer += `🚨 **Under-invested!** Only ${invRate.toFixed(0)}% of your assets are invested. You're keeping too much in low-yield savings. Inflation is silently eroding your wealth.`;
  } else if (invRate < 40) {
    answer += `⚠️ You could invest more. ${invRate.toFixed(0)}% is okay, but aim for 50%+ for long-term wealth creation.`;
  } else {
    answer += `✅ Good investment allocation at ${invRate.toFixed(0)}%. Ensure proper diversification across asset classes.`;
  }

  return {
    answer,
    confidence: "medium",
    category: "Investment",
    icon: "📈",
    metrics: {
      "Investment value": `₹${profile.investmentValue.toLocaleString("en-IN")}`,
      "Allocation": `${invRate.toFixed(0)}% of assets`,
      "Unrealized gains": `₹${growth.toLocaleString("en-IN")}`,
    },
    actions: [
      "Start SIP in diversified equity mutual funds",
      "Maintain asset allocation: 60% equity, 20% debt, 10% gold, 10% cash",
      "Review portfolio every 6 months, not daily",
      "Don't time the market — consistency beats timing",
      "Use PPF for tax-saving + risk-free returns",
    ],
  };
}

function handleDebtFreedom(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  if (profile.totalDebt === 0) {
    return {
      answer: `🎉 **You're debt-free!** No outstanding loans or credit card debt. Maintain this by living within your means.`,
      confidence: "high",
      category: "Debt Freedom",
      icon: "🎯",
      actions: ["Stay debt-free by avoiding unnecessary loans", "Use credit cards only if you can pay in full monthly"],
    };
  }

  // Avalanche method: pay highest interest first
  const monthsToFreedom = profile.monthlySavings > profile.totalEMI
    ? Math.ceil(profile.totalDebt / (profile.monthlySavings - profile.totalEMI))
    : 999;

  let answer = `🎯 **Debt Freedom Analysis**\n\n`;
  answer += `• Total outstanding debt: ₹${profile.totalDebt.toLocaleString("en-IN")}\n`;
  answer += `• Monthly EMI: ₹${profile.totalEMI.toLocaleString("en-IN")}\n`;
  answer += `• Debt-to-income ratio: ${profile.debtToIncomeRatio.toFixed(0)}%\n\n`;

  if (monthsToFreedom <= 24) {
    answer += `🟢 You can be debt-free in approximately **${monthsToFreedom} months** by directing extra savings toward your loans.`;
  } else if (monthsToFreedom <= 60) {
    answer += `🟡 It would take about **${monthsToFreedom} months** to become debt-free at your current rate. Consider the debt avalanche method.`;
  } else {
    answer += `🔴 Your debt is very high relative to your income. It would take **${monthsToFreedom}+ months** to become debt-free. Seek professional help.`;
  }

  answer += `\n\n💡 **Debt Avalanche Method:** Pay minimum on all loans, put extra money toward the highest-interest loan first. This minimizes total interest paid.`;

  return {
    answer,
    confidence: "medium",
    category: "Debt Freedom",
    icon: "🎯",
    metrics: {
      "Total debt": `₹${profile.totalDebt.toLocaleString("en-IN")}`,
      "Monthly EMI": `₹${profile.totalEMI.toLocaleString("en-IN")}`,
      "DTI ratio": `${profile.debtToIncomeRatio.toFixed(0)}%`,
      "Months to freedom": monthsToFreedom > 100 ? "100+" : `${monthsToFreedom}`,
    },
    actions: [
      "List all debts with interest rates",
      "Pay minimum on all, extra on highest-rate debt (avalanche)",
      "Consider balance transfer for high-interest credit cards",
      "Avoid taking new loans until existing ones are under control",
      "Negotiate lower interest rates with your bank",
    ],
    warnings: profile.debtToIncomeRatio > 50 ? ["Your debt-to-income ratio is dangerously high!"] : [],
  };
}

function handleEmergencyFund(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  const target6m = profile.monthlyExpense * 6;
  const target12m = profile.monthlyExpense * 12;
  const deficit6m = Math.max(0, target6m - profile.emergencySaved);
  const deficit12m = Math.max(0, target12m - profile.emergencySaved);

  let answer = `🛟 **Emergency Fund Analysis**\n\n`;
  answer += `• Current emergency savings: ₹${profile.emergencySaved.toLocaleString("en-IN")}\n`;
  answer += `• Monthly expenses: ₹${profile.monthlyExpense.toLocaleString("en-IN")}\n`;
  answer += `• Current coverage: ${profile.emergencyMonths.toFixed(1)} months\n`;
  answer += `• 6-month target: ₹${target6m.toLocaleString("en-IN")} ${deficit6m > 0 ? `(₹${deficit6m.toLocaleString("en-IN")} short)` : "✅ Achieved"}\n`;
  answer += `• 12-month target: ₹${target12m.toLocaleString("en-IN")} ${deficit12m > 0 ? `(₹${deficit12m.toLocaleString("en-IN")} short)` : "✅ Achieved"}\n\n`;

  if (profile.emergencyMonths >= 12) {
    answer += `✅ **Excellent!** Your emergency fund covers ${profile.emergencyMonths.toFixed(1)} months. You're well-protected against financial shocks.`;
  } else if (profile.emergencyMonths >= 6) {
    answer += `⚠️ **Good but not great.** You have 6 months covered, but aim for 12 months for complete peace of mind. Save ₹${Math.ceil(deficit12m / 12).toLocaleString("en-IN")}/month for the next year.`;
  } else if (profile.emergencyMonths >= 3) {
    answer += `🚨 **Needs attention.** You have ${profile.emergencyMonths.toFixed(1)} months of coverage. Prioritize building this to 6 months immediately. Save ₹${Math.ceil(deficit6m / 6).toLocaleString("en-IN")}/month for the next 6 months.`;
  } else {
    answer += `❌ **Critical!** Your emergency fund covers only ${profile.emergencyMonths.toFixed(1)} months. You are extremely vulnerable to any financial shock. This should be your #1 priority!`;
  }

  return {
    answer,
    confidence: "high",
    category: "Emergency Fund",
    icon: "🛟",
    metrics: {
      "Current coverage": `${profile.emergencyMonths.toFixed(1)} months`,
      "6-month target": `₹${target6m.toLocaleString("en-IN")}`,
      "Deficit": `₹${deficit6m.toLocaleString("en-IN")}`,
    },
    actions: [
      "Keep emergency fund in a separate savings account or liquid fund",
      "Don't invest emergency money in stocks or fixed deposits with lock-in",
      "Build to 6 months first, then 12 months",
      "Replenish immediately after any withdrawal",
    ],
  };
}

function handleInsurance(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  const minLifeCover = profile.monthlyIncome * 12 * 10; // 10x annual income
  const hasAdequateLifeCover = true; // We'd check actual insurance data

  let answer = `🛡️ **Insurance Gap Analysis**\n\n`;
  answer += `• Recommended life cover: ₹${(minLifeCover / 100000).toFixed(0)}L (10x annual income)\n`;
  answer += `• Monthly income: ₹${profile.monthlyIncome.toLocaleString("en-IN")}\n`;
  answer += `• Monthly expenses: ₹${profile.monthlyExpense.toLocaleString("en-IN")}\n`;
  answer += `• Outstanding debt: ₹${profile.totalDebt.toLocaleString("en-IN")}\n\n`;

  answer += `💡 **Key Recommendations:**\n`;
  answer += `1. **Term Insurance:** Get at least ₹${(minLifeCover / 100000).toFixed(0)}L cover. This is non-negotiable if anyone depends on your income.\n`;
  answer += `2. **Health Insurance:** Minimum ₹10L family floater. Medical emergencies can wipe out savings.\n`;
  answer += `3. **Critical Illness:** Consider ₹25L+ cover for cancer, heart disease etc.\n`;
  answer += `4. **Don't mix insurance & investment** — buy term insurance, invest the difference in mutual funds.`;

  return {
    answer,
    confidence: "medium",
    category: "Insurance",
    icon: "🛡️",
    metrics: {
      "Recommended life cover": `₹${(minLifeCover / 100000).toFixed(0)}L`,
      "Outstanding debt": `₹${profile.totalDebt.toLocaleString("en-IN")}`,
    },
    actions: [
      "Get term insurance immediately if you don't have it",
      "Ensure health insurance covers all family members",
      "Review insurance annually and increase cover as income grows",
      "Never buy ULIPs or endowment plans — they give poor returns",
    ],
  };
}

function handleTaxPlanning(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  const annualIncome = profile.monthlyIncome * 12;

  let answer = `🧮 **Tax Planning Insights**\n\n`;
  answer += `• Estimated annual income: ₹${annualIncome.toLocaleString("en-IN")}\n\n`;
  answer += `💡 **Tax-Saving Strategies:**\n\n`;
  answer += `**Section 80C (₹1.5L limit):**\n• PPF — ₹1.5L/year, 7.1% tax-free returns\n• ELSS Mutual Funds — ₹1.5L, 3-year lock-in, market returns\n• NPS — Additional ₹50K under 80CCD(1B)\n• EPF — Already deducted from salary\n\n`;
  answer += `**Section 80D (Health Insurance):**\n• Self/family: Up to ₹25K (₹50K for senior citizens)\n• Parents: Additional ₹25K (₹50K for senior citizens)\n\n`;
  answer += `**HRA Exemption:**\n• If renting, claim HRA exemption to reduce taxable income\n\n`;
  answer += `**Home Loan:**\n• Principal repayment under 80C\n• Interest up to ₹2L under Section 24\n• Additional ₹1.5L for first-time buyers under 80EEA`;

  if (annualIncome > 1500000) {
    answer += `\n\n⚠️ With income above ₹15L, consider both old and new tax regimes. The new regime has lower rates but fewer deductions. Run the Tax Calculator in Planning → Tax to compare.`;
  }

  return {
    answer,
    confidence: "medium",
    category: "Tax Planning",
    icon: "🧮",
    metrics: {
      "Estimated annual income": `₹${annualIncome.toLocaleString("en-IN")}`,
      "80C potential saving": "₹1,50,000",
      "80D potential saving": "₹25,000–₹1,00,000",
    },
    actions: [
      "Maximize 80C with PPF + ELSS combination",
      "Get health insurance for 80D deduction",
      "Use Tax Calculator (Planning → Tax) to compare regimes",
      "Start tax planning in April, not March",
      "Maintain proof of all investments for IT returns",
    ],
  };
}

function handleGoalPlanning(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  let answer = `🎯 **Goal Planning Insights**\n\n`;
  answer += `Based on your financial profile:\n\n`;
  answer += `• Monthly savings available: ₹${profile.monthlySavings.toLocaleString("en-IN")}\n`;
  answer += `• Savings rate: ${profile.savingsRate.toFixed(0)}%\n`;
  answer += `• Net worth: ₹${profile.netWorth.toLocaleString("en-IN")}\n\n`;

  if (profile.monthlySavings <= 0) {
    answer += `❌ You have no surplus for goals right now. Focus on increasing income or reducing expenses first.`;
  } else {
    answer += `💡 **Suggested Goal Allocation of ₹${profile.monthlySavings.toLocaleString("en-IN")}/month:**\n\n`;
    const emergency = Math.round(profile.monthlySavings * 0.3);
    const investment = Math.round(profile.monthlySavings * 0.4);
    const goals = Math.round(profile.monthlySavings * 0.2);
    const fun = Math.round(profile.monthlySavings * 0.1);

    answer += `1. 🛟 Emergency Fund: ₹${emergency.toLocaleString("en-IN")} (30%)\n`;
    answer += `2. 📈 Investments: ₹${investment.toLocaleString("en-IN")} (40%)\n`;
    answer += `3. 🎯 Goals: ₹${goals.toLocaleString("en-IN")} (20%)\n`;
    answer += `4. 🎉 Fun/Lifestyle: ₹${fun.toLocaleString("en-IN")} (10%)\n`;
  }

  return {
    answer,
    confidence: "medium",
    category: "Goal Planning",
    icon: "🎯",
    actions: [
      "Create specific goals with deadlines",
      "Automate goal savings via SIP",
      "Review goals quarterly",
      "Celebrate milestones to stay motivated",
    ],
  };
}

function handleNetWorth(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  let answer = `💎 **Net Worth Analysis**\n\n`;
  answer += `• Net Worth: ₹${profile.netWorth.toLocaleString("en-IN")}\n`;
  answer += `• Total Assets: ₹${profile.totalAssets.toLocaleString("en-IN")}\n`;
  answer += `• Total Liabilities: ₹${profile.totalLiabilities.toLocaleString("en-IN")}\n`;
  answer += `• Liquid Assets: ₹${profile.liquidAssets.toLocaleString("en-IN")}\n`;
  answer += `• Investment Value: ₹${profile.investmentValue.toLocaleString("en-IN")}\n\n`;

  if (profile.netWorth > 0) {
    const assetBreakdown = [
      `Liquid: ${((profile.liquidAssets / profile.totalAssets) * 100).toFixed(0)}%`,
      `Invested: ${((profile.investmentValue / profile.totalAssets) * 100).toFixed(0)}%`,
    ];
    answer += `📊 **Asset Allocation:** ${assetBreakdown.join(" | ")}\n\n`;

    if (profile.liquidAssets > profile.investmentValue) {
      answer += `⚠️ Too much in liquid assets — you're losing to inflation. Consider investing more.`;
    } else {
      answer += `✅ Good asset allocation. Your investments are working hard for you.`;
    }
  } else {
    answer += `❌ Your net worth is negative. Focus on reducing debt and building savings.`;
  }

  return {
    answer,
    confidence: "high",
    category: "Net Worth",
    icon: "💎",
    metrics: {
      "Net worth": `₹${profile.netWorth.toLocaleString("en-IN")}`,
      "Assets": `₹${profile.totalAssets.toLocaleString("en-IN")}`,
      "Liabilities": `₹${profile.totalLiabilities.toLocaleString("en-IN")}`,
    },
  };
}

function handleCashFlow(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  let answer = `💸 **Cash Flow Analysis**\n\n`;
  answer += `**Monthly Income:** ₹${profile.monthlyIncome.toLocaleString("en-IN")}\n`;
  answer += `**Monthly Expenses:** ₹${profile.monthlyExpense.toLocaleString("en-IN")}\n`;
  answer += `**Monthly Savings:** ₹${profile.monthlySavings.toLocaleString("en-IN")}\n`;
  answer += `**Monthly EMI:** ₹${profile.totalEMI.toLocaleString("en-IN")}\n\n`;

  const fixedCosts = profile.totalEMI; // EMI is fixed
  const discretionary = profile.monthlyExpense - fixedCosts;

  answer += `📊 **Breakdown:**\n`;
  answer += `• Fixed costs (EMI): ₹${fixedCosts.toLocaleString("en-IN")} (${profile.monthlyIncome > 0 ? ((fixedCosts / profile.monthlyIncome) * 100).toFixed(0) : 0}% of income)\n`;
  answer += `• Discretionary: ₹${discretionary.toLocaleString("en-IN")} (${profile.monthlyIncome > 0 ? ((discretionary / profile.monthlyIncome) * 100).toFixed(0) : 0}% of income)\n\n`;

  if (profile.monthlySavings >= profile.monthlyIncome * 0.3) {
    answer += `✅ Excellent cash flow! You're saving a healthy portion of your income.`;
  } else if (profile.monthlySavings > 0) {
    answer += `⚠️ Your cash flow is positive but thin. Try to increase the gap between income and expenses.`;
  } else {
    answer += `🚨 Negative cash flow! You're spending more than you earn. This is unsustainable.`;
  }

  return {
    answer,
    confidence: "high",
    category: "Cash Flow",
    icon: "💸",
    metrics: {
      "Monthly income": `₹${profile.monthlyIncome.toLocaleString("en-IN")}`,
      "Monthly expenses": `₹${profile.monthlyExpense.toLocaleString("en-IN")}`,
      "Savings rate": `${profile.savingsRate.toFixed(0)}%`,
    },
  };
}

function handleStress(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  let stressScore = 0;
  const warnings: string[] = [];

  // Stress factors (0-100 scale)
  if (profile.emergencyMonths < 3) { stressScore += 30; warnings.push("Emergency fund critically low"); }
  else if (profile.emergencyMonths < 6) { stressScore += 15; warnings.push("Emergency fund below 6 months"); }

  if (profile.debtToIncomeRatio > 50) { stressScore += 25; warnings.push("Debt-to-income ratio dangerously high"); }
  else if (profile.debtToIncomeRatio > 35) { stressScore += 12; warnings.push("Debt burden is significant"); }

  if (profile.savingsRate < 10) { stressScore += 20; warnings.push("Savings rate too low"); }
  else if (profile.savingsRate < 20) { stressScore += 10; warnings.push("Savings rate below target"); }

  if (profile.monthlySavings <= 0) { stressScore += 20; warnings.push("Negative monthly cash flow"); }
  if (profile.cashRunway < 3) { stressScore += 15; warnings.push("Cash runway dangerously short"); }

  stressScore = Math.min(100, stressScore);

  const level = stressScore >= 60 ? "HIGH" : stressScore >= 30 ? "MODERATE" : "LOW";
  const emoji = stressScore >= 60 ? "🔴" : stressScore >= 30 ? "🟡" : "🟢";

  let answer = `😰 **Financial Stress Meter: ${emoji} ${level} (${stressScore}/100)**\n\n`;

  if (stressScore >= 60) {
    answer += `Your financial stress level is **high**. This means your finances are vulnerable to shocks and you need to take action now.\n\n`;
  } else if (stressScore >= 30) {
    answer += `Your financial stress level is **moderate**. You have some areas of concern but nothing critical. Address the warnings below.\n\n`;
  } else {
    answer += `Your financial stress level is **low**. You're in good shape financially! Keep up the good habits.\n\n`;
  }

  answer += `📊 **Key Stress Factors:**\n`;
  answer += `• Emergency coverage: ${profile.emergencyMonths.toFixed(1)} months\n`;
  answer += `• Debt-to-income: ${profile.debtToIncomeRatio.toFixed(0)}%\n`;
  answer += `• Savings rate: ${profile.savingsRate.toFixed(0)}%\n`;
  answer += `• Cash runway: ${profile.cashRunway.toFixed(1)} months\n`;
  answer += `• Monthly cash flow: ₹${profile.monthlySavings.toLocaleString("en-IN")}`;

  return {
    answer,
    confidence: "high",
    category: "Financial Stress",
    icon: "😰",
    metrics: {
      "Stress score": `${stressScore}/100`,
      "Stress level": level,
      "Cash runway": `${profile.cashRunway.toFixed(1)} months`,
    },
    actions: stressScore >= 30 ? [
      "Build emergency fund to 6 months as top priority",
      "Reduce debt using avalanche method",
      "Cut non-essential expenses immediately",
      "Consider increasing income sources",
    ] : [
      "Maintain your good financial habits",
      "Consider increasing investment allocation",
      "Plan for long-term goals",
    ],
    warnings,
  };
}

function handleHealthScoreQuery(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  const hs = profile.healthScore;
  const toneEmoji = hs >= 75 ? "🎉" : hs >= 50 ? "💪" : "⚠️";

  let answer = `❤️ **Financial Health Score: ${hs}/100** ${toneEmoji}\n\n`;
  answer += `Your health score is based on 4 core factors:\n\n`;
  answer += `• Savings Rate: ${profile.savingsRate.toFixed(0)}% ${profile.savingsRate >= 20 ? "✅" : "❌"}\n`;
  answer += `• Emergency Coverage: ${profile.emergencyMonths.toFixed(1)} months ${profile.emergencyMonths >= 6 ? "✅" : "❌"}\n`;
  answer += `• Debt-to-Income: ${profile.debtToIncomeRatio.toFixed(0)}% ${profile.debtToIncomeRatio <= 35 ? "✅" : "❌"}\n`;
  answer += `• Investment Rate: ${profile.investmentRate.toFixed(0)}% ${profile.investmentRate >= 30 ? "✅" : "❌"}\n\n`;
  answer += `💡 For a detailed 8-dimension health score breakdown with improvement tips, visit the **Health Score** page.`;

  return {
    answer,
    confidence: "high",
    category: "Health Score",
    icon: "❤️",
    metrics: {
      "Overall score": `${hs}/100`,
      "Savings rate": `${profile.savingsRate.toFixed(0)}%`,
      "Emergency": `${profile.emergencyMonths.toFixed(1)} mo`,
      "DTI ratio": `${profile.debtToIncomeRatio.toFixed(0)}%`,
    },
    actions: [
      "Visit the Health Score page for a detailed 8-dimension breakdown",
      hs < 50 ? "Focus on the lowest-scoring dimension first" : "Keep maintaining your good financial habits",
      "Recheck your score monthly to track progress",
    ],
  };
}

function handleGeneralQuery(profile: TwinProfile, _query: TwinQuery): TwinResponse {
  const hs = profile.healthScore;
  const tone = hs >= 75 ? "🎉" : hs >= 50 ? "💪" : "⚠️";

  let answer = `${tone} **Your Financial Snapshot**\n\n`;
  answer += `**Health Score: ${hs}/100**\n\n`;
  answer += `📊 **Key Metrics:**\n`;
  answer += `• Net Worth: ₹${profile.netWorth.toLocaleString("en-IN")}\n`;
  answer += `• Monthly Income: ₹${profile.monthlyIncome.toLocaleString("en-IN")}\n`;
  answer += `• Monthly Expenses: ₹${profile.monthlyExpense.toLocaleString("en-IN")}\n`;
  answer += `• Savings Rate: ${profile.savingsRate.toFixed(0)}%\n`;
  answer += `• Emergency Cover: ${profile.emergencyMonths.toFixed(1)} months\n`;
  answer += `• Debt-to-Income: ${profile.debtToIncomeRatio.toFixed(0)}%\n`;
  answer += `• Cash Runway: ${profile.cashRunway.toFixed(1)} months\n\n`;

  answer += `💡 **Try asking specific questions like:**\n`;
  answer += `• "Can I afford a ₹50,000 purchase?"\n`;
  answer += `• "What happens if I lose my job?"\n`;
  answer += `• "Should I buy a house worth ₹50L?"\n`;
  answer += `• "Can I retire early?"\n`;
  answer += `• "How can I save more?"\n`;
  answer += `• "Am I financially stressed?"`;

  return {
    answer,
    confidence: "medium",
    category: "Overview",
    icon: "🤖",
    metrics: {
      "Health score": `${hs}/100`,
      "Net worth": `₹${profile.netWorth.toLocaleString("en-IN")}`,
      "Savings rate": `${profile.savingsRate.toFixed(0)}%`,
    },
  };
}

// ─── Scenario Simulator ───────────────────────────────────────

export function simulateScenario(
  profile: TwinProfile,
  scenario: "salaryIncrease" | "salaryDecrease" | "housePurchase" | "carPurchase" | "jobLoss" | "inflation" | "childEducation" | "medicalEmergency",
  params: { amount?: number; percent?: number },
): TwinScenario {
  const pct = params.percent || 0;
  const amt = params.amount || 0;

  switch (scenario) {
    case "salaryIncrease": {
      const newIncome = profile.monthlyIncome * (1 + pct / 100);
      const newSavings = newIncome - profile.monthlyExpense;
      const newSavingsRate = newIncome > 0 ? (newSavings / newIncome) * 100 : 0;
      return {
        name: "Salary Increase",
        description: `+${pct}% salary increase (₹${Math.round(profile.monthlyIncome * pct / 100).toLocaleString("en-IN")}/month more)`,
        impact: {
          netWorthChange: newSavings * 12 - profile.monthlySavings * 12,
          monthlyChange: newSavings - profile.monthlySavings,
          emergencyMonthsChange: 0,
          savingsRateChange: newSavingsRate - profile.savingsRate,
        },
        risk: "low",
        recommendation: `Great opportunity! Invest the entire raise instead of lifestyle inflation. This could add ₹${Math.round((newSavings - profile.monthlySavings) * 12).toLocaleString("en-IN")} to your net worth annually.`,
      };
    }
    case "salaryDecrease": {
      const newIncome = profile.monthlyIncome * (1 - pct / 100);
      const newSavings = newIncome - profile.monthlyExpense;
      const newSavingsRate = newIncome > 0 ? (newSavings / newIncome) * 100 : 0;
      return {
        name: "Salary Decrease",
        description: `-${pct}% salary decrease (₹${Math.round(profile.monthlyIncome * pct / 100).toLocaleString("en-IN")}/month less)`,
        impact: {
          netWorthChange: newSavings * 12 - profile.monthlySavings * 12,
          monthlyChange: newSavings - profile.monthlySavings,
          emergencyMonthsChange: profile.monthlyExpense > 0 ? -(profile.monthlySavings - newSavings) / profile.monthlyExpense : 0,
          savingsRateChange: newSavingsRate - profile.savingsRate,
        },
        risk: newSavings < 0 ? "high" : "medium",
        recommendation: newSavings < 0
          ? `This would put you in negative cash flow! Cut ₹${Math.round(-newSavings).toLocaleString("en-IN")}/month in expenses immediately.`
          : `Your savings would drop to ₹${Math.round(newSavings).toLocaleString("en-IN")}/month. Consider reducing discretionary spending.`,
      };
    }
    case "housePurchase": {
      const emi = amt > 0 ? (amt * 0.8 * 8.5 / 1200 * Math.pow(1 + 8.5 / 1200, 240)) / (Math.pow(1 + 8.5 / 1200, 240) - 1) : 0;
      const newSavings = profile.monthlySavings - emi;
      return {
        name: "House Purchase",
        description: `₹${(amt / 100000).toFixed(0)}L house with 80% loan`,
        impact: {
          netWorthChange: amt * 0.2 > profile.liquidAssets ? -(amt * 0.2 - profile.liquidAssets) : 0,
          monthlyChange: -emi,
          emergencyMonthsChange: profile.monthlyExpense > 0 ? -(emi / profile.monthlyExpense) : 0,
          savingsRateChange: profile.monthlyIncome > 0 ? (-emi / profile.monthlyIncome) * 100 : 0,
        },
        risk: emi > profile.monthlySavings ? "high" : emi > profile.monthlySavings * 0.5 ? "medium" : "low",
        recommendation: emi > profile.monthlySavings
          ? "EMI would exceed your savings — don't do this!"
          : `EMI of ₹${Math.round(emi).toLocaleString("en-IN")}/month is ${profile.monthlySavings > 0 ? ((emi / profile.monthlySavings) * 100).toFixed(0) : 100}% of your current savings. ${emi < profile.monthlySavings * 0.5 ? "Comfortable." : "Tight — be careful."}`,
      };
    }
    case "carPurchase": {
      const carEmi = amt > 0 ? (amt * 0.8 * 9 / 1200 * Math.pow(1 + 9 / 1200, 84)) / (Math.pow(1 + 9 / 1200, 84) - 1) : 0;
      return {
        name: "Car Purchase",
        description: `₹${(amt / 100000).toFixed(0)}L car with 80% loan (7 years @ 9%)`,
        impact: {
          netWorthChange: -(amt * 0.2), // down payment
          monthlyChange: -carEmi,
          emergencyMonthsChange: 0,
          savingsRateChange: profile.monthlyIncome > 0 ? (-carEmi / profile.monthlyIncome) * 100 : 0,
        },
        risk: carEmi > profile.monthlySavings * 0.3 ? "high" : "medium",
        recommendation: `Car EMI would be ₹${Math.round(carEmi).toLocaleString("en-IN")}/month. A car is a depreciating asset — consider a used car or saving up instead of taking a loan.`,
      };
    }
    case "jobLoss": {
      const monthsSurvivable = profile.monthlyExpense > 0 ? profile.liquidAssets / profile.monthlyExpense : 0;
      return {
        name: "Job Loss",
        description: "Complete loss of income",
        impact: {
          netWorthChange: -profile.monthlyExpense * 6, // drain in 6 months
          monthlyChange: -profile.monthlyIncome,
          emergencyMonthsChange: 0,
          savingsRateChange: -profile.savingsRate,
        },
        risk: monthsSurvivable < 6 ? "high" : monthsSurvivable < 12 ? "medium" : "low",
        recommendation: monthsSurvivable < 6
          ? "Critical! You'd run out of money in less than 6 months. Build your emergency fund immediately."
          : monthsSurvivable < 12
          ? `You'd survive ${monthsSurvivable.toFixed(0)} months. Build to 12 months for safety.`
          : `You'd survive ${monthsSurvivable.toFixed(0)} months. Good position, but keep networking and updating skills.`,
      };
    }
    case "inflation": {
      const inflatedExpenses = profile.monthlyExpense * (1 + pct / 100);
      const newSavings = profile.monthlyIncome - inflatedExpenses;
      return {
        name: "Inflation Impact",
        description: `${pct}% inflation increase in expenses`,
        impact: {
          netWorthChange: -(inflatedExpenses - profile.monthlyExpense) * 12,
          monthlyChange: newSavings - profile.monthlySavings,
          emergencyMonthsChange: profile.monthlyExpense > 0 ? -(inflatedExpenses - profile.monthlyExpense) / profile.monthlyExpense : 0,
          savingsRateChange: profile.monthlyIncome > 0 ? ((newSavings - profile.monthlySavings) / profile.monthlyIncome) * 100 : 0,
        },
        risk: newSavings < 0 ? "high" : "medium",
        recommendation: `At ${pct}% inflation, your expenses would rise by ₹${Math.round(inflatedExpenses - profile.monthlyExpense).toLocaleString("en-IN")}/month. Invest in equity and real assets to beat inflation.`,
      };
    }
    case "childEducation": {
      const eduCost = amt;
      const newSavings = profile.monthlySavings - eduCost / 60; // spread over 5 years
      return {
        name: "Child Education",
        description: `₹${(eduCost / 100000).toFixed(0)}L education expense over 5 years`,
        impact: {
          netWorthChange: -eduCost,
          monthlyChange: -eduCost / 60,
          emergencyMonthsChange: profile.monthlyExpense > 0 ? -(eduCost / 60) / profile.monthlyExpense : 0,
          savingsRateChange: profile.monthlyIncome > 0 ? (-(eduCost / 60) / profile.monthlyIncome) * 100 : 0,
        },
        risk: newSavings < 0 ? "high" : eduCost > profile.liquidAssets * 0.5 ? "medium" : "low",
        recommendation: newSavings < 0
          ? `This would put you in negative cash flow! Consider education loans (tax-deductible under 80E) or SIP for 5 years.`
          : `Manageable — ₹${Math.round(eduCost / 60).toLocaleString("en-IN")}/month for 5 years. Start an education SIP.`,
      };
    }
    case "medicalEmergency": {
      const medCost = amt;
      const hasHealthIns = false; // simplified
      const netImpact = hasHealthIns ? medCost * 0.1 : medCost; // 90% covered by insurance if present
      return {
        name: "Medical Emergency",
        description: `₹${(medCost / 100000).toFixed(0)}L medical expense`,
        impact: {
          netWorthChange: -netImpact,
          monthlyChange: 0,
          emergencyMonthsChange: profile.monthlyExpense > 0 ? -netImpact / profile.monthlyExpense : 0,
          savingsRateChange: 0,
        },
        risk: netImpact > profile.liquidAssets ? "high" : netImpact > profile.emergencySaved ? "medium" : "low",
        recommendation: netImpact > profile.liquidAssets
          ? `This would drain your liquid assets! Get health insurance immediately.`
          : `Your emergency fund can absorb this, but get health insurance to protect yourself.`,
      };
    }
    default:
      return {
        name: "Unknown Scenario",
        description: "Scenario not recognized",
        impact: { netWorthChange: 0, monthlyChange: 0, emergencyMonthsChange: 0, savingsRateChange: 0 },
        risk: "low",
        recommendation: "Try a specific scenario like salary increase, house purchase, or job loss.",
      };
  }
}
