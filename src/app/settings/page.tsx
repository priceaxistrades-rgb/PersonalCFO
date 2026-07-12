import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { FileUploader } from "@/components/FileUploader";
import { getMembers, getAccounts, getInvestments, getDebts, getBills, getGoals, getInsurance, getAllTransactions } from "@/lib/data";
import { MembersManager } from "./MembersManager";
import { AccountsManager } from "./AccountsManager";
import { InvestmentsManager } from "./InvestmentsManager";
import { DebtsManager } from "./DebtsManager";
import { BillsManager } from "./BillsManager";
import { GoalsManager } from "./GoalsManager";
import { InsuranceManager } from "./InsuranceManager";
import { TransactionsManager } from "./TransactionsManager";
import { AICFOFeature } from "./AICFOFeature";
import { AccountDataManager } from "@/components/AccountDataManager";
import {
  IconSettings, IconReports, IconSavings, IconExpenses, IconInvestments, IconFamily
} from "@/components/ui/Icons";

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
    getAllTransactions(),
  ]);

  const hasAnyData = transactions.length > 0 || accounts.length > 0 || investments.length > 0;

  return (
    <div className="space-y-8 animate-fade-in w-full select-none">
      <SectionTitle
        title="Settings & Household Data Administration"
        subtitle="Configure household profiles, register accounts, manage transactions, and import external records"
        action={<Badge tone="primary" className="flex items-center gap-1.5"><IconSettings size={14} /> <span>Admin Console</span></Badge>}
      />

      <Card title="Import Historical Excel Records" subtitle="Upload multi-sheet Excel (.xlsx) workbooks to bulk import transactions, accounts, and portfolio holdings">
        <FileUploader />
      </Card>

      <Card title="Data Privacy & Archive Protection" subtitle="Manage local cache telemetry, privacy preferences, and account reset options">
        <AccountDataManager />
      </Card>

      {/* Quick Stats */}
      {hasAnyData && (
        <Card title="Database Telemetry Overview" subtitle="Real-time count of active records across all household modules">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {[
              { label: "Transactions", count: transactions.length, icon: IconExpenses },
              { label: "Accounts", count: accounts.length, icon: IconSavings },
              { label: "Investments", count: investments.length, icon: IconInvestments },
              { label: "Family Profiles", count: members.length, icon: IconFamily },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <div key={item.label} className="p-4 rounded-2xl border border-white/[0.04] bg-surface-2 flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 grid place-items-center shrink-0">
                    <IconComp size={20} />
                  </span>
                  <div>
                    <div className="text-xl font-mono font-black text-white">{item.count}</div>
                    <div className="text-xs font-semibold text-slate-400">{item.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="space-y-8">
        <TransactionsManager transactions={transactions} members={members} />
        <MembersManager members={members} />
        <AccountsManager accounts={accounts} />
        <InvestmentsManager investments={investments} accounts={accounts.map(a => ({ id: a.id, name: a.name, type: a.type }))} />
        <DebtsManager debts={debts} />
        <GoalsManager goals={goals} />
        <BillsManager bills={bills} />
        <InsuranceManager insurance={insurance} />
        <AICFOFeature />
      </div>
    </div>
  );
}
