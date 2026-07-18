// Account Transfers production candidate
import { SectionTitle, Badge } from "@/components/ui/Card";
import { getAccounts } from "@/lib/data";
import { TransfersClient } from "./TransfersClient";

export const dynamic = "force-dynamic";

export default async function TransfersPage() {
  const accounts = await getAccounts();
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Account Transfers"
        subtitle="Move money between your accounts without changing household income or expenses."
        action={<Badge tone="primary">Internal movement</Badge>}
      />
      <TransfersClient accounts={accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: String(account.balance),
      }))} />
    </div>
  );
}
