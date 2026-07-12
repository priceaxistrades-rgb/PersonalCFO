"use client";

import { Card, Badge } from "@/components/ui/Card";
import { generateWealthCoachReport, type WealthCoachReport, type CoachSection } from "@/lib/wealth-coach";
import type { HealthScoreInput } from "@/lib/health-score-engine";
import { IconCoach, IconTarget, IconAlert, IconCheck, IconSparkles } from "@/components/ui/Icons";

export function CoachClient(data: HealthScoreInput) {
  const report = generateWealthCoachReport(data);

  const sectionToneMap: Record<string, { bg: string; border: string; headerColor: string }> = {
    success: { bg: "var(--success-soft)", border: "var(--success)", headerColor: "var(--success)" },
    warning: { bg: "var(--warning-soft)", border: "var(--warning)", headerColor: "var(--warning)" },
    danger: { bg: "var(--danger-soft)", border: "var(--danger)", headerColor: "var(--danger)" },
    primary: { bg: "var(--primary-soft)", border: "var(--primary)", headerColor: "var(--primary)" },
    neutral: { bg: "var(--surface-2)", border: "var(--border)", headerColor: "var(--text-heading)" },
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
            <IconCoach size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Strategic Wealth Coach & Advisory</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Advisory v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Weekly actionable wealth management steps, prioritized liquidity checklists & capital compounding guidance</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Action Item</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      {/* Overall Card */}
      <Card variant="glass" className="text-center py-6 border border-indigo-500/30 shadow-lg">
        <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center mb-3 shadow-lg text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
          <IconCoach size={28} />
        </div>
        <h2 className="text-xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Weekly Strategic Wealth Coaching</h2>
        <p className="text-xs font-mono font-bold tracking-wider uppercase mt-1 text-indigo-400">{report.period}</p>
        <div className="mt-3">
          <Badge tone={report.overallTone === "success" ? "success" : report.overallTone === "danger" ? "danger" : "warning"}>
            {report.overallTone === "success" ? "On Track" : report.overallTone === "danger" ? "Needs Action" : "Caution"}
          </Badge>
        </div>
      </Card>

      {/* Sections */}
      <div className="grid sm:grid-cols-2 gap-4">
        {report.sections.map(section => {
          const stc = sectionToneMap[section.tone] || sectionToneMap.neutral;
          return (
            <Card key={section.title} className="h-full flex flex-col justify-between border" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-center gap-2.5 mb-3 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: stc.headerColor }}>
                    {section.tone === "danger" || section.tone === "warning" ? <IconAlert size={18} /> : <IconSparkles size={18} />}
                  </span>
                  <h3 className="text-sm font-extrabold tracking-tight" style={{ color: stc.headerColor }}>{section.title}</h3>
                </div>
                <div className="space-y-2 pt-1">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl border shadow-sm" style={{ background: stc.bg, borderColor: "var(--border)" }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: stc.headerColor }} />
                      <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text)" }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Weekly Goal */}
      <Card className="border border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent shadow-lg">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-2xl grid place-items-center bg-indigo-500/20 text-indigo-400 shrink-0 shadow-sm">
            <IconTarget size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">Current Week Milestone Target</p>
            <p className="text-sm sm:text-base font-bold mt-1 leading-snug" style={{ color: "var(--text-heading)" }}>{report.weeklyGoal}</p>
          </div>
        </div>
      </Card>

      {/* Next Week Actions */}
      <Card title="Recommended Action Steps" subtitle="Prioritized checklist to optimize household financial health">
        <div className="space-y-2.5 pt-2">
          {report.nextWeekActions.map((action, i) => (
            <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl border shadow-sm" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
              <span className="w-7 h-7 rounded-lg grid place-items-center text-xs font-extrabold font-mono shrink-0 shadow-sm" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                {i + 1}
              </span>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed mt-1" style={{ color: "var(--text)" }}>{action}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
