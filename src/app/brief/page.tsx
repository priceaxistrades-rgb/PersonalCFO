import { SectionTitle, Badge } from "@/components/ui/Card";
import { BriefClient } from "./BriefClient";
import {
  getAllTransactions, getAccounts, getInvestments,
  getDebts, getBills, getGoals, getInsurance, getBudgets,
  getCurrentUser,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BriefPage() {
  const [user, txns, accounts, investments, debts, bills, goals, insurance, budgets] = await Promise.all([
    getCurrentUser(),
    getAllTransactions(), getAccounts(), getInvestments(),
    getDebts(), getBills(), getGoals(), getInsurance(), getBudgets(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Morning CFO Brief"
        subtitle="Your personalized daily financial briefing"
        action={<Badge tone="primary">☀️ Daily</Badge>}
      />
      <BriefClient
        txns={txns}
        accounts={accounts}
        investments={investments}
        debts={debts}
        bills={bills}
        goals={goals}
        insurance={insurance}
        budgets={budgets}
        userName={user.name}
      />
    </div>
  );
}
