"use client";

import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Kpi";
import { IconAlert, IconStress } from "@/components/ui/Icons";
import { inr } from "@/lib/format";
import { calculateStress, type StressReport, type StressFactor } from "@/lib/stress-meter";
import type { HealthScoreInput } from "@/lib/health-score-engine";
import { useRouter } from "next/navigation";

export function StressClient(data: Pick<HealthScoreInput, "txns" | "accounts" | "investments" | "debts" | "bills" | "goals">) {
  const report = calculateStress(data);
  const router = useRouter();
  const tone = report.overallScore >= 70 ? "danger" : report.overallScore >= 50 ? "warning" : report.overallScore >= 25 ? "primary" : "success";

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-red-500/20 shrink-0">
            <IconStress size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Stress Telemetry & Risk Diagnostics</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">Telemetry v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Real-time debt service coverage buffers, liquidity runway resilience, and financial burn factors</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Financial Event</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

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
                <span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 grid place-items-center mx-auto mb-1">
                  <IconStress size={22} />
                </span>
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
      <Card title="Stress Factors & Risk Telemetry" subtitle="Sub-index diagnostics contributing to your financial stress rating">
        <div className="space-y-4">
          {report.factors.map(f => (
            <div key={f.id} className="p-3.5 rounded-2xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-400">
                    <IconAlert size={16} />
                  </span>
                  <span className="text-sm font-extrabold" style={{ color: "var(--text-heading)" }}>{f.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--text-muted)" }}>{f.value}</span>
                  <span className="text-xs font-mono font-extrabold" style={{ color: f.score >= 70 ? "var(--danger)" : f.score >= 40 ? "var(--warning)" : "var(--success)" }}>
                    {100 - f.score}/100
                  </span>
                </div>
              </div>
              <Progress value={100 - f.score} tone={f.score >= 70 ? "danger" : f.score >= 40 ? "warning" : "success"} height={6} />
              <p className="text-xs mt-2.5 font-medium flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                <span className="text-amber-400 font-bold">Action Tip:</span> <span>{f.tip}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card title="Stress Mitigation Protocol" subtitle="Prioritized actionable steps to strengthen cash runway and reduce liability pressure">
        <div className="space-y-2.5 pt-1">
          {report.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border bg-surface-2 shadow-sm" style={{ borderColor: "var(--border)" }}>
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 bg-primary-soft text-primary">
                {i + 1}
              </span>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed mt-0.5" style={{ color: "var(--text)" }}>{rec}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
