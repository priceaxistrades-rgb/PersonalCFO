import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { AnnualManager } from "./AnnualManager";
import { inr, num } from "@/lib/format";
import { getAnnualPlans, sumBy } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AnnualPage() {
  const plans = await getAnnualPlans();
  const years = [...new Set(plans.map((p) => p.year))].sort();
  const done = plans.filter((p) => p.status === "Done").length;
  const inProgress = plans.filter((p) => p.status === "InProgress").length;
  const totalTarget = sumBy(plans, (p) => num(p.targetAmount));
  const avgProgress = plans.length ? sumBy(plans, (p) => p.progress) / plans.length : 0;

  return (
    <div className="space-y-6">
      <SectionTitle title="Annual Financial Planner" subtitle="Set yearly goals and track milestones" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <KpiCard label="Total Goals" value={String(plans.length)} icon="🗓️" tone="primary" />
        <KpiCard label="Completed" value={String(done)} icon="✅" tone="success" />
        <KpiCard label="In Progress" value={String(inProgress)} icon="⏳" tone="warning" />
        <KpiCard label="Avg Progress" value={`${avgProgress.toFixed(0)}%`} icon="📊" tone="accent" />
      </div>

      <AnnualManager initialPlans={plans} years={years} />
    </div>
  );
}
