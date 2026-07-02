import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { TaxManager } from "./TaxManager";
import { getTaxProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TaxPage() {
  const profile = await getTaxProfile();

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Tax Planner (India)"
        subtitle="FY 2024-25 · Old vs New regime comparison"
        action={<Badge tone="primary">Estimates only</Badge>}
      />

      <TaxManager initialProfile={profile} />
    </div>
  );
}
