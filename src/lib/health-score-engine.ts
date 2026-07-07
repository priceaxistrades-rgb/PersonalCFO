/**
 * ═══════════════════════════════════════════════════════════════
 * COMPREHENSIVE FINANCIAL HEALTH SCORE ENGINE — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * 8-dimension financial health scoring (0-100 each):
 *   1. Cash Flow Score    — Income vs expenses consistency
 *   2. Savings Score      — Savings rate + emergency fund
 *   3. Investment Score   — Asset allocation + growth
 *   4. Debt Score         — Debt burden + repayment
 *   5. Emergency Score    — Rainy-day coverage
 *   6. Insurance Score    — Risk coverage adequacy
 *   7. Goal Score         — Progress on financial goals
 *   8. Budget Score       — Budget adherence
 *
 * Overall score = weighted average of 8 sub-scores.
 * Each sub-score includes improvement tips.
 *
 * Uses BigInt precision math for all monetary calculations.
 * ═══════════════════════════════════════════════════════════════
 */

import { sumMoneyToNumber } from "./finance-math";
import { num } from "./format";
import { monthKey, currentMonthKey, sumByPaise, lastNMonths, monthlyFlow } from "./data-utils";
import type {
  TransactionRow,
  AccountRow,
  InvestmentRow,
  DebtRow,
  BillRow,
  GoalRow,
  InsuranceRow,
  BudgetRow,
} from "./types";

// ─── Score Types ──────────────────────────────────────────────

export type SubScore = {
  id: string;
  label: string;
  icon: string;
  score: number;       // 0-100
  weight: number;      // relative weight for overall score
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  value: string;       // display value (e.g. "32%" or "4.5 mo")
  target: string;      // what they should aim for
  tip: string;         // one-line improvement tip
  details: string[];   // detailed breakdown
};

export type HealthScoreBreakdown = {
  overall: number;     // 0-100 weighted average
  grade: string;       // A+, A, B+, B, C, D, F
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  subScores: SubScore[];
  topActions: string[]; // top 3 actions to improve
  strengths: string[];  // what's going well
  weaknesses: string[]; // what needs work
};

// ─── Input Type ───────────────────────────────────────────────

export type HealthScoreInput = {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
  insurance: InsuranceRow[];
  budgets: BudgetRow[];
};

// ─── Main Engine ──────────────────────────────────────────────

export function computeHealthScore(data: HealthScoreInput): HealthScoreBreakdown {
  const { txns, accounts, investments, debts, bills, goals, insurance, budgets } = data;

  // Compute raw metrics first
  const cm = currentMonthKey();
  const now = new Date();
  const thisMonthTxns = txns.filter(t => t.txnDate.startsWith(cm));
  const monthlyIncome = sumMoneyToNumber(thisMonthTxns.filter(t => t.type === "income").map(t => t.amount));
  const monthlyExpense = sumMoneyToNumber(thisMonthTxns.filter(t => t.type === "expense").map(t => t.amount));
  const monthlySavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  // Last 6 months flow for consistency
  const months6 = lastNMonths(6);
  const flow = monthlyFlow(txns, months6);
  const positiveMonths = flow.filter(f => f.savings > 0).length;
  const avgSavings = flow.length > 0 ? flow.reduce((s, f) => s + f.savings, 0) / flow.length : 0;

  // Assets
  const liquidAssets = sumMoneyToNumber(accounts.map(a => a.balance));
  const investmentValue = sumMoneyToNumber(investments.map(i => i.currentValue));
  const investedAmount = sumMoneyToNumber(investments.map(i => i.invested));
  const totalAssets = liquidAssets + investmentValue;
  const investmentRate = totalAssets > 0 ? (investmentValue / totalAssets) * 100 : 0;
  const investmentGrowth = investmentValue - investedAmount;
  const growthPct = investedAmount > 0 ? (investmentGrowth / investedAmount) * 100 : 0;

  // Debt
  const totalDebt = sumMoneyToNumber(debts.map(d => d.outstanding));
  const totalEMI = sumMoneyToNumber(debts.map(d => d.emi));
  const debtToIncome = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;

  // Emergency
  const emergencyGoal = goals.find(g => g.category === "Emergency");
  const emergencySaved = emergencyGoal ? num(emergencyGoal.saved) : liquidAssets * 0.5; // estimate if no goal
  const emergencyMonths = monthlyExpense > 0 ? emergencySaved / monthlyExpense : 0;

  // Insurance
  const hasLifeInsurance = insurance.some(i => i.type === "Life");
  const hasHealthInsurance = insurance.some(i => i.type === "Health");
  const totalLifeCover = sumMoneyToNumber(insurance.filter(i => i.type === "Life").map(i => i.coverage));
  const totalHealthCover = sumMoneyToNumber(insurance.filter(i => i.type === "Health").map(i => i.coverage));
  const annualIncome = monthlyIncome * 12;
  const minLifeCover = annualIncome * 10; // 10x annual income recommended
  const minHealthCover = 1000000; // ₹10L minimum

  // Goals
  const goalsWithProgress = goals.map(g => ({
    name: g.name,
    category: g.category,
    progress: num(g.target) > 0 ? (num(g.saved) / num(g.target)) * 100 : 0,
    onTrack: num(g.target) > 0 ? num(g.saved) / num(g.target) >= (g.deadline ? computeExpectedProgress(g.deadline) : 0.5) : false,
  }));

  // Budget
  const budgetCategories = budgets.length;
  const categorySpend = new Map<string, number>();
  thisMonthTxns.filter(t => t.type === "expense").forEach(t => {
    categorySpend.set(t.category, (categorySpend.get(t.category) || 0) + num(t.amount));
  });
  const budgetsOnTrack = budgets.filter(b => {
    const spent = categorySpend.get(b.category) || 0;
    return spent <= num(b.monthlyLimit);
  }).length;
  const budgetAdherence = budgetCategories > 0 ? (budgetsOnTrack / budgetCategories) * 100 : 100; // 100 if no budgets set

  // Compute each sub-score
  const subScores: SubScore[] = [
    computeCashFlowScore(monthlyIncome, monthlyExpense, monthlySavings, savingsRate, positiveMonths, flow.length),
    computeSavingsScore(savingsRate, avgSavings, monthlyIncome),
    computeInvestmentScore(investmentRate, growthPct, investments.length, investmentValue),
    computeDebtScore(debtToIncome, totalDebt, totalEMI, monthlyIncome, debts.length),
    computeEmergencyScore(emergencyMonths, emergencySaved, monthlyExpense),
    computeInsuranceScore(hasLifeInsurance, hasHealthInsurance, totalLifeCover, minLifeCover, totalHealthCover, minHealthCover, insurance.length),
    computeGoalScore(goalsWithProgress, goals.length),
    computeBudgetScore(budgetAdherence, budgetCategories, budgetsOnTrack),
  ];

  // Weighted overall score
  const totalWeight = subScores.reduce((s, sc) => s + sc.weight, 0);
  const overall = Math.round(subScores.reduce((s, sc) => s + sc.score * sc.weight, 0) / totalWeight);

  // Grade
  const grade = overall >= 90 ? "A+" : overall >= 80 ? "A" : overall >= 70 ? "B+" : overall >= 60 ? "B" : overall >= 50 ? "C" : overall >= 35 ? "D" : "F";
  const status = overall >= 80 ? "excellent" : overall >= 60 ? "good" : overall >= 40 ? "fair" : overall >= 25 ? "poor" : "critical";

  // Top actions (from lowest-scoring dimensions)
  const sortedByScore = [...subScores].sort((a, b) => a.score - b.score);
  const topActions = sortedByScore.slice(0, 3).map(sc => sc.tip);

  // Strengths (highest-scoring)
  const strengths = sortedByScore.filter(sc => sc.score >= 60).reverse().slice(0, 3).map(sc => `${sc.icon} ${sc.label}: ${sc.value}`);

  // Weaknesses (lowest-scoring)
  const weaknesses = sortedByScore.filter(sc => sc.score < 60).slice(0, 3).map(sc => `${sc.icon} ${sc.label}: ${sc.value}`);

  return { overall, grade, status, subScores, topActions, strengths, weaknesses };
}

// ─── Sub-Score Computations ───────────────────────────────────

function computeCashFlowScore(
  monthlyIncome: number,
  monthlyExpense: number,
  monthlySavings: number,
  savingsRate: number,
  positiveMonths: number,
  totalMonths: number,
): SubScore {
  let score = 0;
  const details: string[] = [];

  // Positive cash flow (0-40 points)
  if (monthlySavings > 0) {
    score += 40;
    details.push(`✅ Positive cash flow: ₹${monthlySavings.toLocaleString("en-IN")}/month`);
  } else if (monthlySavings === 0) {
    score += 20;
    details.push(`⚠️ Break-even cash flow — income equals expenses`);
  } else {
    details.push(`❌ Negative cash flow: losing ₹${Math.abs(monthlySavings).toLocaleString("en-IN")}/month`);
  }

  // Savings rate (0-30 points)
  if (savingsRate >= 30) {
    score += 30;
    details.push(`✅ Savings rate ${savingsRate.toFixed(0)}% — excellent (target: 30%+)`);
  } else if (savingsRate >= 20) {
    score += 20;
    details.push(`⚠️ Savings rate ${savingsRate.toFixed(0)}% — good but target 30%+`);
  } else if (savingsRate >= 10) {
    score += 10;
    details.push(`⚠️ Savings rate ${savingsRate.toFixed(0)}% — below target`);
  } else {
    details.push(`❌ Savings rate ${savingsRate.toFixed(0)}% — critical, needs immediate improvement`);
  }

  // Consistency (0-30 points)
  const consistencyPct = totalMonths > 0 ? (positiveMonths / totalMonths) * 100 : 0;
  if (consistencyPct >= 80) {
    score += 30;
    details.push(`✅ Consistent: ${positiveMonths}/${totalMonths} months positive`);
  } else if (consistencyPct >= 60) {
    score += 20;
    details.push(`⚠️ Inconsistent: only ${positiveMonths}/${totalMonths} months positive`);
  } else if (consistencyPct >= 40) {
    score += 10;
    details.push(`⚠️ Very inconsistent: ${positiveMonths}/${totalMonths} months positive`);
  }

  score = Math.min(100, Math.max(0, score));

  return {
    id: "cashFlow",
    label: "Cash Flow",
    icon: "💸",
    score,
    weight: 15,
    status: getScoreStatus(score),
    value: `${savingsRate.toFixed(0)}%`,
    target: "30%+ savings rate",
    tip: savingsRate < 20
      ? "Increase income or cut expenses to save at least 20% of income"
      : "Maintain positive cash flow and aim for 30%+ savings",
    details,
  };
}

function computeSavingsScore(
  savingsRate: number,
  avgSavings: number,
  monthlyIncome: number,
): SubScore {
  let score = 0;
  const details: string[] = [];

  // Savings rate (0-60 points)
  if (savingsRate >= 30) {
    score += 60;
    details.push(`✅ Savings rate: ${savingsRate.toFixed(0)}% (target: 30%+)`);
  } else if (savingsRate >= 20) {
    score += 45;
    details.push(`⚠️ Savings rate: ${savingsRate.toFixed(0)}% — aim for 30%+`);
  } else if (savingsRate >= 10) {
    score += 25;
    details.push(`⚠️ Savings rate: ${savingsRate.toFixed(0)}% — needs improvement`);
  } else if (savingsRate > 0) {
    score += 10;
    details.push(`❌ Savings rate: ${savingsRate.toFixed(0)}% — critically low`);
  } else {
    details.push(`❌ No savings — spending equals or exceeds income`);
  }

  // Average savings amount (0-40 points)
  if (avgSavings > monthlyIncome * 0.3) {
    score += 40;
    details.push(`✅ Average monthly savings: ₹${avgSavings.toLocaleString("en-IN")}`);
  } else if (avgSavings > monthlyIncome * 0.2) {
    score += 30;
    details.push(`⚠️ Average monthly savings: ₹${Math.round(avgSavings).toLocaleString("en-IN")}`);
  } else if (avgSavings > 0) {
    score += 15;
    details.push(`⚠️ Average monthly savings: ₹${Math.round(avgSavings).toLocaleString("en-IN")} — low`);
  }

  score = Math.min(100, Math.max(0, score));

  return {
    id: "savings",
    label: "Savings",
    icon: "💰",
    score,
    weight: 15,
    status: getScoreStatus(score),
    value: `₹${Math.round(avgSavings).toLocaleString("en-IN")}/mo`,
    target: "30%+ of income",
    tip: savingsRate < 20
      ? "Automate savings: transfer 20%+ to a separate account on payday"
      : "You're saving well — consider increasing to 30%+ for faster wealth building",
    details,
  };
}

function computeInvestmentScore(
  investmentRate: number,
  growthPct: number,
  investmentCount: number,
  investmentValue: number,
): SubScore {
  let score = 0;
  const details: string[] = [];

  // Investment allocation (0-40 points)
  if (investmentRate >= 50) {
    score += 40;
    details.push(`✅ Investment allocation: ${investmentRate.toFixed(0)}% of assets`);
  } else if (investmentRate >= 30) {
    score += 30;
    details.push(`⚠️ Investment allocation: ${investmentRate.toFixed(0)}% — aim for 50%+`);
  } else if (investmentRate >= 15) {
    score += 15;
    details.push(`⚠️ Investment allocation: ${investmentRate.toFixed(0)}% — under-invested`);
  } else if (investmentCount > 0) {
    score += 5;
    details.push(`❌ Investment allocation: ${investmentRate.toFixed(0)}% — very under-invested`);
  } else {
    details.push(`❌ No investments — money losing value to inflation`);
  }

  // Diversification (0-30 points)
  if (investmentCount >= 5) {
    score += 30;
    details.push(`✅ Diversified: ${investmentCount} investments`);
  } else if (investmentCount >= 3) {
    score += 20;
    details.push(`⚠️ Moderately diversified: ${investmentCount} investments`);
  } else if (investmentCount >= 1) {
    score += 10;
    details.push(`⚠️ Low diversification: ${investmentCount} investment(s)`);
  } else {
    details.push(`❌ No investments — start with SIP in index funds`);
  }

  // Growth (0-30 points)
  if (growthPct > 15) {
    score += 30;
    details.push(`✅ Investment growth: +${growthPct.toFixed(1)}%`);
  } else if (growthPct > 5) {
    score += 20;
    details.push(`⚠️ Investment growth: +${growthPct.toFixed(1)}%`);
  } else if (growthPct > 0) {
    score += 10;
    details.push(`⚠️ Investment growth: +${growthPct.toFixed(1)}% — below market average`);
  } else if (investmentCount > 0) {
    score += 5;
    details.push(`❌ Investment growth: ${growthPct.toFixed(1)}% — may need rebalancing`);
  }

  score = Math.min(100, Math.max(0, score));

  return {
    id: "investment",
    label: "Investment",
    icon: "📈",
    score,
    weight: 15,
    status: getScoreStatus(score),
    value: `${investmentRate.toFixed(0)}%`,
    target: "50%+ of assets invested",
    tip: investmentRate < 30
      ? "Start SIP in diversified equity mutual funds — even ₹5,000/month compounds significantly"
      : "Good investment habit — diversify across equity, debt, and gold for stability",
    details,
  };
}

function computeDebtScore(
  debtToIncome: number,
  totalDebt: number,
  totalEMI: number,
  monthlyIncome: number,
  debtCount: number,
): SubScore {
  let score = 0;
  const details: string[] = [];

  if (debtCount === 0) {
    score = 100;
    details.push(`✅ No debt — excellent position!`);
  } else {
    // DTI ratio (0-50 points)
    if (debtToIncome <= 20) {
      score += 50;
      details.push(`✅ Debt-to-income: ${debtToIncome.toFixed(0)}% — very manageable`);
    } else if (debtToIncome <= 35) {
      score += 35;
      details.push(`⚠️ Debt-to-income: ${debtToIncome.toFixed(0)}% — acceptable but watch`);
    } else if (debtToIncome <= 50) {
      score += 15;
      details.push(`⚠️ Debt-to-income: ${debtToIncome.toFixed(0)}% — high burden`);
    } else {
      details.push(`❌ Debt-to-income: ${debtToIncome.toFixed(0)}% — critical, reduce ASAP`);
    }

    // EMI burden (0-30 points)
    const emiPct = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;
    if (emiPct <= 30) {
      score += 30;
      details.push(`✅ EMI burden: ₹${totalEMI.toLocaleString("en-IN")}/mo (${emiPct.toFixed(0)}% of income)`);
    } else if (emiPct <= 50) {
      score += 15;
      details.push(`⚠️ EMI burden: ₹${totalEMI.toLocaleString("en-IN")}/mo (${emiPct.toFixed(0)}% of income)`);
    } else {
      details.push(`❌ EMI burden: ₹${totalEMI.toLocaleString("en-IN")}/mo (${emiPct.toFixed(0)}% of income) — too high`);
    }

    // Number of loans (0-20 points)
    if (debtCount <= 1) {
      score += 20;
    } else if (debtCount <= 3) {
      score += 10;
      details.push(`⚠️ ${debtCount} active loans — consider consolidating`);
    } else {
      details.push(`❌ ${debtCount} active loans — high complexity, consider debt consolidation`);
    }
  }

  score = Math.min(100, Math.max(0, score));

  return {
    id: "debt",
    label: "Debt",
    icon: "🏦",
    score,
    weight: 12,
    status: getScoreStatus(score),
    value: debtCount === 0 ? "Debt-free" : `${debtToIncome.toFixed(0)}% DTI`,
    target: "DTI under 35%",
    tip: debtToIncome > 35
      ? "Use the debt avalanche method: pay highest-interest loans first while paying minimum on others"
      : "Stay debt-free by avoiding unnecessary loans and paying credit cards in full",
    details,
  };
}

function computeEmergencyScore(
  emergencyMonths: number,
  emergencySaved: number,
  monthlyExpense: number,
): SubScore {
  let score = 0;
  const details: string[] = [];

  if (emergencyMonths >= 12) {
    score = 100;
    details.push(`✅ Emergency fund: ${emergencyMonths.toFixed(1)} months — excellent!`);
  } else if (emergencyMonths >= 9) {
    score = 85;
    details.push(`✅ Emergency fund: ${emergencyMonths.toFixed(1)} months — strong`);
  } else if (emergencyMonths >= 6) {
    score = 70;
    details.push(`⚠️ Emergency fund: ${emergencyMonths.toFixed(1)} months — good but aim for 12`);
  } else if (emergencyMonths >= 3) {
    score = 40;
    details.push(`⚠️ Emergency fund: ${emergencyMonths.toFixed(1)} months — below 6-month target`);
  } else if (emergencyMonths >= 1) {
    score = 20;
    details.push(`❌ Emergency fund: ${emergencyMonths.toFixed(1)} months — dangerously low`);
  } else {
    score = 0;
    details.push(`❌ No emergency fund — extremely vulnerable!`);
  }

  if (monthlyExpense > 0) {
    const target6 = monthlyExpense * 6;
    const target12 = monthlyExpense * 12;
    details.push(`₹${Math.round(emergencySaved).toLocaleString("en-IN")} saved · 6mo target: ₹${Math.round(target6).toLocaleString("en-IN")} · 12mo target: ₹${Math.round(target12).toLocaleString("en-IN")}`);
  }

  return {
    id: "emergency",
    label: "Emergency Fund",
    icon: "🛟",
    score,
    weight: 13,
    status: getScoreStatus(score),
    value: `${emergencyMonths.toFixed(1)} mo`,
    target: "12 months of expenses",
    tip: emergencyMonths < 6
      ? "Build emergency fund to 6 months as your #1 priority — keep it in a separate savings account or liquid fund"
      : "Aim for 12 months coverage for complete financial security",
    details,
  };
}

function computeInsuranceScore(
  hasLife: boolean,
  hasHealth: boolean,
  lifeCover: number,
  minLifeCover: number,
  healthCover: number,
  minHealthCover: number,
  insuranceCount: number,
): SubScore {
  let score = 0;
  const details: string[] = [];

  // Life insurance (0-40 points)
  if (hasLife) {
    if (lifeCover >= minLifeCover) {
      score += 40;
      details.push(`✅ Life cover: ₹${(lifeCover / 100000).toFixed(0)}L (10x income target met)`);
    } else {
      score += 20;
      details.push(`⚠️ Life cover: ₹${(lifeCover / 100000).toFixed(0)}L (target: ₹${(minLifeCover / 100000).toFixed(0)}L)`);
    }
  } else {
    details.push(`❌ No life insurance — critical if anyone depends on your income`);
  }

  // Health insurance (0-40 points)
  if (hasHealth) {
    if (healthCover >= minHealthCover) {
      score += 40;
      details.push(`✅ Health cover: ₹${(healthCover / 100000).toFixed(0)}L`);
    } else {
      score += 20;
      details.push(`⚠️ Health cover: ₹${(healthCover / 100000).toFixed(0)}L (target: ₹${(minHealthCover / 100000).toFixed(0)}L)`);
    }
  } else {
    details.push(`❌ No health insurance — medical emergencies can wipe out savings`);
  }

  // Additional coverage (0-20 points)
  const otherTypes = insuranceCount - (hasLife ? 1 : 0) - (hasHealth ? 1 : 0);
  if (otherTypes > 0) {
    score += Math.min(20, otherTypes * 10);
    details.push(`✅ Additional coverage: ${otherTypes} policy(ies)`);
  }

  // If no income data, give benefit of doubt
  if (insuranceCount === 0 && minLifeCover === 0) {
    score = 50; // neutral
    details.push(`ℹ️ No insurance data available`);
  }

  score = Math.min(100, Math.max(0, score));

  return {
    id: "insurance",
    label: "Insurance",
    icon: "🛡️",
    score,
    weight: 10,
    status: getScoreStatus(score),
    value: insuranceCount === 0 ? "No cover" : `${insuranceCount} policies`,
    target: "Life (10x income) + Health (₹10L+)",
    tip: !hasLife
      ? "Get term insurance immediately — it's the cheapest way to protect your family"
      : !hasHealth
      ? "Get health insurance (₹10L+ family floater) — medical costs are the #1 cause of bankruptcy"
      : "Review coverage annually and increase as income grows",
    details,
  };
}

function computeGoalScore(
  goals: { name: string; category: string; progress: number; onTrack: boolean }[],
  totalGoals: number,
): SubScore {
  let score = 0;
  const details: string[] = [];

  if (totalGoals === 0) {
    score = 30; // neutral-low — having goals is important
    details.push(`ℹ️ No financial goals set — create goals to give direction to your savings`);
  } else {
    // Average progress (0-50 points)
    const avgProgress = goals.reduce((s, g) => s + Math.min(100, g.progress), 0) / totalGoals;
    if (avgProgress >= 75) {
      score += 50;
      details.push(`✅ Average goal progress: ${avgProgress.toFixed(0)}%`);
    } else if (avgProgress >= 50) {
      score += 35;
      details.push(`⚠️ Average goal progress: ${avgProgress.toFixed(0)}%`);
    } else if (avgProgress >= 25) {
      score += 20;
      details.push(`⚠️ Average goal progress: ${avgProgress.toFixed(0)}% — needs acceleration`);
    } else {
      score += 10;
      details.push(`❌ Average goal progress: ${avgProgress.toFixed(0)}% — far from targets`);
    }

    // Goals on track (0-30 points)
    const onTrackCount = goals.filter(g => g.onTrack).length;
    const onTrackPct = (onTrackCount / totalGoals) * 100;
    if (onTrackPct >= 80) {
      score += 30;
      details.push(`✅ ${onTrackCount}/${totalGoals} goals on track`);
    } else if (onTrackPct >= 50) {
      score += 20;
      details.push(`⚠️ ${onTrackCount}/${totalGoals} goals on track`);
    } else {
      score += 10;
      details.push(`❌ Only ${onTrackCount}/${totalGoals} goals on track`);
    }

    // Has emergency goal (0-20 points)
    const hasEmergency = goals.some(g => g.category === "Emergency");
    if (hasEmergency) {
      score += 20;
      details.push(`✅ Emergency fund goal set`);
    } else {
      details.push(`⚠️ No emergency fund goal — add one as top priority`);
    }
  }

  score = Math.min(100, Math.max(0, score));

  return {
    id: "goals",
    label: "Goal Progress",
    icon: "🎯",
    score,
    weight: 10,
    status: getScoreStatus(score),
    value: totalGoals === 0 ? "No goals" : `${goals.filter(g => g.onTrack).length}/${totalGoals} on track`,
    target: "All goals on track",
    tip: totalGoals === 0
      ? "Set 3-5 specific financial goals with deadlines — goals give direction to savings"
      : "Prioritize underperforming goals by redirecting discretionary spending",
    details,
  };
}

function computeBudgetScore(
  adherence: number,
  budgetCount: number,
  onTrack: number,
): SubScore {
  let score = 0;
  const details: string[] = [];

  if (budgetCount === 0) {
    score = 40; // neutral — no budgets = no discipline signal
    details.push(`ℹ️ No budgets set — create category budgets to control spending`);
  } else {
    // Adherence (0-70 points)
    if (adherence >= 90) {
      score += 70;
      details.push(`✅ Budget adherence: ${adherence.toFixed(0)}% — excellent discipline`);
    } else if (adherence >= 70) {
      score += 50;
      details.push(`⚠️ Budget adherence: ${adherence.toFixed(0)}% — some categories overspent`);
    } else if (adherence >= 50) {
      score += 30;
      details.push(`⚠️ Budget adherence: ${adherence.toFixed(0)}% — half of budgets exceeded`);
    } else {
      score += 10;
      details.push(`❌ Budget adherence: ${adherence.toFixed(0)}% — most budgets exceeded`);
    }

    // Coverage (0-30 points) — having budgets for major categories
    if (budgetCount >= 8) {
      score += 30;
      details.push(`✅ ${budgetCount} budget categories tracked`);
    } else if (budgetCount >= 5) {
      score += 20;
      details.push(`⚠️ ${budgetCount} budget categories — add more for complete coverage`);
    } else {
      score += 10;
      details.push(`⚠️ Only ${budgetCount} budget categories — too few for effective tracking`);
    }

    details.push(`${onTrack}/${budgetCount} categories within budget this month`);
  }

  score = Math.min(100, Math.max(0, score));

  return {
    id: "budget",
    label: "Budget",
    icon: "📊",
    score,
    weight: 10,
    status: getScoreStatus(score),
    value: budgetCount === 0 ? "No budgets" : `${adherence.toFixed(0)}%`,
    target: "90%+ adherence",
    tip: budgetCount === 0
      ? "Create budgets for your top 5 spending categories — awareness is the first step to control"
      : adherence < 80
      ? "Review overspent categories weekly and adjust limits or cut spending"
      : "Great discipline! Review budgets monthly to optimize allocation",
    details,
  };
}

// ─── Helpers ──────────────────────────────────────────────────

function getScoreStatus(score: number): "excellent" | "good" | "fair" | "poor" | "critical" {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  if (score >= 20) return "poor";
  return "critical";
}

function computeExpectedProgress(deadline: string): number {
  const end = new Date(deadline);
  const now = new Date();
  if (end <= now) return 1; // Past deadline = should be 100%
  // Assume goal was created ~1 year ago (rough estimate)
  const start = new Date(Math.max(now.getTime() - 365 * 86400000, end.getTime() - 730 * 86400000));
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.max(0, Math.min(1, elapsed / total));
}
