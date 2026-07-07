import { SectionTitle, Badge } from "@/components/ui/Card";
import { SimulatorClient } from "./SimulatorClient";
import {
  getAllTransactions, getAccounts, getInvestments, getDebts, getGoals, getBills, getInsurance,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const [txns, accounts, investments, debts, goals, bills, insurance] = await Promise.all([
    getAllTransactions(), getAccounts(), getInvestments(), getDebts(), getGoals(), getBills(), getInsurance(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Life Simulator"
        subtitle="What if? See how life events impact your finances"
        action={<Badge tone="warning">🔬 Experimental</Badge>}
      />
      <SimulatorClient txns={txns} accounts={accounts} investments={investments} debts={debts} goals={goals} bills={bills} insurance={insurance} />
    </div>
  );
}
