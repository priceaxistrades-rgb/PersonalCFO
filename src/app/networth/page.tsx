import { SectionTitle } from "@/components/ui/Card";
import { getAccounts, getInvestments, getDebts, getSnapshots } from "@/lib/data";
import { LiveNetWorthTracker } from "./LiveNetWorthTracker";

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
    </div>
  );
}
