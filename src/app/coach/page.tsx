import { SectionTitle, Badge } from "@/components/ui/Card";
import { CoachClient } from "./CoachClient";
import {
  getAllTransactions, getAccounts, getInvestments, getDebts, getBills, getGoals, getBudgets, getInsurance,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const [txns, accounts, investments, debts, bills, goals, budgets, insurance] = await Promise.all([
    getAllTransactions(), getAccounts(), getInvestments(), getDebts(), getBills(), getGoals(), getBudgets(), getInsurance(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="AI Wealth Coach"
        subtitle="Your weekly financial report & guidance"
        action={<Badge tone="primary" className="flex items-center gap-1.5 font-bold">Wealth Advisory</Badge>}
      />
      <CoachClient txns={txns} accounts={accounts} investments={investments} debts={debts} bills={bills} goals={goals} insurance={insurance} budgets={budgets} />
    </div>
  );
}
