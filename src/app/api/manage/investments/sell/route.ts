/**
 * ═══════════════════════════════════════════════════════════════
 * ATOMIC SELL / REDEEM ENDPOINT — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Handles both full and partial sells in a single DB transaction.
 * This fixes:
 *   - H3: Non-atomic sell (DELETE + transaction INSERT were separate)
 *   - Ghost 0-value records on full sell
 *   - "Investment not found" errors when retrying after partial failure
 *
 * Full sell → DELETE investment + INSERT transaction
 * Partial sell → UPDATE investment + INSERT transaction
 * ═══════════════════════════════════════════════════════════════
 */

import { db } from "@/db";
import { investments, transactions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, sellSchema } from "@/lib/validation";
import { apiHandler, apiSuccess, apiError } from "@/lib/api-utils";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const POST = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const raw = await req.json();
    const result = validate(sellSchema, raw);
    if (!result.ok) return result.error;
    const s = result.data;

    // ─── 1. Verify ownership & fetch current state ────────────────
    const [existing] = await db
      .select()
      .from(investments)
      .where(and(eq(investments.id, s.investmentId), eq(investments.userId, session.userId)));

    if (!existing) {
      return apiError("Investment not found or you don't have permission to sell it", 404);
    }

    // ─── 2. Calculate post-sell values ────────────────────────────
    const currentUnits = Number(existing.units) || 0;
    const currentInvested = Number(existing.invested) || 0;
    const currentValue = Number(existing.currentValue) || 0;
    const effectiveValue = currentValue > 0 ? currentValue : currentInvested;
    const hasUnits = currentUnits > 0;

    let isFullSell: boolean;
    let newInvested: string;
    let newCurrentValue: string;
    let newUnits: string | null;
    let saleAmount: string;
    let saleNote: string;

    if (hasUnits) {
      // Unit-based sell (Stocks, MutualFunds)
      const sellUnits = s.sellUnits ?? 0;
      if (sellUnits <= 0) return apiError("Sell units must be positive", 400);
      if (sellUnits > currentUnits) return apiError(`You only have ${currentUnits} units`, 400);

      const sellPrice = s.sellPrice ?? 0;
      if (sellPrice < 0) return apiError("Sell price cannot be negative", 400);

      const remainingUnits = Number((currentUnits - sellUnits).toFixed(4));
      isFullSell = remainingUnits <= 0;

      const investedPerUnit = currentInvested / (currentUnits || 1);
      const newInvestedNum = isFullSell ? 0 : Number((investedPerUnit * remainingUnits).toFixed(2));
      const newCurrentValueNum = isFullSell ? 0 : Number((sellPrice * remainingUnits).toFixed(2));

      newInvested = newInvestedNum.toFixed(2);
      newCurrentValue = newCurrentValueNum.toFixed(2);
      newUnits = isFullSell ? null : remainingUnits.toString();
      saleAmount = Number((sellUnits * sellPrice).toFixed(2)).toFixed(2);
      saleNote = `Sold ${sellUnits} units of ${existing.name}${isFullSell ? " (FULL EXIT)" : ` (${remainingUnits} units remaining)`} @ ₹${sellPrice}/unit`;
    } else {
      // Amount-based sell (FD, PPF, EPF, RealEstate, etc.)
      const sellAmount = s.sellAmount ?? 0;
      if (sellAmount <= 0) return apiError("Sell amount must be positive", 400);
      if (sellAmount > effectiveValue) return apiError(`Current value is only ₹${effectiveValue.toFixed(2)}`, 400);

      isFullSell = sellAmount >= effectiveValue;
      const sellPortion = sellAmount / effectiveValue;

      const newInvestedNum = isFullSell ? 0 : Number((currentInvested * (1 - sellPortion)).toFixed(2));
      const newCurrentValueNum = isFullSell ? 0 : Number((effectiveValue * (1 - sellPortion)).toFixed(2));

      newInvested = newInvestedNum.toFixed(2);
      newCurrentValue = newCurrentValueNum.toFixed(2);
      newUnits = null;
      saleAmount = sellAmount.toFixed(2);
      saleNote = `Sold ${isFullSell ? "full" : "partial"} holding of ${existing.name} for ₹${saleAmount}`;
    }

    // ─── 3. Execute atomically in a transaction ───────────────────
    await db.transaction(async (tx) => {
      // Update or delete the investment
      if (isFullSell) {
        await tx
          .delete(investments)
          .where(and(eq(investments.id, existing.id), eq(investments.userId, session.userId)));
        log.info("Investment deleted (full sell)", { id: existing.id, name: existing.name });
      } else {
        await tx
          .update(investments)
          .set({
            invested: newInvested,
            currentValue: newCurrentValue,
            units: newUnits,
            updatedAt: new Date(),
          })
          .where(and(eq(investments.id, existing.id), eq(investments.userId, session.userId)));
        log.info("Investment updated (partial sell)", { id: existing.id, name: existing.name, newInvested, newCurrentValue, newUnits });
      }

      // Record the sale transaction
      await tx.insert(transactions).values({
        userId: session.userId,
        type: "income",
        category: "Investment Sale",
        amount: saleAmount,
        txnDate: new Date().toISOString().split("T")[0],
        accountId: s.accountId ?? null,
        note: saleNote,
      });
    });

    // ─── 4. Audit log ─────────────────────────────────────────────
    writeAuditLog({
      userId: session.userId,
      action: "sell",
      table: "investments",
      recordId: existing.id,
      changes: {
        name: existing.name,
        type: existing.type,
        saleAmount,
        isFullSell,
        ...(hasUnits ? { sellUnits: s.sellUnits, sellPrice: s.sellPrice } : { sellAmount: s.sellAmount }),
      },
    });

    return apiSuccess({
      isFullSell,
      saleAmount,
      message: isFullSell
        ? `Fully sold ${existing.name} — proceeds ₹${saleAmount} recorded as income`
        : `Partial sell of ${existing.name} — ₹${saleAmount} recorded as income`,
    });
  } catch (err) {
    log.error("Sell investment failed", err);
    return apiError("Failed to process sale", 500, undefined, err);
  }
});
