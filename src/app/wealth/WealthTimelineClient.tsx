"use client";

import { Card, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { inr } from "@/lib/format";
import { generateWealthTimeline, type WealthTimeline, type TimelineMilestone } from "@/lib/wealth-timeline";
import type { HealthScoreInput } from "@/lib/health-score-engine";

export function WealthTimelineClient(data: Pick<HealthScoreInput, "txns" | "accounts" | "investments" | "debts" | "goals">) {
  const timeline = generateWealthTimeline(data);

  const statusConfig: Record<string, { color: string; bg: string; icon: string }> = {
    achieved: { color: "var(--success)", bg: "var(--success-soft)", icon: "✅" },
    "on-track": { color: "var(--primary)", bg: "var(--primary-soft)", icon: "🟢" },
    "at-risk": { color: "var(--warning)", bg: "var(--warning-soft)", icon: "🟡" },
    "off-track": { color: "var(--danger)", bg: "var(--danger-soft)", icon: "🔴" },
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 kpi-scroll lg:grid stagger-wide slide-in-up">
        <KpiCard label="Current Net Worth" value={inr(timeline.currentNetWorth, { compact: true })} icon="💎" tone="primary" />
        <KpiCard label="Monthly Growth" value={`${timeline.monthlyGrowthRate.toFixed(1)}%`} icon="📈" tone="success" sub="Avg savings rate" />
        <KpiCard label="Projected (1Yr)" value={inr(timeline.projectedNetWorth1Yr, { compact: true })} icon="🔭" tone="primary" />
        <KpiCard label="Projected (5Yr)" value={inr(timeline.projectedNetWorth5Yr, { compact: true })} icon="🌟" tone="accent" />
      </div>

      {/* Timeline */}
      <Card title="🗺️ Your Wealth Journey" subtitle="Milestones on your path to financial freedom">
        <div className="space-y-4">
          {timeline.milestones.map((milestone, idx) => (
            <MilestoneCard key={milestone.id} milestone={milestone} statusConfig={statusConfig} index={idx} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function MilestoneCard({ milestone, statusConfig, index }: { milestone: TimelineMilestone; statusConfig: Record<string, { color: string; bg: string; icon: string }>; index: number }) {
  const sc = statusConfig[milestone.status];
  const tone = milestone.status === "achieved" ? "success" : milestone.status === "on-track" ? "primary" : milestone.status === "at-risk" ? "warning" : "danger";

  return (
    <div
      className="relative pl-8 pb-4 slide-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Timeline line */}
      {index < 10 && (
        <div
          className="absolute left-3 top-8 bottom-0 w-0.5"
          style={{ background: "var(--border)" }}
        />
      )}
      {/* Timeline dot */}
      <div
        className="absolute left-1 top-1 w-5 h-5 rounded-full grid place-items-center text-[10px] z-10"
        style={{ background: sc.bg, border: `2px solid ${sc.color}`, color: sc.color }}
      >
        {milestone.status === "achieved" ? "✓" : ""}
      </div>

      <div className="p-4 rounded-xl" style={{ background: sc.bg, border: `1px solid ${sc.color}33` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{milestone.icon}</span>
              <h4 className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>{milestone.title}</h4>
              <Badge tone={tone}>{sc.icon} {milestone.status.replace("-", " ")}</Badge>
            </div>
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{milestone.description}</p>
            <Progress value={milestone.progressPct} tone={tone} height={6} />
            <div className="flex justify-between mt-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
              <span>{inr(milestone.currentAmount, { compact: true })}</span>
              <span>{inr(milestone.targetAmount, { compact: true })}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-bold" style={{ color: sc.color }}>{milestone.progressPct.toFixed(0)}%</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
              {milestone.estimatedDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
