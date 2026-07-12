import { SectionTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { AnnualManager } from "./AnnualManager";
import { getAnnualPlans } from "@/lib/data";
import { IconAnnual, IconCheck, IconSavings, IconDashboard } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function AnnualPage() {
  const plans = await getAnnualPlans();

  const totalTarget = plans.reduce((sum, p) => sum + Number(p.targetAmount), 0);
  const avgProgress = plans.length ? plans.reduce((sum, p) => sum + Number(p.progress), 0) / plans.length : 0;
  const done = plans.filter((p) => p.status === "Done").length;
  const inProgress = plans.filter((p) => p.status === "InProgress").length;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Annual Financial Planner"
        subtitle="Set yearly targets, track progress, and plan major life milestones"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Goals" value={String(plans.length)} icon={<IconAnnual size={18} />} tone="primary" />
        <KpiCard label="Completed" value={String(done)} icon={<IconCheck size={18} />} tone="success" />
        <KpiCard label="In Progress" value={String(inProgress)} icon={<IconSavings size={18} />} tone="warning" />
        <KpiCard label="Avg Progress" value={`${avgProgress.toFixed(0)}%`} icon={<IconDashboard size={18} />} tone="accent" />
      </div>

      <AnnualManager initialPlans={plans} years={[2026, 2027, 2028, 2029, 2030]} />
    </div>
  );
}
