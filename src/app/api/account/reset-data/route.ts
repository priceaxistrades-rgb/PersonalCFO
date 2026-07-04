import { db } from "@/db";
import {
  accounts,
  annualPlans,
  bills,
  budgets,
  debts,
  emergencyItems,
  goals,
  insurance,
  investments,
  members,
  netWorthSnapshots,
  taxProfile,
  transactions,
  watchlist,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";

export async function DELETE(req: Request) {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const body = await req.json().catch(() => ({}));
    if (body.confirm !== "RESET MY DATA") {
      return Response.json({ error: "Confirmation phrase is required" }, { status: 400 });
    }

    const userId = session.userId;
    await db.transaction(async (tx) => {
      await tx.delete(transactions).where(eq(transactions.userId, userId));
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      await tx.delete(investments).where(eq(investments.userId, userId));
      await tx.delete(watchlist).where(eq(watchlist.userId, userId));
      await tx.delete(debts).where(eq(debts.userId, userId));
      await tx.delete(bills).where(eq(bills.userId, userId));
      await tx.delete(goals).where(eq(goals.userId, userId));
      await tx.delete(budgets).where(eq(budgets.userId, userId));
      await tx.delete(insurance).where(eq(insurance.userId, userId));
      await tx.delete(netWorthSnapshots).where(eq(netWorthSnapshots.userId, userId));
      await tx.delete(annualPlans).where(eq(annualPlans.userId, userId));
      await tx.delete(taxProfile).where(eq(taxProfile.userId, userId));
      await tx.delete(emergencyItems).where(eq(emergencyItems.userId, userId));
      await tx.delete(members).where(eq(members.userId, userId));
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not reset data" }, { status: 500 });
  }
}
