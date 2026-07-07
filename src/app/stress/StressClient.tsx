"use client";

import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Kpi";
import { inr } from "@/lib/format";
import { calculateStress, type StressReport, type StressFactor } from "@/lib/stress-meter";
import type { HealthScoreInput } from "@/lib/health-score-engine";
import { useRouter } from "next/navigation";

export function StressClient(data: Pick<HealthScoreInput, "txns" | "accounts" | "investments" | "debts" | "bills" | "goals">) {
  const report = calculateStress(data);
  const router = useRouter();
  const tone = report.overallScore >= 70 ? "danger" : report.overallScore >= 50 ? "warning" : report.overallScore >= 25 ? "primary" : "success";

  return (
    <div className="space-y-4">
      {/* Main Score */}
      <Card className="text-center py-6">
        <div className="flex flex-col items-center">
          <div className="relative w-44 h-44" role="img" aria-label={`Stress level: ${report.overallScore} out of 100`}>
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-3)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={`var(--${tone})`}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(report.overallScore / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <p className="text-4xl">{report.emoji}</p>
                <p className="text-2xl font-extrabold" style={{ color: `var(--${tone})` }}>{report.overallScore}</p>
                <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>stress / 100</p>
              </div>
            </div>
          </div>
          <p className="text-lg font-bold mt-3" style={{ color: `var(--${tone})` }}>{report.level} Stress</p>
        </div>
      </Card>

      {/* Quick Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl text-center" style={{ background: "var(--surface-2)" }}>
          <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-faint)" }}>Burn Rate</p>
          <p className="text-sm font-extrabold" style={{ color: report.burnRate >= 0 ? "var(--success)" : "var(--danger)" }}>
            {report.burnRate >= 0 ? "+" : ""}{inr(report.burnRate, { compact: true })}/mo
          </p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ background: "var(--surface-2)" }}>
          <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-faint)" }}>Cash Runway</p>
          <p className="text-sm font-extrabold" style={{ color: report.cashRunway >= 6 ? "var(--success)" : "var(--danger)" }}>
            {report.cashRunway.toFixed(1)} mo
          </p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ background: "var(--surface-2)" }}>
          <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text-faint)" }}>Risk Level</p>
          <p className="text-sm font-extrabold" style={{ color: `var(--${tone})` }}>{report.overallScore}/100</p>
        </div>
      </div>

      {/* Factors */}
      <Card title="📊 Stress Factors" subtitle="What's contributing to your financial stress">
        <div className="space-y-4">
          {report.factors.map(f => (
            <div key={f.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{f.icon}</span>
                  <span className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>{f.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{f.value}</span>
                  <span className="text-xs font-bold" style={{ color: f.score >= 70 ? "var(--danger)" : f.score >= 40 ? "var(--warning)" : "var(--success)" }}>
                    {100 - f.score}/100
                  </span>
                </div>
              </div>
              <Progress value={100 - f.score} tone={f.score >= 70 ? "danger" : f.score >= 40 ? "warning" : "success"} height={6} />
              <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>💡 {f.tip}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card title="🎯 How to Reduce Stress" subtitle="Actionable steps to lower your score">
        <div className="space-y-2">
          {report.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <span className="w-6 h-6 rounded-lg grid place-items-center text-xs font-bold flex-shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                {i + 1}
              </span>
              <p className="text-sm" style={{ color: "var(--text)" }}>{rec}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
