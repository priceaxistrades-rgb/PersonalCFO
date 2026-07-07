"use client";

import { Card, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { useState } from "react";
import { computeHealthScore, type HealthScoreBreakdown, type SubScore } from "@/lib/health-score-engine";
import { inr } from "@/lib/format";
import type { HealthScoreInput } from "@/lib/health-score-engine";

export function HealthScoreClient(data: HealthScoreInput) {
  const breakdown = computeHealthScore(data);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const overallTone = breakdown.overall >= 80 ? "success" : breakdown.overall >= 60 ? "primary" : breakdown.overall >= 40 ? "warning" : "danger";
  const overallEmoji = breakdown.overall >= 80 ? "🎉" : breakdown.overall >= 60 ? "💪" : breakdown.overall >= 40 ? "⚠️" : "🔴";

  return (
    <div className="space-y-4">
      {/* Overall Score Hero */}
      <Card className="text-center py-6 sm:py-8">
        <div className="flex flex-col items-center">
          {/* Large SVG gauge */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52" role="img" aria-label={`Financial Health Score: ${breakdown.overall} out of 100`}>
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-3)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={`var(--${overallTone})`}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(breakdown.overall / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <p className="text-4xl sm:text-5xl font-extrabold" style={{ color: "var(--text-heading)" }}>{breakdown.overall}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--text-faint)" }}>out of 100</p>
              </div>
            </div>
          </div>

          {/* Grade badge */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl">{overallEmoji}</span>
            <div>
              <p className="text-lg font-extrabold" style={{ color: `var(--${overallTone})` }}>
                Grade: {breakdown.grade}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {breakdown.overall >= 80 ? "Excellent financial health!" : breakdown.overall >= 60 ? "Good — room for improvement" : breakdown.overall >= 40 ? "Fair — needs attention" : "Critical — take action now"}
              </p>
            </div>
          </div>

          {/* 8 sub-score progress bars */}
          <div className="w-full max-w-lg mt-6 space-y-3">
            {breakdown.subScores.map((sc) => (
              <SubScoreBar key={sc.id} sub={sc} expanded={expandedSub === sc.id} onToggle={() => setExpandedSub(expandedSub === sc.id ? null : sc.id)} />
            ))}
          </div>
        </div>
      </Card>

      {/* Top Actions */}
      {breakdown.topActions.length > 0 && (
        <Card title="🎯 Top Actions to Improve" subtitle="Focus on these for maximum impact">
          <div className="space-y-3">
            {breakdown.topActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                <span className="w-7 h-7 rounded-lg grid place-items-center text-sm font-bold flex-shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                  {i + 1}
                </span>
                <p className="text-sm" style={{ color: "var(--text)" }}>{action}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4">
        {breakdown.strengths.length > 0 && (
          <Card title="💪 Strengths" subtitle="What's going well">
            <div className="space-y-2">
              {breakdown.strengths.map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "var(--success-soft)" }}>
                  <span className="text-sm" style={{ color: "var(--success)" }}>{s}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        {breakdown.weaknesses.length > 0 && (
          <Card title="⚠️ Areas to Improve" subtitle="Focus on these dimensions">
            <div className="space-y-2">
              {breakdown.weaknesses.map((w, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "var(--warning-soft)" }}>
                  <span className="text-sm" style={{ color: "var(--warning)" }}>{w}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Detailed Sub-Scores */}
      <div className="grid sm:grid-cols-2 gap-4">
        {breakdown.subScores.map((sc) => (
          <SubScoreCard key={sc.id} sub={sc} />
        ))}
      </div>
    </div>
  );
}

function SubScoreBar({ sub, expanded, onToggle }: { sub: SubScore; expanded: boolean; onToggle: () => void }) {
  const tone = sub.score >= 80 ? "success" : sub.score >= 60 ? "primary" : sub.score >= 40 ? "warning" : "danger";

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 text-left group"
        aria-expanded={expanded}
        aria-label={`${sub.label}: ${sub.score} out of 100`}
      >
        <span className="text-lg flex-shrink-0 w-7 text-center">{sub.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{sub.label}</span>
            <span className="text-xs font-bold" style={{ color: `var(--${tone})` }}>{sub.score}</span>
          </div>
          <Progress value={sub.score} tone={tone} height={5} />
        </div>
        <span className="text-[10px] opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "var(--text-faint)" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded && (
        <div className="ml-10 mt-2 space-y-1.5 slide-in-up">
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            Target: {sub.target} · Current: {sub.value}
          </p>
          {sub.details.map((d, i) => (
            <p key={i} className="text-[11px]" style={{ color: "var(--text-muted)" }}>{d}</p>
          ))}
          <div className="p-2.5 rounded-lg mt-2" style={{ background: "var(--primary-soft)", border: "1px solid var(--border-accent)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>💡 {sub.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SubScoreCard({ sub }: { sub: SubScore }) {
  const tone = sub.score >= 80 ? "success" : sub.score >= 60 ? "primary" : sub.score >= 40 ? "warning" : "danger";
  const statusEmoji = sub.status === "excellent" ? "✅" : sub.status === "good" ? "👍" : sub.status === "fair" ? "⚠️" : sub.status === "poor" ? "🔴" : "❌";

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl grid place-items-center text-xl" style={{ background: `var(--${tone}-soft)`, boxShadow: `0 4px 12px var(--${tone}-soft)` }}>
            {sub.icon}
          </div>
          <div>
            <h4 className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>{sub.label}</h4>
            <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: `var(--${tone})` }}>{sub.status} · {sub.value}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold" style={{ color: `var(--${tone})` }}>{sub.score}</p>
          <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>/100</p>
        </div>
      </div>

      <Progress value={sub.score} tone={tone} height={8} />

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{statusEmoji}</span>
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Target: {sub.target}</span>
        </div>
        {sub.details.slice(0, 3).map((d, i) => (
          <p key={i} className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{d}</p>
        ))}
      </div>

      <div className="mt-3 p-2.5 rounded-lg" style={{ background: "var(--primary-soft)", border: "1px solid var(--border-accent)" }}>
        <p className="text-[11px] font-semibold" style={{ color: "var(--primary)" }}>💡 {sub.tip}</p>
      </div>
    </Card>
  );
}
