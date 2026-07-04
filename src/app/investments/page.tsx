import { SectionTitle } from "@/components/ui/Card";
import { getInvestments } from "@/lib/data";
import { LiveInvestmentsDashboard } from "./LiveInvestmentsDashboard";
import { InvestmentsManager } from "../settings/InvestmentsManager";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const invs = await getInvestments();

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Investment Dashboard"
        subtitle="Live portfolio value synced from stock prices and mutual fund NAVs"
      />

      <LiveInvestmentsDashboard investments={invs} />
      <InvestmentsManager investments={invs} />
    </div>
  );
}
