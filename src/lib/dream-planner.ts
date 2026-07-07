/**
 * ═══════════════════════════════════════════════════════════════
 * DREAM PLANNER ENGINE — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Users define financial dreams (House, Car, Travel, Retirement, etc.)
 * and the engine calculates:
 *   - Monthly investment required
 *   - Timeline to achieve
 *   - Risk analysis
 *   - Progress tracking against current savings
 *
 * Uses BigInt precision math for all monetary calculations.
 * ═══════════════════════════════════════════════════════════════
 */

import { sumMoneyToNumber } from "./finance-math";
import { num } from "./format";
import { currentMonthKey, monthlyFlow, lastNMonths } from "./data-utils";
import type {
  TransactionRow, AccountRow, InvestmentRow, DebtRow,
  BillRow, GoalRow,
} from "./types";

// ─── Types ────────────────────────────────────────────────────

export type DreamCategory = "home" | "car" | "travel" | "education" | "retirement" | "business" | "gadget" | "wedding" | "custom";

export type DreamInput = {
  name: string;
  category: DreamCategory;
  targetAmount: number;    // in INR
  timelineYears: number;   // how many years to achieve
  priority: "must" | "should" | "nice";
};

export type DreamPlan = {
  dream: DreamInput;
  monthlyInvestment: number;
  totalInvested: number;
  expectedReturns: number;
  yearsToAchieve: number;
  riskLevel: "low" | "medium" | "high";
  riskNote: string;
  progressPct: number;
  monthlySurplusAvailable: number;
  affordability: "affordable" | "stretch" | "difficult";
  strategy: string[];
  milestones: { year: number; accumulated: number; pct: number }[];
};

export type DreamPlannerReport = {
  dreams: DreamPlan[];
  totalMonthlyRequired: number;
  totalMonthlyAvailable: number;
  overallAffordability: "all achievable" | "needs optimization" | "reconsider priorities";
  topRecommendation: string;
  netWorth: number;
  monthlySavings: number;
};

// ─── Dream Presets ────────────────────────────────────────────

export const DREAM_PRESETS: { category: DreamCategory; label: string; icon: string; defaultAmount: number; defaultYears: number; color: string }[] = [
  { category: "home", label: "Dream Home", icon: "🏠", defaultAmount: 5000000, defaultYears: 10, color: "#6366f1" },
  { category: "car", label: "Dream Car", icon: "🚗", defaultAmount: 1500000, defaultYears: 3, color: "#f59e0b" },
  { category: "travel", label: "World Tour", icon: "✈️", defaultAmount: 800000, defaultYears: 2, color: "#0ea5e9" },
  { category: "education", label: "Child Education", icon: "🎓", defaultAmount: 2500000, defaultYears: 15, color: "#14b8a6" },
  { category: "retirement", label: "Early Retirement", icon: "🏖️", defaultAmount: 30000000, defaultYears: 20, color: "#8b5cf6" },
  { category: "business", label: "Start Business", icon: "💼", defaultAmount: 2000000, defaultYears: 5, color: "#ef4444" },
  { category: "gadget", label: "Premium Gadget", icon: "📱", defaultAmount: 150000, defaultYears: 1, color: "#f97316" },
  { category: "wedding", label: "Dream Wedding", icon: "💒", defaultAmount: 1000000, defaultYears: 3, color: "#ec4899" },
];

// ─── Constants ────────────────────────────────────────────────

const EXPECTED_RETURN_RATES: Record<DreamCategory, number> = {
  home: 0.08,
  car: 0.07,
  travel: 0.06,
  education: 0.10,
  retirement: 0.12,
  business: 0.15,
  gadget: 0.05,
  wedding: 0.07,
  custom: 0.08,
};

const INFLATION_RATE = 0.06;

// ─── Core Engine ──────────────────────────────────────────────

function calculateSIP(
  targetAmount: number,
  annualReturn: number,
  years: number
): number {
  if (years <= 0) return targetAmount;
  const monthlyRate = annualReturn / 12;
  if (monthlyRate === 0) return targetAmount / (years * 12);
  const months = years * 12;
  const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  return targetAmount / factor;
}

function calculateFutureValue(
  monthlyInvestment: number,
  annualReturn: number,
  years: number
): number {
  const monthlyRate = annualReturn / 12;
  const months = years * 12;
  if (monthlyRate === 0) return monthlyInvestment * months;
  return monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

function calculateInflationAdjusted(amount: number, years: number): number {
  return amount * Math.pow(1 + INFLATION_RATE, years);
}

export function planDream(
  dream: DreamInput,
  monthlySavings: number,
  netWorth: number
): DreamPlan {
  const annualReturn = EXPECTED_RETURN_RATES[dream.category];
  const inflationAdjustedTarget = calculateInflationAdjusted(dream.targetAmount, dream.timelineYears);

  // Monthly SIP required
  const monthlyInvestment = calculateSIP(inflationAdjustedTarget, annualReturn, dream.timelineYears);

  // Total amount invested over the period
  const totalInvested = monthlyInvestment * dream.timelineYears * 12;
  const expectedReturns = inflationAdjustedTarget - totalInvested;

  // Risk level based on timeline and category
  const riskLevel: "low" | "medium" | "high" =
    dream.timelineYears >= 10 ? "low" :
    dream.timelineYears >= 5 ? "medium" : "high";

  const riskNotes: Record<string, string> = {
    low: "Long timeline allows compounding to work. Equity-heavy portfolio recommended.",
    medium: "Moderate timeline — balanced mix of equity and debt funds suggested.",
    high: "Short timeline means lower returns expected. Consider safer options or extend timeline.",
  };

  // Affordability
  const affordability: "affordable" | "stretch" | "difficult" =
    monthlyInvestment <= monthlySavings * 0.3 ? "affordable" :
    monthlyInvestment <= monthlySavings * 0.6 ? "stretch" : "difficult";

  // Progress — how much of the target is already covered by net worth
  const progressPct = Math.min(100, (netWorth / dream.targetAmount) * 100);

  // Strategy recommendations
  const strategy: string[] = [];
  if (dream.category === "retirement") {
    strategy.push("Maximize PPF & EPF contributions for tax benefits");
    strategy.push("Start NPS for additional retirement tax deduction");
    strategy.push("Allocate 70%+ to equity index funds for long-term growth");
  } else if (dream.category === "home") {
    strategy.push("Build separate down payment fund (20% of property value)");
    strategy.push("Invest in balanced advantage funds for moderate growth");
    strategy.push("Keep 6-month EMI as buffer before taking home loan");
  } else if (dream.category === "education") {
    strategy.push("Consider Sukanya Samriddhi for girl child");
    strategy.push("Use equity SIP for 10+ year horizons");
    strategy.push("Shift to debt funds 3 years before needed");
  } else if (dream.category === "car") {
    strategy.push("Use short-term debt funds or RD for car fund");
    strategy.push("Avoid long-term EMI — save upfront for maximum benefit");
  } else if (dream.category === "travel") {
    strategy.push("Use a travel fund with liquid/money market funds");
    strategy.push("Book in advance for 20-30% savings on travel");
  } else {
    strategy.push(`Invest ₹${Math.round(monthlyInvestment).toLocaleString("en-IN")}/month via SIP`);
    strategy.push("Review progress quarterly and adjust if needed");
  }

  if (affordability === "difficult") {
    strategy.push("⚠️ Consider extending timeline or reducing target amount");
  }
  if (affordability === "stretch") {
    strategy.push("Optimize spending to free up more for this dream");
  }

  // Milestones
  const milestones: { year: number; accumulated: number; pct: number }[] = [];
  for (let y = 1; y <= dream.timelineYears; y++) {
    const fv = calculateFutureValue(monthlyInvestment, annualReturn, y);
    milestones.push({
      year: y,
      accumulated: Math.round(fv),
      pct: Math.min(100, (fv / inflationAdjustedTarget) * 100),
    });
  }

  return {
    dream,
    monthlyInvestment: Math.round(monthlyInvestment),
    totalInvested: Math.round(totalInvested),
    expectedReturns: Math.round(expectedReturns),
    yearsToAchieve: dream.timelineYears,
    riskLevel,
    riskNote: riskNotes[riskLevel],
    progressPct,
    monthlySurplusAvailable: monthlySavings,
    affordability,
    strategy,
    milestones,
  };
}

export function generateDreamPlannerReport(data: {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
}): DreamPlannerReport {
  const { txns, accounts, investments, debts, goals } = data;
  const months = lastNMonths(3);
  const flow = monthlyFlow(txns, months);

  const avgSavings = flow.length > 0
    ? flow.reduce((s, m) => s + m.savings, 0) / flow.length
    : 0;

  const liquidAssets = sumMoneyToNumber(accounts.map(a => a.balance));
  const investmentValue = sumMoneyToNumber(investments.map(i => i.currentValue));
  const totalDebt = sumMoneyToNumber(debts.map(d => d.outstanding));
  const netWorth = liquidAssets + investmentValue - totalDebt;

  // Auto-generate dreams from existing goals
  const existingDreams: DreamInput[] = goals
    .filter(g => num(g.target) > 0)
    .map(g => {
      const cat = mapGoalCategory(g.category);
      const remaining = num(g.target) - num(g.saved);
      const yearsEstimate = avgSavings > 0 ? Math.max(1, Math.ceil(remaining / (avgSavings * 12))) : 5;
      return {
        name: g.name,
        category: cat,
        targetAmount: remaining,
        timelineYears: Math.min(yearsEstimate, 30),
        priority: num(g.saved) / num(g.target) > 0.5 ? "must" : "should",
      };
    });

  const dreams = existingDreams.map(d => planDream(d, avgSavings, netWorth));

  const totalMonthlyRequired = dreams.reduce((s, d) => s + d.monthlyInvestment, 0);

  const overallAffordability: "all achievable" | "needs optimization" | "reconsider priorities" =
    totalMonthlyRequired <= avgSavings * 0.5 ? "all achievable" :
    totalMonthlyRequired <= avgSavings ? "needs optimization" : "reconsider priorities";

  let topRecommendation = "Start by funding your highest-priority dreams first";
  if (overallAffordability === "needs optimization") {
    topRecommendation = "Reduce lower-priority dream targets or extend timelines to fit your budget";
  } else if (overallAffordability === "reconsider priorities") {
    topRecommendation = "Your dreams exceed current capacity — focus on top 2-3 priorities and revisit others later";
  }
  if (dreams.length === 0) {
    topRecommendation = "Add your first dream below to start planning your financial future!";
  }

  return {
    dreams,
    totalMonthlyRequired: Math.round(totalMonthlyRequired),
    totalMonthlyAvailable: Math.round(avgSavings),
    overallAffordability,
    topRecommendation,
    netWorth,
    monthlySavings: Math.round(avgSavings),
  };
}

function mapGoalCategory(cat: string): DreamCategory {
  const map: Record<string, DreamCategory> = {
    Emergency: "custom",
    Travel: "travel",
    Home: "home",
    Car: "car",
    Education: "education",
    Retirement: "retirement",
    Wedding: "wedding",
    Business: "business",
    Gadget: "gadget",
  };
  return map[cat] || "custom";
}
