/**
 * Indian Tax Calculator — BigInt Precision
 *
 * All monetary calculations use BigInt paise to prevent floating-point drift.
 * The final results are rounded to the nearest rupee (as per Income Tax rules).
 *
 * FY 2024-25 slab rates:
 *   OLD: 0–2.5L=0%, 2.5–5L=5%, 5–10L=20%, >10L=30%
 *   NEW: 0–3L=0%, 3–7L=5%, 7–10L=10%, 10–12L=15%, 12–15L=20%, >15L=30%
 *
 * Section 87A rebate:
 *   OLD: taxable ≤ 5L → tax = 0
 *   NEW: taxable ≤ 7L → tax = 0
 *
 * Cess: 4% on total income tax
 * LTCG (equity): 12.5% on gains above ₹1,25,000
 */

import {
  toPaise,
  fromPaise,
  paiseToNumber,
  applyPercent,
  capMoney,
  maxMoney,
} from "./finance-math";

export type TaxInput = {
  regime: string;
  grossSalary: string;
  businessIncome: string;
  capitalGains: string;
  section80c: string;
  section80d: string;
  hraExemption: string;
  homeLoanInterest: string;
};

/** 50,000 standard deduction in paise */
const STD_DEDUCTION = 5_000_000n; // ₹50,000 × 100

/** Section 80C cap: ₹1,50,000 in paise */
const SEC_80C_CAP = 15_000_000n;

/** Section 80D cap: ₹1,00,000 in paise */
const SEC_80D_CAP = 10_000_000n;

/** Home loan interest cap (old regime): ₹2,00,000 in paise */
const HOME_LOAN_CAP = 20_000_000n;

/** LTCG exemption: ₹1,25,000 in paise */
const LTCG_EXEMPTION = 12_500_000n;

/**
 * Compute slab tax using BigInt arithmetic.
 * Each slab: (min(income, slabLimit) - prevLimit) × rate
 * Rate is in basis points (5% = 500 bps).
 */
function slabTaxPaise(income: bigint, slabs: [limit: bigint, rateBps: bigint][]): bigint {
  let tax = 0n;
  let prevLimit = 0n;
  for (const [limit, rateBps] of slabs) {
    if (income > prevLimit) {
      const taxableInSlab = (income > limit ? limit : income) - prevLimit;
      // tax_paise = (taxable_paise * rate_bps) / 10000
      tax += (taxableInSlab * rateBps) / 10_000n;
      prevLimit = limit;
    } else {
      break;
    }
  }
  return tax;
}

export function estimateTax(p: TaxInput) {
  const grossSalary = toPaise(p.grossSalary);
  const businessIncome = toPaise(p.businessIncome);
  const capitalGains = toPaise(p.capitalGains);
  const section80c = toPaise(p.section80c);
  const section80d = toPaise(p.section80d);
  const hraExemption = toPaise(p.hraExemption);
  const homeLoanInterest = toPaise(p.homeLoanInterest);

  const baseIncome = grossSalary + businessIncome;

  // ─── OLD REGIME ────────────────────────────────────────────
  const deductionsOld =
    STD_DEDUCTION +
    (section80c > SEC_80C_CAP ? SEC_80C_CAP : section80c) +
    (section80d > SEC_80D_CAP ? SEC_80D_CAP : section80d) +
    hraExemption +
    (homeLoanInterest > HOME_LOAN_CAP ? HOME_LOAN_CAP : homeLoanInterest);

  const taxableOld = baseIncome > deductionsOld ? baseIncome - deductionsOld : 0n;

  // Old slab rates in basis points
  const oldSlabs: [bigint, bigint][] = [
    [25_000_000n, 0n],      // 0–2.5L: 0%
    [50_000_000n, 500n],     // 2.5–5L: 5%
    [100_000_000n, 2000n],   // 5–10L: 20%
    [BigInt(2 ** 53), 3000n], // >10L: 30% (use large number as "infinity")
  ];

  let taxOld = slabTaxPaise(taxableOld, oldSlabs);
  // Section 87A rebate: if taxable ≤ 5L, tax = 0
  if (taxableOld <= 50_000_000n) taxOld = 0n;

  // ─── NEW REGIME ────────────────────────────────────────────
  const taxableNew = baseIncome > STD_DEDUCTION ? baseIncome - STD_DEDUCTION : 0n;

  const newSlabs: [bigint, bigint][] = [
    [30_000_000n, 0n],       // 0–3L: 0%
    [70_000_000n, 500n],      // 3–7L: 5%
    [100_000_000n, 1000n],    // 7–10L: 10%
    [120_000_000n, 1500n],    // 10–12L: 15%
    [150_000_000n, 2000n],    // 12–15L: 20%
    [BigInt(2 ** 53), 3000n], // >15L: 30%
  ];

  let taxNew = slabTaxPaise(taxableNew, newSlabs);
  // Section 87A rebate: if taxable ≤ 7L, tax = 0
  if (taxableNew <= 70_000_000n) taxNew = 0n;

  // ─── LTCG Tax ──────────────────────────────────────────────
  const cgAboveExemption = capitalGains > LTCG_EXEMPTION ? capitalGains - LTCG_EXEMPTION : 0n;
  // 12.5% on gains above ₹1,25,000
  const cgTax = (cgAboveExemption * 1250n) / 10_000n;

  // ─── Cess (4%) ─────────────────────────────────────────────
  // Cess = 4% of income tax (not on LTCG)
  const cessOld = (taxOld * 400n) / 10_000n;
  const cessNew = (taxNew * 400n) / 10_000n;

  const totalOld = taxOld + cessOld + cgTax;
  const totalNew = taxNew + cessNew + cgTax;

  // Round to nearest rupee (paise → rupees, rounding)
  const taxOldRounded = paiseToNumber((totalOld + 50n) / 100n * 100n); // round to nearest rupee
  const taxNewRounded = paiseToNumber((totalNew + 50n) / 100n * 100n);
  const cgTaxRounded = paiseToNumber((cgTax + 50n) / 100n * 100n);

  return {
    taxableOld: paiseToNumber(taxableOld),
    taxableNew: paiseToNumber(taxableNew),
    taxOld: Math.round(taxOldRounded),
    taxNew: Math.round(taxNewRounded),
    cgTax: Math.round(cgTaxRounded),
    recommended: totalOld <= totalNew ? "old" : "new",
    selected: p.regime,
    selectedTax: Math.round(p.regime === "old" ? taxOldRounded : taxNewRounded),
  };
}
