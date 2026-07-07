import { SectionTitle, Badge } from "@/components/ui/Card";
import { HealthScoreClient } from "./HealthScoreClient";
import {
  getAllTransactions,
  getAccounts,
  getInvestments,
  getDebts,
  getBills,
  getGoals,
  getInsurance,
  getBudgets,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HealthScorePage() {
  const [txns, accounts, investments, debts, bills, goals, insurance, budgets] = await Promise.all([
    getAllTransactions(),
    getAccounts(),
    getInvestments(),
    getDebts(),
    getBills(),
    getGoals(),
    getInsurance(),
    getBudgets(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Financial Health Score"
        subtitle="Comprehensive 8-dimension analysis of your financial wellbeing"
        action={<Badge tone="primary">📊 Analysis</Badge>}
      />
      <HealthScoreClient
        txns={txns}
        accounts={accounts}
        investments={investments}
        debts={debts}
        bills={bills}
        goals={goals}
        insurance={insurance}
        budgets={budgets}
      />
    </div>
  );
}
