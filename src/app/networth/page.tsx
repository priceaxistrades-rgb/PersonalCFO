import { SectionTitle } from "@/components/ui/Card";
import { getAccounts, getInvestments, getDebts, getSnapshots } from "@/lib/data";
import { LiveNetWorthTracker } from "./LiveNetWorthTracker";
import { AccountsManager } from "../settings/AccountsManager";
import { InvestmentsManager } from "../settings/InvestmentsManager";
import { DebtsManager } from "../settings/DebtsManager";

export const dynamic = "force-dynamic";

export default async function NetWorthPage() {
  const [accounts, investments, debts, snapshots] = await Promise.all([
    getAccounts(),
    getInvestments(),
    getDebts(),
    getSnapshots(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle title="Net Worth Tracker" subtitle="Synced with accounts, debts, and live investment market values" />
      <LiveNetWorthTracker accounts={accounts} investments={investments} debts={debts} snapshots={snapshots} />

      <SectionTitle title="Manage Net Worth Inputs" subtitle="Add or correct cash, assets, investments and liabilities directly here" />
      <AccountsManager accounts={accounts} />
      <InvestmentsManager investments={investments} />
      <DebtsManager debts={debts} />
    </div>
  );
}
