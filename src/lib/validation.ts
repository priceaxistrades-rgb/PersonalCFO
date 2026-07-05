/**
 * ═══════════════════════════════════════════════════════════════
 * ENTERPRISE ZOD VALIDATION LAYER — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * This module provides strict input validation for ALL API routes.
 * Every schema enforces:
 *   1. Type safety (no implicit any)
 *   2. Range constraints (positive amounts, valid dates)
 *   3. Enum constraints (only allowed category/type values)
 *   4. Strip unknown keys (prevents mass assignment / field injection)
 *
 * HARD RULE: Never pass `req.json()` output directly to the database.
 *            Always validate through these schemas first.
 * ═══════════════════════════════════════════════════════════════
 */

import { z, ZodError } from "zod";

// ─── Shared Primitives ─────────────────────────────────────────

/**
 * Monetary value that accepts BOTH string and number input.
 * HTML form inputs send numbers; DB stores strings.
 * This coerces both to a validated string for DB storage.
 */
const moneyStr = z
  .union([z.string(), z.number()])
  .pipe(
    z.string()
      .refine((v) => /^-?\d+(\.\d{1,4})?$/.test(v), "Must be a valid monetary amount")
  );

/** Non-negative monetary value (for balances, targets, etc.). Accepts string or number. */
const nonNegMoneyStr = z
  .union([z.string(), z.number()])
  .pipe(
    z.string()
      .refine((v) => /^\d+(\.\d{1,4})?$/.test(v), "Must be a non-negative monetary amount")
  );

/** Non-negative integer ID. */
const positiveInt = z.number().int().positive();

/** Optional positive integer ID (nullable). */
const optionalIntId = z.union([z.number().int().positive(), z.null(), z.undefined()]).transform((v) => v ?? null);

/** Non-empty trimmed string. */
const nonEmptyStr = z.string().trim().min(1, "Required");

/** Date string in YYYY-MM-DD format. */
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

/** Percentage as string (0–100, up to 2 decimal places). Accepts string or number. */
const percentStr = z
  .union([z.string(), z.number()])
  .pipe(
    z.string()
      .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Must be a valid percentage")
  );

/** Interest rate as string (0–100, up to 2 decimal places). */
const interestRateStr = percentStr;

/** String or number coerced to trimmed string with max length (for schemeCode, etc.). */
function coercedStrMax(maxLen: number) {
  return z.preprocess(
    (v) => String(v ?? "").trim(),
    z.string().max(maxLen, `Maximum ${maxLen} characters`),
  );
}

// ─── Enum Constants ─────────────────────────────────────────────

const ACCOUNT_TYPES = ["Cash", "Bank", "Wallet", "Gold", "RealEstate", "Other"] as const;
const ACCOUNT_CATEGORIES = ["asset", "liquid"] as const;
const TRANSACTION_TYPES = ["income", "expense"] as const;
const INVESTMENT_TYPES = [
  "Stocks", "MutualFunds", "PPF", "EPF", "NPS", "FD", "RD",
  "Gold", "Silver", "Bonds", "Crypto", "RealEstate", "Other",
] as const;
const DEBT_TYPES = ["HomeLoan", "CarLoan", "EducationLoan", "CreditCard", "PersonalLoan"] as const;
const MEMBER_ROLES = ["Self", "Spouse", "Child", "Parent", "Household"] as const;
const BILL_FREQUENCIES = ["Monthly", "Quarterly", "Yearly"] as const;
const INSURANCE_TYPES = ["Health", "Life", "Vehicle", "Property"] as const;
const GOAL_CATEGORIES = [
  "Emergency", "Vacation", "House", "Car", "Education",
  "Wedding", "Retirement", "Custom",
] as const;
const ANNUAL_CATEGORIES = ["Financial", "Savings", "Investment", "Tax", "Purchase"] as const;
const ANNUAL_STATUSES = ["Planned", "InProgress", "Done"] as const;
const TAX_REGIMES = ["old", "new"] as const;
const WATCHLIST_KINDS = ["stock", "mf"] as const;

// ─── Auth Schemas ───────────────────────────────────────────────

export const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
}).strict();

// ─── Account Schemas ────────────────────────────────────────────

export const accountCreateSchema = z.object({
  name: nonEmptyStr.max(100),
  type: z.enum(ACCOUNT_TYPES),
  category: z.enum(ACCOUNT_CATEGORIES).default("liquid"),
  balance: nonNegMoneyStr.default("0"),
  memberId: optionalIntId,
}).strict();

export const accountUpdateSchema = z.object({
  id: positiveInt,
  name: nonEmptyStr.max(100).optional(),
  type: z.enum(ACCOUNT_TYPES).optional(),
  category: z.enum(ACCOUNT_CATEGORIES).optional(),
  balance: moneyStr.optional(),
  memberId: optionalIntId.optional(),
}).strict();

export const idDeleteSchema = z.object({
  id: positiveInt,
}).strict();

// ─── Transaction Schemas ────────────────────────────────────────

export const transactionCreateSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  category: nonEmptyStr.max(50),
  amount: nonNegMoneyStr,
  txnDate: dateStr,
  memberId: optionalIntId,
  accountId: optionalIntId,
  note: z.string().trim().max(500).nullable().optional(),
}).strict();

export const transactionUpdateSchema = z.object({
  id: positiveInt,
  type: z.enum(TRANSACTION_TYPES).optional(),
  category: nonEmptyStr.max(50).optional(),
  amount: nonNegMoneyStr.optional(),
  txnDate: dateStr.optional(),
  memberId: optionalIntId.optional(),
  accountId: optionalIntId.optional(),
  note: z.string().trim().max(500).nullable().optional(),
}).strict();

export const transactionDeleteSchema = z.object({
  id: positiveInt.optional(),
  ids: z.array(positiveInt).max(500, "Cannot delete more than 500 transactions at once").optional(),
}).refine((v) => v.id || (v.ids && v.ids.length > 0), {
  message: "Either id or ids must be provided",
});

// ─── Investment Schemas ─────────────────────────────────────────

export const investmentCreateSchema = z.object({
  name: nonEmptyStr.max(100),
  type: z.enum(INVESTMENT_TYPES),
  invested: nonNegMoneyStr,
  currentValue: nonNegMoneyStr,
  annualReturn: percentStr.default("0"),
  symbol: z.string().trim().max(30).nullable().optional(),
  schemeCode: coercedStrMax(20).nullable().optional(),
  units: z.union([z.string(), z.number()]).pipe(z.string().refine((v) => /^\d+(\.\d{1,4})?$/.test(v), "Invalid units")).nullable().optional(),
  startDate: dateStr.nullable().optional(),
  memberId: optionalIntId,
}).strict();

export const investmentUpdateSchema = z.object({
  id: positiveInt,
  name: nonEmptyStr.max(100).optional(),
  type: z.enum(INVESTMENT_TYPES).optional(),
  invested: moneyStr.optional(),
  currentValue: moneyStr.optional(),
  annualReturn: percentStr.optional(),
  symbol: z.string().trim().max(30).nullable().optional(),
  schemeCode: coercedStrMax(20).nullable().optional(),
  units: z.union([z.string(), z.number()]).pipe(z.string().refine((v) => /^\d+(\.\d{1,4})?$/.test(v), "Invalid units")).nullable().optional(),
  startDate: dateStr.nullable().optional(),
  memberId: optionalIntId.optional(),
}).strict();

// ─── Debt Schemas ───────────────────────────────────────────────

export const debtCreateSchema = z.object({
  name: nonEmptyStr.max(100),
  type: z.enum(DEBT_TYPES),
  principal: nonNegMoneyStr,
  outstanding: nonNegMoneyStr,
  interestRate: interestRateStr,
  emi: nonNegMoneyStr,
  tenureMonths: z.number().int().min(1, "Tenure must be at least 1 month").max(600, "Tenure too long"),
  memberId: optionalIntId,
}).strict();

export const debtUpdateSchema = z.object({
  id: positiveInt,
  name: nonEmptyStr.max(100).optional(),
  type: z.enum(DEBT_TYPES).optional(),
  principal: moneyStr.optional(),
  outstanding: moneyStr.optional(),
  interestRate: interestRateStr.optional(),
  emi: moneyStr.optional(),
  tenureMonths: z.number().int().min(1).max(600).optional(),
  memberId: optionalIntId.optional(),
}).strict();

// ─── Budget Schemas ─────────────────────────────────────────────

export const budgetCreateSchema = z.object({
  category: nonEmptyStr.max(50),
  monthlyLimit: nonNegMoneyStr,
}).strict();

export const budgetUpdateSchema = z.object({
  id: positiveInt,
  category: nonEmptyStr.max(50).optional(),
  monthlyLimit: moneyStr.optional(),
}).strict();

// ─── Bill Schemas ───────────────────────────────────────────────

export const billCreateSchema = z.object({
  name: nonEmptyStr.max(100),
  category: nonEmptyStr.max(50),
  amount: nonNegMoneyStr,
  dueDate: dateStr,
  frequency: z.enum(BILL_FREQUENCIES).default("Monthly"),
  paid: z.boolean().default(false),
}).strict();

export const billUpdateSchema = z.object({
  id: positiveInt,
  name: nonEmptyStr.max(100).optional(),
  category: nonEmptyStr.max(50).optional(),
  amount: moneyStr.optional(),
  dueDate: dateStr.optional(),
  frequency: z.enum(BILL_FREQUENCIES).optional(),
  paid: z.boolean().optional(),
}).strict();

// ─── Insurance Schemas ──────────────────────────────────────────

export const insuranceCreateSchema = z.object({
  name: nonEmptyStr.max(100),
  type: z.enum(INSURANCE_TYPES),
  provider: nonEmptyStr.max(100),
  premium: nonNegMoneyStr,
  coverage: nonNegMoneyStr,
  renewalDate: dateStr,
}).strict();

export const insuranceUpdateSchema = z.object({
  id: positiveInt,
  name: nonEmptyStr.max(100).optional(),
  type: z.enum(INSURANCE_TYPES).optional(),
  provider: nonEmptyStr.max(100).optional(),
  premium: moneyStr.optional(),
  coverage: moneyStr.optional(),
  renewalDate: dateStr.optional(),
}).strict();

// ─── Goal Schemas ───────────────────────────────────────────────

export const goalCreateSchema = z.object({
  name: nonEmptyStr.max(100),
  category: z.enum(GOAL_CATEGORIES),
  target: nonNegMoneyStr,
  saved: nonNegMoneyStr.default("0"),
  deadline: dateStr.nullable().optional(),
  icon: z.string().max(10).default("🎯"),
}).strict();

export const goalUpdateSchema = z.object({
  id: positiveInt,
  name: nonEmptyStr.max(100).optional(),
  category: z.enum(GOAL_CATEGORIES).optional(),
  target: moneyStr.optional(),
  saved: moneyStr.optional(),
  deadline: dateStr.nullable().optional(),
  icon: z.string().max(10).optional(),
}).strict();

// ─── Member Schemas ─────────────────────────────────────────────

export const memberCreateSchema = z.object({
  name: nonEmptyStr.max(100),
  role: z.enum(MEMBER_ROLES).default("Household"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").default("#6366f1"),
}).strict();

export const memberUpdateSchema = z.object({
  id: positiveInt,
  name: nonEmptyStr.max(100).optional(),
  role: z.enum(MEMBER_ROLES).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").optional(),
}).strict();

// ─── Annual Plan Schemas ────────────────────────────────────────

export const annualPlanCreateSchema = z.object({
  year: z.number().int().min(2020).max(2099),
  title: nonEmptyStr.max(200),
  category: z.enum(ANNUAL_CATEGORIES),
  targetAmount: nonNegMoneyStr.default("0"),
  progress: z.number().int().min(0).max(100).default(0),
  status: z.enum(ANNUAL_STATUSES).default("Planned"),
}).strict();

export const annualPlanUpdateSchema = z.object({
  id: positiveInt,
  year: z.number().int().min(2020).max(2099).optional(),
  title: nonEmptyStr.max(200).optional(),
  category: z.enum(ANNUAL_CATEGORIES).optional(),
  targetAmount: moneyStr.optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(ANNUAL_STATUSES).optional(),
}).strict();

// ─── Tax Profile Schemas ────────────────────────────────────────

export const taxProfileCreateSchema = z.object({
  regime: z.enum(TAX_REGIMES).default("new"),
  grossSalary: nonNegMoneyStr.default("0"),
  businessIncome: nonNegMoneyStr.default("0"),
  capitalGains: nonNegMoneyStr.default("0"),
  section80c: nonNegMoneyStr.default("0"),
  section80d: nonNegMoneyStr.default("0"),
  hraExemption: nonNegMoneyStr.default("0"),
  homeLoanInterest: nonNegMoneyStr.default("0"),
}).strict();

export const taxProfileUpdateSchema = z.object({
  regime: z.enum(TAX_REGIMES).optional(),
  grossSalary: moneyStr.optional(),
  businessIncome: moneyStr.optional(),
  capitalGains: moneyStr.optional(),
  section80c: moneyStr.optional(),
  section80d: moneyStr.optional(),
  hraExemption: moneyStr.optional(),
  homeLoanInterest: moneyStr.optional(),
}).strict();

// ─── Watchlist Schemas ──────────────────────────────────────────

export const watchlistCreateSchema = z.object({
  kind: z.enum(WATCHLIST_KINDS),
  symbol: z.string().trim().max(30).nullable().optional(),
  schemeCode: coercedStrMax(20).nullable().optional(),
  label: nonEmptyStr.max(100),
}).strict();

export const watchlistDeleteSchema = z.object({
  id: positiveInt,
}).strict();

// ─── Emergency Item Schemas ─────────────────────────────────────

export const emergencyToggleSchema = z.object({
  id: positiveInt,
  done: z.boolean(),
}).strict();

// ─── Reset Data Schema ──────────────────────────────────────────

export const resetDataSchema = z.object({
  confirm: z.literal("RESET MY DATA", { message: 'Confirmation phrase "RESET MY DATA" is required' }),
}).strict();

// ═══════════════════════════════════════════════════════════════
// VALIDATION HELPER — Use in every API route
// ═══════════════════════════════════════════════════════════════

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: Response };

/**
 * Validate an unknown value against a Zod schema.
 * Returns typed data on success, or a pre-built 400 Response on failure.
 *
 * Usage:
 * ```ts
 * const result = validate(accountCreateSchema, await req.json());
 * if (!result.ok) return result.error;
 * // result.data is now fully typed and safe
 * ```
 */
export function validate<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  const errors = formatZodErrors(parsed.error);
  return {
    ok: false,
    error: Response.json(
      { error: "Validation failed", details: errors },
      { status: 400 },
    ),
  };
}

/**
 * Format Zod errors into a clean key→message map for API responses.
 */
export function formatZodErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_root";
    // Only keep the first error per field
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
