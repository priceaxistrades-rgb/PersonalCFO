import { SectionTitle, Badge } from "@/components/ui/Card";
import { DreamsClient } from "./DreamsClient";
import {
  getAllTransactions, getAccounts, getInvestments, getDebts, getBills, getGoals,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DreamsPage() {
  const [txns, accounts, investments, debts, bills, goals] = await Promise.all([
    getAllTransactions(), getAccounts(), getInvestments(), getDebts(), getBills(), getGoals(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Dream Planner"
        subtitle="Plan your financial dreams and see how to achieve them"
        action={<Badge tone="primary">✨ Dreams</Badge>}
      />
      <DreamsClient txns={txns} accounts={accounts} investments={investments} debts={debts} bills={bills} goals={goals} />
    </div>
  );
}
