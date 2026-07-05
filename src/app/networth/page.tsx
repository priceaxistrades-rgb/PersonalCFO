import { SectionTitle } from "@/components/ui/Card";
import { getAccounts, getInvestments, getDebts, getSnapshots, getTransactions, currentMonthKey, monthlyFlow, lastNMonths } from "@/lib/data";
import { LiveNetWorthTracker } from "./LiveNetWorthTracker";
import { AccountsManager } from "../settings/AccountsManager";
import { InvestmentsManager } from "../settings/InvestmentsManager";
import { DebtsManager } from "../settings/DebtsManager";

export const dynamic = "force-dynamic";

export default async function NetWorthPage() {
  const [accounts, investments, debts, snapshots, transactions] = await Promise.all([
    getAccounts(),
    getInvestments(),
    getDebts(),
    getSnapshots(),
    getTransactions(),
  ]);

  const months = lastNMonths(1);
  const flows = monthlyFlow(transactions, months);
  const currentFlow = flows[0] || { income: 0, expense: 0, savings: 0 };

  return (
    <div className="space-y-6">
      <SectionTitle title="Net Worth Tracker" subtitle="Synced with accounts, debts, and live investment market values" />
      <LiveNetWorthTracker 
        accounts={accounts} 
        investments={investments} 
        debts={debts} 
        snapshots={snapshots} 
        currentFlow={currentFlow}
      />

      <SectionTitle title="Manage Net Worth Inputs" subtitle="Add or correct cash, assets, investments and liabilities directly here" />
      <AccountsManager accounts={accounts} />
      <InvestmentsManager investments={investments} />
      <DebtsManager debts={debts} />
    </div>
  );
}
