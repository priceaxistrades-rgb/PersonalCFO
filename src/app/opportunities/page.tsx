import { SectionTitle, Badge } from "@/components/ui/Card";
import { OpportunitiesClient } from "./OpportunitiesClient";
import {
  getAllTransactions, getAccounts, getInvestments, getDebts, getBills, getGoals, getBudgets,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const [txns, accounts, investments, debts, bills, goals, budgets] = await Promise.all([
    getAllTransactions(), getAccounts(), getInvestments(), getDebts(), getBills(), getGoals(), getBudgets(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Opportunity Scanner"
        subtitle="Detecting financial opportunities and risks"
        action={<Badge tone="warning">🔍 Scanner</Badge>}
      />
      <OpportunitiesClient txns={txns} accounts={accounts} investments={investments} debts={debts} bills={bills} goals={goals} budgets={budgets} />
    </div>
  );
}
