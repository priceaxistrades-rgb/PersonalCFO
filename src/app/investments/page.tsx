import { getInvestments } from "@/lib/data";
import { InvestmentsPageClient } from "./InvestmentsClient";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const invs = await getInvestments();
  return <InvestmentsPageClient initialInvestments={invs} />;
}
