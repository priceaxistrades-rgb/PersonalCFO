"use client";

import { Card, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { inr } from "@/lib/format";
import { generateWealthTimeline, type WealthTimeline, type TimelineMilestone } from "@/lib/wealth-timeline";
import type { HealthScoreInput } from "@/lib/health-score-engine";
import {
  IconTimeline, IconNetWorth, IconTrendingUp, IconSparkles,
  IconTarget, IconCheck
} from "@/components/ui/Icons";
import { ReactNode } from "react";

export function WealthTimelineClient(data: Pick<HealthScoreInput, "txns" | "accounts" | "investments" | "debts" | "goals">) {
  const timeline = generateWealthTimeline(data);

  const statusConfig: Record<string, { color: string; bg: string; label: string; tone: "success" | "primary" | "warning" | "danger" }> = {
    achieved: { color: "var(--success)", bg: "var(--success-soft)", label: "Achieved", tone: "success" },
    "on-track": { color: "var(--primary)", bg: "var(--primary-soft)", label: "On Track", tone: "primary" },
    "at-risk": { color: "var(--warning)", bg: "var(--warning-soft)", label: "At Risk", tone: "warning" },
    "off-track": { color: "var(--danger)", bg: "var(--danger-soft)", label: "Off Track", tone: "danger" },
  };

  return (
    <div className="space-y-6 animate-fade-in w-full select-none">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Current Net Worth" value={inr(timeline.currentNetWorth, { compact: true })} icon={<IconNetWorth size={18} />} tone="primary" />
        <KpiCard label="Monthly Wealth Velocity" value={`${timeline.monthlyGrowthRate.toFixed(1)}%`} icon={<IconTrendingUp size={18} />} tone="success" sub="Avg capital savings rate" />
        <KpiCard label="Projected Net Worth (1Yr)" value={inr(timeline.projectedNetWorth1Yr, { compact: true })} icon={<IconTarget size={18} />} tone="primary" />
        <KpiCard label="Projected Net Worth (5Yr)" value={inr(timeline.projectedNetWorth5Yr, { compact: true })} icon={<IconSparkles size={18} />} tone="accent" />
      </div>

      <Card title="Household Wealth Roadmap" subtitle="Monitored compounding milestones & financial freedom trajectory">
        <div className="space-y-4 pt-1">
          {timeline.milestones.map((milestone, idx) => (
            <MilestoneCard key={milestone.id} milestone={milestone} statusConfig={statusConfig} index={idx} total={timeline.milestones.length} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function MilestoneCard({ milestone, statusConfig, index, total }: { milestone: TimelineMilestone; statusConfig: Record<string, { color: string; bg: string; label: string; tone: "success" | "primary" | "warning" | "danger" }>; index: number; total: number }) {
  const sc = statusConfig[milestone.status] || statusConfig["on-track"];

  return (
    <div className="relative pl-8 pb-5 animate-fade-in">
      {index < total - 1 && (
        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-surface-4" />
      )}
      <div
        className="absolute left-1 top-1 w-5 h-5 rounded-full grid place-items-center z-10 shadow-md"
        style={{ background: sc.bg, border: `2px solid ${sc.color}`, color: sc.color }}
      >
        {milestone.status === "achieved" && <IconCheck size={11} />}
      </div>

      <div className="p-4.5 rounded-2xl border border-white/[0.06] bg-surface-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 grid place-items-center shrink-0">
                <IconTimeline size={15} />
              </span>
              <h4 className="text-sm font-extrabold tracking-tight text-white">{milestone.title}</h4>
              <Badge tone={sc.tone}>{sc.label}</Badge>
            </div>
            <p className="text-xs font-medium text-slate-400 mb-3 leading-relaxed">{milestone.description}</p>
            <Progress value={milestone.progressPct} tone={sc.tone} height={7} />
            <div className="flex justify-between mt-2 text-[11px] font-mono font-bold text-slate-400">
              <span>Progress: {milestone.progressPct.toFixed(0)}%</span>
              <span>{milestone.status === "achieved" ? "Milestone Unlocked" : "In Progress"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
