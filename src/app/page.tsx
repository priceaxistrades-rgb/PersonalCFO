import { SectionTitle, Badge } from "@/components/ui/Card";
import { FilteredDashboard } from "@/components/FilteredDashboard";
import { ExcelButton } from "@/components/ExcelButton";
import { MemberSelectorClient } from "@/components/MemberSelectorClient";
import { QuickActionCenter } from "@/components/QuickActionCenter";
import {
  getTransactions,
  getBills,
  getDebts,
  getGoals,
  getInvestments,
  getAccounts,
  getMembers,
  getCurrentUser,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [user, txns, bills, debts, goals, invs, accs, members] = await Promise.all([
    getCurrentUser(),
    getTransactions(),
    getBills(),
    getDebts(),
    getGoals(),
    getInvestments(),
    getAccounts(),
    getMembers(),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Financial Dashboard"
        subtitle={`Welcome back, ${user.name} · ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
        action={
          <div className="flex items-center gap-2">
            <Badge tone="primary">Personal CFO</Badge>
            <ExcelButton compact />
          </div>
        }
      />

      <MemberSelectorClient members={members} />

      <QuickActionCenter accounts={accs} />

      <FilteredDashboard 
        txns={txns}
        bills={bills}
        debts={debts}
        goals={goals}
        invs={invs}
        accounts={accs}
        members={members}
      />
    </div>
  );
}
