import { SectionTitle, Badge } from "@/components/ui/Card";
import { ControlClient } from "./ControlClient";
import {
  getAllTransactions, getAccounts, getInvestments, getDebts, getBills, getGoals, getBudgets, getInsurance,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ControlPage() {
  const [txns, accounts, investments, debts, bills, goals, budgets, insurance] = await Promise.all([
    getAllTransactions(), getAccounts(), getInvestments(), getDebts(), getBills(), getGoals(), getBudgets(), getInsurance(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Mission Control"
        subtitle="Your financial command center — all insights in one place"
        action={<Badge tone="primary" className="font-bold tracking-wide">Command Center</Badge>}
      />
      <ControlClient txns={txns} accounts={accounts} investments={investments} debts={debts} bills={bills} goals={goals} insurance={insurance} budgets={budgets} />
    </div>
  );
}
