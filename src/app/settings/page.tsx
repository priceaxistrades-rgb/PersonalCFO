import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { FileUploader } from "@/components/FileUploader";
import { getMembers, getAccounts, getInvestments, getDebts, getBills, getGoals, getInsurance, getTransactions } from "@/lib/data";
import { MembersManager } from "./MembersManager";
import { AccountsManager } from "./AccountsManager";
import { InvestmentsManager } from "./InvestmentsManager";
import { DebtsManager } from "./DebtsManager";
import { BillsManager } from "./BillsManager";
import { GoalsManager } from "./GoalsManager";
import { InsuranceManager } from "./InsuranceManager";
import { TransactionsManager } from "./TransactionsManager";
import { AccountDataManager } from "@/components/AccountDataManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [members, accounts, investments, debts, bills, goals, insurance, transactions] = await Promise.all([
    getMembers(),
    getAccounts(),
    getInvestments(),
    getDebts(),
    getBills(),
    getGoals(),
    getInsurance(),
    getTransactions(),
  ]);

  const hasAnyData = transactions.length > 0 || accounts.length > 0 || investments.length > 0;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Settings & Data Management"
        subtitle="Manage all your data: add, edit, delete records"
        action={<Badge tone="primary">Admin</Badge>}
      />

      {/* Import Section - Always show for easy access */}
      <Card title="📁 Import Data" subtitle="Upload Excel files to bulk import your financial data">
        <FileUploader />
      </Card>



      <Card title="🛡️ Account Data Safety" subtitle="Privacy controls and data reset">
        <AccountDataManager />
      </Card>

      {/* Quick Stats */}
      {hasAnyData && (
        <Card title="📊 Data Overview" subtitle="Summary of your tracked data">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Transactions", count: transactions.length, icon: "🧾" },
              { label: "Accounts", count: accounts.length, icon: "🏦" },
              { label: "Investments", count: investments.length, icon: "📈" },
              { label: "Members", count: members.length, icon: "👨‍👩‍👧‍👦" },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xl font-bold" style={{ color: "var(--text)" }}>{item.count}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-8">
        <TransactionsManager transactions={transactions} members={members} />
        <MembersManager members={members} />
        <AccountsManager accounts={accounts} />
        <InvestmentsManager investments={investments} />
        <DebtsManager debts={debts} />
        <GoalsManager goals={goals} />
        <BillsManager bills={bills} />
        <InsuranceManager insurance={insurance} />
      </div>
    </div>
  );
}
