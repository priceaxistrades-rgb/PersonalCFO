import { SectionTitle, Badge } from "@/components/ui/Card";
import { StressClient } from "./StressClient";
import {
  getAllTransactions, getAccounts, getInvestments, getDebts, getBills, getGoals,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StressPage() {
  const [txns, accounts, investments, debts, bills, goals] = await Promise.all([
    getAllTransactions(), getAccounts(), getInvestments(), getDebts(), getBills(), getGoals(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Financial Stress Meter"
        subtitle="Measure your financial stress level"
        action={<Badge tone="danger">😰 Stress</Badge>}
      />
      <StressClient txns={txns} accounts={accounts} investments={investments} debts={debts} bills={bills} goals={goals} />
    </div>
  );
}
