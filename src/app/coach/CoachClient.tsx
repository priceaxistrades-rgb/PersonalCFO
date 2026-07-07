"use client";

import { Card, Badge } from "@/components/ui/Card";
import { generateWealthCoachReport, type WealthCoachReport, type CoachSection } from "@/lib/wealth-coach";
import type { HealthScoreInput } from "@/lib/health-score-engine";

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
    <div className="space-y-4">
      {/* Overall */}
      <Card className="text-center py-4" style={{ borderColor: `var(--${report.overallTone})` }}>
        <div className="inline-flex w-12 h-12 rounded-2xl grid place-items-center text-2xl mb-2 shadow-lg gradient-primary">🧠</div>
        <h2 className="text-lg font-extrabold" style={{ color: "var(--text-heading)" }}>Weekly Financial Report</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{report.period}</p>
        <Badge tone={report.overallTone === "success" ? "success" : report.overallTone === "danger" ? "danger" : "warning"}>
          {report.overallTone === "success" ? "✅ On Track" : report.overallTone === "danger" ? "🚨 Needs Work" : "⚠️ Caution"}
        </Badge>
      </Card>

      {/* Sections */}
      {report.sections.map(section => {
        const stc = sectionToneMap[section.tone] || sectionToneMap.neutral;
        return (
          <Card key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{section.icon}</span>
              <h3 className="text-sm font-bold" style={{ color: stc.headerColor }}>{section.title}</h3>
            </div>
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: stc.bg, border: `1px solid ${stc.border}22` }}>
                  <span className="text-xs mt-0.5" style={{ color: stc.headerColor }}>•</span>
                  <p className="text-xs" style={{ color: "var(--text)" }}>{item}</p>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Weekly Goal */}
      <Card style={{ borderColor: "var(--border-accent)", background: "linear-gradient(135deg, var(--primary-soft), var(--accent-soft, var(--primary-soft)))" }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>This Week's Goal</p>
            <p className="text-sm mt-1" style={{ color: "var(--text)" }}>{report.weeklyGoal}</p>
          </div>
        </div>
      </Card>

      {/* Next Week Actions */}
      <Card title="📋 Next Week Actions" subtitle="Steps to improve your finances">
        <div className="space-y-2">
          {report.nextWeekActions.map((action, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <span className="w-6 h-6 rounded-lg grid place-items-center text-xs font-bold flex-shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                {i + 1}
              </span>
              <p className="text-sm" style={{ color: "var(--text)" }}>{action}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
