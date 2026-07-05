import { getInvestments, getAccounts } from "@/lib/data";
import { InvestmentsPageClient } from "./InvestmentsClient";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const [invs, accs] = await Promise.all([
    getInvestments(),
    getAccounts(),
  ]);
  return (
    <InvestmentsPageClient
      initialInvestments={invs}
      accounts={accs.map((a) => ({ id: a.id, name: a.name, type: a.type }))}
    />
  );
}
