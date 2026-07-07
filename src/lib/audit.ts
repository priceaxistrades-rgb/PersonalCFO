/**
 * ═══════════════════════════════════════════════════════════════
 * AUDIT LOG — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Immutable record of financial data changes.
 * Every mutation (create/update/delete/sell) is logged with the
 * user ID, affected table/record, and a JSON diff of changes.
 * ═══════════════════════════════════════════════════════════════
 */

import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { logger } from "./logger";

export type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "sell" | "import" | "sync";

/**
 * Write an audit log entry. Fire-and-forget — never blocks the main operation.
 * If logging fails, we just log the error (never throw).
 */
export function writeAuditLog(params: {
  userId: number;
  action: AuditAction;
  table: string;
  recordId?: number | null;
  changes?: Record<string, unknown> | null;
  ip?: string | null;
}): void {
  // Fire-and-forget: don't await, don't block
  db.insert(auditLog)
    .values({
      userId: params.userId,
      action: params.action,
      table: params.table,
      recordId: params.recordId ?? null,
      changes: params.changes ? JSON.stringify(params.changes) : null,
      ip: params.ip ?? null,
    })
    .catch((err) => {
      logger.error("Failed to write audit log", err, {
        userId: params.userId,
        action: params.action,
        table: params.table,
      });
    });
}
