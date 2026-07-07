import { db } from "@/db";
import { investments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { validate, investmentCreateSchema, investmentUpdateSchema, idDeleteSchema } from "@/lib/validation";
import { apiHandler, apiSuccess, apiError } from "@/lib/api-utils";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const GET = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const rows = await db.select().from(investments).where(eq(investments.userId, session.userId)).orderBy(investments.id);
    log.info("Fetched investments", { count: rows.length });
    return apiSuccess({ rows });
  } catch (err) {
    return apiError("Failed to fetch investments", 500, undefined, err);
  }
});

export const POST = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const raw = await req.json();
    const result = validate(investmentCreateSchema, raw);
    if (!result.ok) return result.error;
    const b = result.data;

    // Check for duplicate symbol for same user
    if (b.symbol) {
      const [existing] = await db
        .select({ id: investments.id })
        .from(investments)
        .where(and(eq(investments.userId, session.userId), eq(investments.symbol, b.symbol)))
        .limit(1);
      if (existing) {
        log.warn("Duplicate investment symbol", { symbol: b.symbol, userId: session.userId });
        return apiError("An investment with this symbol already exists. Use edit to update it.", 409, {
          symbol: "Duplicate symbol for this user",
        });
      }
    }

    const [row] = await db.insert(investments).values({
      userId: session.userId,
      name: b.name,
      type: b.type,
      invested: b.invested,
      currentValue: b.currentValue,
      annualReturn: b.annualReturn,
      symbol: b.symbol ?? null,
      schemeCode: b.schemeCode ?? null,
      units: b.units ?? null,
      startDate: b.startDate ?? null,
      memberId: b.memberId,
    }).returning();

    log.info("Investment created", { id: row.id, name: b.name, type: b.type }); writeAuditLog({ userId: session.userId, action: "create", table: "investments", recordId: row.id, changes: { name: b.name, type: b.type } });
    return apiSuccess({ row });
  } catch (err) {
    // Handle PostgreSQL unique constraint violation
    if (err instanceof Error && err.message.includes("investments_user_symbol_idx")) {
      return apiError("An investment with this symbol already exists.", 409);
    }
    return apiError("Failed to create investment", 500, undefined, err);
  }
});

export const PATCH = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const raw = await req.json();
    const result = validate(investmentUpdateSchema, raw);
    if (!result.ok) return result.error;
    const { id, ...updates } = result.data;

    // Verify ownership before update
    const [existing] = await db
      .select()
      .from(investments)
      .where(and(eq(investments.id, id), eq(investments.userId, session.userId)));

    if (!existing) {
      return apiError("Investment not found or you don't have permission to edit it", 404);
    }

    const safeUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.type !== undefined) safeUpdates.type = updates.type;
    if (updates.invested !== undefined) safeUpdates.invested = updates.invested;
    if (updates.currentValue !== undefined) safeUpdates.currentValue = updates.currentValue;
    if (updates.annualReturn !== undefined) safeUpdates.annualReturn = updates.annualReturn;
    if (updates.symbol !== undefined) safeUpdates.symbol = updates.symbol;
    if (updates.schemeCode !== undefined) safeUpdates.schemeCode = updates.schemeCode;
    if (updates.units !== undefined) safeUpdates.units = updates.units;
    if (updates.startDate !== undefined) safeUpdates.startDate = updates.startDate;
    if (updates.memberId !== undefined) safeUpdates.memberId = updates.memberId;

    const result_update = await db
      .update(investments)
      .set(safeUpdates)
      .where(and(eq(investments.id, id), eq(investments.userId, session.userId)));

    log.info("Investment updated", { id, fields: Object.keys(safeUpdates) }); writeAuditLog({ userId: session.userId, action: "update", table: "investments", recordId: id, changes: safeUpdates });
    return apiSuccess();
  } catch (err) {
    return apiError("Failed to update investment", 500, undefined, err);
  }
});

export const DELETE = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const raw = await req.json();
    const result = validate(idDeleteSchema, raw);
    if (!result.ok) return result.error;
    const { id } = result.data;

    // Verify ownership before delete
    const [existing] = await db
      .select()
      .from(investments)
      .where(and(eq(investments.id, id), eq(investments.userId, session.userId)));

    if (!existing) {
      return apiError("Investment not found or you don't have permission to delete it", 404);
    }

    await db.delete(investments).where(and(eq(investments.id, id), eq(investments.userId, session.userId)));
    log.info("Investment deleted", { id, name: existing.name }); writeAuditLog({ userId: session.userId, action: "delete", table: "investments", recordId: id });
    return apiSuccess();
  } catch (err) {
    return apiError("Failed to delete investment", 500, undefined, err);
  }
});
