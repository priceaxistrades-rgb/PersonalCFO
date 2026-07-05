/**
 * ═══════════════════════════════════════════════════════════════════
 * PRECISION FINANCIAL MATH ENGINE — PersonalCFO
 * ═══════════════════════════════════════════════════════════════════
 *
 * HARD RULE: NEVER use JavaScript `Number` for currency arithmetic.
 * IEEE 754 double-precision floats CANNOT represent 0.1 + 0.2 = 0.3.
 *
 * All monetary amounts are stored as BigInt in PAISE (scale = 100).
 * This guarantees zero accumulation errors for sums, subtractions,
 * and percentage calculations.
 *
 * Scale: 100 = 2 decimal places (Indian Paise)
 * DB:    PostgreSQL NUMERIC(14,2) → string ↔ BigInt(paise) ↔ display
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── Constants ──────────────────────────────────────────────────

/** Scale factor: 1 Rupee = 100 Paise */
const SCALE = 100n;

/**
 * Basis-point divisor for percentage operations.
 * If `amount` is in paise and `rate` is in basis points (1 bps = 0.01%),
 * then: result_paise = (amount_paise * rate_bps) / BPS_DIVISOR
 *
 * Verification:
 *   ₹1,000 = 100_000 paise, rate = 5% = 500 bps
 *   result = (100_000 * 500) / 10_000 = 5_000 paise = ₹50  ✓
 */
const BPS_DIVISOR = 10_000n;

// ─── Core Conversion ────────────────────────────────────────────

/**
 * Convert a monetary string/number to BigInt paise.
 * Handles: "485000", "485000.00", "8.6", 0, null, undefined
 */
export function toPaise(value: string | number | null | undefined): bigint {
  if (value === null || value === undefined) return 0n;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0n;
    // toFixed(2) prevents floating-point artefacts like 0.30000000000000004
    return strToPaise(value.toFixed(2));
  }
  return strToPaise(value);
}

function strToPaise(str: string): bigint {
  const trimmed = str.trim();
  if (trimmed === "" || trimmed === "-") return 0n;

  const negative = trimmed.startsWith("-");
  const abs = negative ? trimmed.slice(1) : trimmed;

  const [intPart = "0", decPart = ""] = abs.split(".");
  // Pad or truncate to exactly 2 decimal places (paise precision)
  const paddedDec = (decPart + "00").slice(0, 2);

  // Remove leading zeros from integer part to avoid BigInt parsing issues
  const cleanInt = intPart.replace(/^0+/, "") || "0";

  const result = BigInt(cleanInt) * SCALE + BigInt(paddedDec);
  return negative ? -result : result;
}

/**
 * Convert BigInt paise to a string suitable for PostgreSQL NUMERIC column.
 * Strips trailing zeros: 48500000n → "485000", 86n → "0.86", 520n → "5.2"
 */
export function fromPaise(paise: bigint): string {
  if (paise === 0n) return "0";
  const negative = paise < 0n;
  const abs = negative ? -paise : paise;
  const rupees = abs / SCALE;
  const paisePart = abs % SCALE;

  if (paisePart === 0n) {
    return negative ? `-${rupees}` : String(rupees);
  }

  const paiseStr = String(paisePart).padStart(2, "0");
  // Strip trailing zeros from paise: "20" → "2", "05" → "05"
  const trimmedPaise = paiseStr.replace(/0+$/, "");
  const result = `${rupees}.${trimmedPaise}`;
  return negative ? `-${result}` : result;
}

/**
 * Convert paise to a JavaScript number for DISPLAY ONLY.
 * Never use the result for further arithmetic — always use BigInt functions.
 */
export function paiseToNumber(paise: bigint): number {
  const rupees = paise / SCALE;
  const p = paise % SCALE;
  return Number(rupees) + Number(p) / 100;
}

// ─── Safe Display Conversion ────────────────────────────────────

/**
 * Convert a DB monetary value to a JavaScript number for DISPLAY ONLY.
 * This is the safe replacement for `parseFloat()` in UI formatting.
 *
 * IMPORTANT: Never use the result for financial calculations.
 * Use `addMoney()`, `subtractMoney()`, `sumMoney()` instead.
 */
export function moneyToNumber(value: string | number | null | undefined): number {
  return paiseToNumber(toPaise(value));
}

// ─── Arithmetic Operations ──────────────────────────────────────

/** Add two monetary amounts. Returns a string for DB storage. */
export function addMoney(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): string {
  return fromPaise(toPaise(a) + toPaise(b));
}

/** Subtract b from a. Returns a string for DB storage. */
export function subtractMoney(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): string {
  return fromPaise(toPaise(a) - toPaise(b));
}

/**
 * Sum an array of monetary amounts using BigInt accumulation.
 * Zero accumulation error — safe for thousands of transactions.
 */
export function sumMoney(amounts: (string | number | null | undefined)[]): string {
  let total = 0n;
  for (const a of amounts) {
    total += toPaise(a);
  }
  return fromPaise(total);
}

/**
 * Sum an array of monetary amounts and return a JavaScript number for display.
 * This is the safe replacement for `reduce((s, x) => s + num(x.amount), 0)`.
 */
export function sumMoneyToNumber(amounts: (string | number | null | undefined)[]): number {
  let total = 0n;
  for (const a of amounts) {
    total += toPaise(a);
  }
  return paiseToNumber(total);
}

// ─── Percentage Operations ──────────────────────────────────────

/**
 * Apply a percentage rate to a monetary amount.
 * Rate is expressed in PERCENT (e.g., 5 for 5%, 12.5 for 12.5%).
 *
 * Uses scaled integer math internally — no floating-point errors.
 *
 * Example: applyPercent("100000", 5) → "5000"  (₹1,000 * 5% = ₹50)
 */
export function applyPercent(
  amount: string | number | null | undefined,
  ratePercent: number,
): string {
  const paise = toPaise(amount);
  // Convert rate to basis points (1% = 100 bps)
  const bps = BigInt(Math.round(ratePercent * 100));
  const result = (paise * bps) / BPS_DIVISOR;
  return fromPaise(result);
}

/**
 * Apply a percentage rate and return a JavaScript number for display.
 */
export function applyPercentToNumber(
  amount: string | number | null | undefined,
  ratePercent: number,
): number {
  return paiseToNumber(toPaise(applyPercent(amount, ratePercent)));
}

// ─── Comparison & Utility ───────────────────────────────────────

/** Compare two money amounts: -1 if a < b, 0 if equal, 1 if a > b */
export function compareMoney(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): number {
  const pa = toPaise(a);
  const pb = toPaise(b);
  if (pa < pb) return -1;
  if (pa > pb) return 1;
  return 0;
}

/** Check if a monetary amount is zero or null/undefined */
export function isZeroMoney(value: string | number | null | undefined): boolean {
  return toPaise(value) === 0n;
}

/** Check if a monetary amount is positive (> 0) */
export function isPositiveMoney(value: string | number | null | undefined): boolean {
  return toPaise(value) > 0n;
}

/** Get the absolute value of a monetary amount */
export function absMoney(value: string | number | null | undefined): string {
  const p = toPaise(value);
  return fromPaise(p < 0n ? -p : p);
}

/** Get the maximum of two monetary amounts */
export function maxMoney(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): string {
  const pa = toPaise(a);
  const pb = toPaise(b);
  return fromPaise(pa > pb ? pa : pb);
}

/** Get the minimum of two monetary amounts */
export function minMoney(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): string {
  const pa = toPaise(a);
  const pb = toPaise(b);
  return fromPaise(pa < pb ? pa : pb);
}

/** Cap a monetary amount at a maximum value */
export function capMoney(
  value: string | number | null | undefined,
  maximum: string | number | null | undefined,
): string {
  return maxMoney("0", minMoney(value, maximum));
}

/**
 * Compute CAGR using BigInt for the core ratio, with floating-point
 * for the power function (unavoidable — Math.pow doesn't support BigInt).
 *
 * The CAGR result is inherently approximate (market data is noisy),
 * so floating-point here is acceptable. The key difference from the
 * old implementation is that the start/end VALUES are precisely computed.
 */
export function computeCagr(
  startValue: string | number | null | undefined,
  endValue: string | number | null | undefined,
  years: number,
): number | null {
  const sv = toPaise(startValue);
  const ev = toPaise(endValue);
  if (sv <= 0n || ev <= 0n || years <= 0) return null;
  // Convert to precise numbers for the power calculation only
  const start = paiseToNumber(sv);
  const end = paiseToNumber(ev);
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}
