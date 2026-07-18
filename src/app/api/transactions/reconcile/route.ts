import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { apiError, apiHandler, apiSuccess } from "@/lib/api-utils";
import { isSession, requireApiSession } from "@/lib/server-auth";

const schema = z.object({ id: z.number().int().positive(), reconciled: z.boolean() }).strict();

export const PATCH = apiHandler(async (req) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("Invalid reconciliation request", 400);

  const [row] = await db.update(transactions).set({
    reconciled: parsed.data.reconciled,
    reconciledAt: parsed.data.reconciled ? new Date() : null,
    updatedAt: new Date(),
  }).where(and(eq(transactions.id, parsed.data.id), eq(transactions.userId, session.userId))).returning();

  if (!row) return apiError("Transaction not found", 404);
  return apiSuccess({ row });
});
