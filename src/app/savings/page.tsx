import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { GoalContribute } from "@/components/GoalContribute";
import { inr, num, fmtDate, daysUntil } from "@/lib/format";
import { getGoals, sumBy } from "@/lib/data";
import { GoalsManager } from "../settings/GoalsManager";
import { IconSavings, IconTarget, IconTrendingUp, IconCheck, IconTimeline } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const goals = await getGoals();
  const totalTarget = sumBy(goals, (g) => num(g.target));
  const totalSaved = sumBy(goals, (g) => num(g.saved));
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completed = goals.filter((g) => num(g.saved) >= num(g.target)).length;

  return (
    <div className="space-y-6">
      <SectionTitle title="Milestone & Capital Vaults" subtitle="Monitored goal reserves and progress towards capital milestones" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Saved Reserves" value={inr(totalSaved, { compact: true })} icon={<IconSavings size={18} />} tone="success" />
        <KpiCard label="Combined Vault Target" value={inr(totalTarget, { compact: true })} icon={<IconTarget size={18} />} tone="primary" />
        <KpiCard label="Overall Progress %" value={`${overallPct.toFixed(0)}%`} icon={<IconTrendingUp size={18} />} tone="accent" />
        <KpiCard label="Milestones Achieved" value={`${completed}/${goals.length}`} icon={<IconCheck size={18} />} tone="warning" />
      </div>

      <GoalsManager goals={goals} />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {goals.map((g) => {
          const saved = num(g.saved);
          const target = num(g.target);
          const pct = target > 0 ? (saved / target) * 100 : 0;
          const remaining = Math.max(0, target - saved);
          const dleft = g.deadline ? daysUntil(g.deadline) : null;
          const monthsLeft = dleft !== null ? Math.max(1, Math.round(dleft / 30)) : null;
          const monthlyNeeded = monthsLeft ? remaining / monthsLeft : 0;
          const tone = pct >= 100 ? "success" : pct >= 60 ? "primary" : pct >= 30 ? "warning" : "danger";
          return (
            <Card key={g.id} className="flex flex-col justify-between border border-white/[0.06]">
              <div>
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl grid place-items-center text-indigo-400 bg-indigo-500/10 shrink-0">
                      <IconTarget size={20} />
                    </span>
                    <div>
                      <p className="font-extrabold text-sm text-white truncate">{g.name}</p>
                      <Badge tone="primary" className="mt-1 font-mono text-[10px]">{g.category}</Badge>
                    </div>
                  </div>
                  {pct >= 100 && <Badge tone="success">Achieved</Badge>}
                </div>

                <div className="mb-2 flex items-baseline justify-between font-mono">
                  <span className="text-xl font-black text-white">{inr(saved, { compact: true })}</span>
                  <span className="text-xs font-semibold text-slate-400">of {inr(target, { compact: true })}</span>
                </div>
                <Progress value={pct} tone={tone} height={8} />
                <div className="flex justify-between mt-2 text-[11px] font-mono font-bold text-slate-400">
                  <span>{pct.toFixed(0)}% funded</span>
                  <span>{inr(remaining, { compact: true })} remaining</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] mt-4 flex items-center justify-between">
                <div className="text-[11px] font-medium text-slate-400">
                  {g.deadline && <div className="flex items-center gap-1.5"><IconTimeline size={12} className="text-indigo-400" /> <span>{fmtDate(g.deadline)}</span></div>}
                  {monthlyNeeded > 0 && pct < 100 && (
                    <div className="font-mono font-bold text-slate-200 mt-0.5">
                      ~{inr(monthlyNeeded, { compact: true })}/mo SIP required
                    </div>
                  )}
                </div>
                <GoalContribute id={g.id} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
