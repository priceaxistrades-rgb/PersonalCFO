import { db } from "@/db";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { apiHandler, apiSuccess, apiError } from "@/lib/api-utils";
import { generateMorningBrief } from "@/lib/morning-brief";
import {
  getAllTransactions, getAccounts, getInvestments,
  getDebts, getBills, getGoals, getInsurance, getBudgets,
} from "@/lib/data";

export const GET = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const [txns, accounts, investments, debts, bills, goals, insurance, budgets] = await Promise.all([
      getAllTransactions(), getAccounts(), getInvestments(),
      getDebts(), getBills(), getGoals(), getInsurance(), getBudgets(),
    ]);

    const brief = generateMorningBrief({
      txns, accounts, investments, debts, bills, goals, insurance, budgets,
      userName: session.name,
    });

    log.info("Morning brief generated", { userId: session.userId, items: brief.items.length });
    return apiSuccess(brief);
  } catch (err) {
    return apiError("Failed to generate morning brief", 500, undefined, err);
  }
});
