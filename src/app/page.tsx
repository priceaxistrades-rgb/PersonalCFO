import { SectionTitle, Badge } from "@/components/ui/Card";
import { FilteredDashboard } from "@/components/FilteredDashboard";
import { ExcelButton } from "@/components/ExcelButton";
import { MemberSelectorClient } from "@/components/MemberSelectorClient";
import { QuickActionCenter } from "@/components/QuickActionCenter";
import { PrivacyToggle } from "@/components/PrivacyToggle";
import {
  getDashboardTransactions,
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
    getDashboardTransactions(),
    getBills(),
    getDebts(),
    getGoals(),
    getInvestments(),
    getAccounts(),
    getMembers(),
  ]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Financial Dashboard"
        subtitle={`Welcome back, ${user.name} · ${dateStr} · ${timeStr}`}
        action={
          <div className="flex items-center gap-2">
            <PrivacyToggle />
            <ExcelButton compact />
          </div>
        }
      />

      <MemberSelectorClient members={members} />

      <QuickActionCenter accounts={accs} investments={invs} listenForGlobalEvents={false} openInGlobalModal />

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
