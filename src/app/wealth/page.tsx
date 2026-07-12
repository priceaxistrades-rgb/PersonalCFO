import { SectionTitle, Badge } from "@/components/ui/Card";
import { WealthTimelineClient } from "./WealthTimelineClient";
import {
  getAllTransactions, getAccounts, getInvestments, getDebts, getGoals,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function WealthTimelinePage() {
  const [txns, accounts, investments, debts, goals] = await Promise.all([
    getAllTransactions(), getAccounts(), getInvestments(), getDebts(), getGoals(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Wealth Timeline"
        subtitle="Your journey to financial milestones"
        action={<Badge tone="primary" className="font-bold">Wealth Roadmap</Badge>}
      />
      <WealthTimelineClient txns={txns} accounts={accounts} investments={investments} debts={debts} goals={goals} />
    </div>
  );
}
