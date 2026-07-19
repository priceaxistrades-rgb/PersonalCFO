import { db } from "@/db";
import { 
  users, members, accounts, transactions, investments, 
  debts, bills, goals, insurance, taxProfile 
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireApiSession, isSession } from "@/lib/server-auth";
import { apiHandler, apiError } from "@/lib/api-utils";

export const GET = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const userId = session.userId;

    // Fetch all user data in parallel
    const [
      userData,
      memberData,
      accountData,
      txnData,
      investmentData,
      debtData,
      billData,
      goalData,
      insuranceData,
      taxData,
    ] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)),
      db.select().from(members).where(eq(members.userId, userId)),
      db.select().from(accounts).where(eq(accounts.userId, userId)),
      db.select().from(transactions).where(eq(transactions.userId, userId)),
      db.select().from(investments).where(eq(investments.userId, userId)),
      db.select().from(debts).where(eq(debts.userId, userId)),
      db.select().from(bills).where(eq(bills.userId, userId)),
      db.select().from(goals).where(eq(goals.userId, userId)),
      db.select().from(insurance).where(eq(insurance.userId, userId)),
      db.select().from(taxProfile).where(eq(taxProfile.userId, userId)),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: userData[0] ? { ...userData[0], password: undefined } : null,
      members: memberData,
      accounts: accountData,
      transactions: txnData,
      investments: investmentData,
      debts: debtData,
      bills: billData,
      goals: goalData,
      insurance: insuranceData,
      taxProfile: taxData[0] || null,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="personal-cfo-export-${new Date().toISOString().slice(0,10)}.json"`,
      },
    });
  } catch (err) {
    log.error("Data export failed", err);
    return apiError("Failed to export data", 500);
  }
});
