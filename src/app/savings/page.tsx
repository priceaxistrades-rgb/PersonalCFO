import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { GoalContribute } from "@/components/GoalContribute";
import { inr, num, fmtDate, daysUntil } from "@/lib/format";
import { getGoals, sumBy } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const goals = await getGoals();
  const totalTarget = sumBy(goals, (g) => num(g.target));
  const totalSaved = sumBy(goals, (g) => num(g.saved));
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const completed = goals.filter((g) => num(g.saved) >= num(g.target)).length;

  return (
    <div className="space-y-6">
      <SectionTitle title="Savings Dashboard" subtitle="Goal-based saving for life's milestones" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Saved" value={inr(totalSaved, { compact: true })} icon="🐖" tone="success" />
        <KpiCard label="Total Target" value={inr(totalTarget, { compact: true })} icon="🎯" tone="primary" />
        <KpiCard label="Overall Progress" value={`${overallPct.toFixed(0)}%`} icon="📈" tone="accent" />
        <KpiCard label="Goals Achieved" value={`${completed}/${goals.length}`} icon="🏆" tone="warning" />
      </div>

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
            <Card key={g.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl grid place-items-center text-xl" style={{ background: "var(--surface-3)" }}>
                    {g.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{g.name}</p>
                    <Badge tone="primary">{g.category}</Badge>
                  </div>
                </div>
                {pct >= 100 && <Badge tone="success">Achieved 🎉</Badge>}
              </div>

              <div className="mb-2 flex items-end justify-between">
                <span className="text-xl font-bold" style={{ color: "var(--text)" }}>{inr(saved, { compact: true })}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>of {inr(target, { compact: true })}</span>
              </div>
              <Progress value={pct} tone={tone} height={9} />
              <div className="flex justify-between mt-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
                <span>{pct.toFixed(0)}% funded</span>
                <span>{inr(remaining, { compact: true })} to go</span>
              </div>

              <div className="mt-auto pt-3 border-t mt-3 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {g.deadline && <div>🗓️ {fmtDate(g.deadline)}</div>}
                  {monthlyNeeded > 0 && pct < 100 && (
                    <div className="font-medium" style={{ color: "var(--text)" }}>
                      ~{inr(monthlyNeeded, { compact: true })}/mo needed
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
