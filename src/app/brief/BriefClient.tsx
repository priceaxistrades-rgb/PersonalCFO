"use client";

import { Card, Badge } from "@/components/ui/Card";
import { inr } from "@/lib/format";
import { generateMorningBrief, type MorningBrief, type BriefItem } from "@/lib/morning-brief";
import type { HealthScoreInput } from "@/lib/health-score-engine";
import { useRouter } from "next/navigation";

export function BriefClient(data: HealthScoreInput & { userName?: string }) {
  const brief = generateMorningBrief(data);
  const router = useRouter();

  const categoryColors: Record<string, string> = {
    cash: "var(--success)",
    bills: "var(--warning)",
    spending: "var(--danger)",
    investment: "var(--primary)",
    savings: "var(--accent)",
    risk: "var(--danger)",
    action: "var(--primary)",
  };

  const toneColors: Record<string, { bg: string; border: string; text: string }> = {
    success: { bg: "var(--success-soft)", border: "var(--success)", text: "var(--success)" },
    warning: { bg: "var(--warning-soft)", border: "var(--warning)", text: "var(--warning)" },
    danger: { bg: "var(--danger-soft)", border: "var(--danger)", text: "var(--danger)" },
    primary: { bg: "var(--primary-soft)", border: "var(--primary)", text: "var(--primary)" },
    neutral: { bg: "var(--surface-2)", border: "var(--border)", text: "var(--text-muted)" },
  };

  const criticalItems = brief.items.filter(i => i.tone === "danger");
  const warningItems = brief.items.filter(i => i.tone === "warning");
  const goodItems = brief.items.filter(i => i.tone === "success" || i.tone === "neutral");
  const infoItems = brief.items.filter(i => i.tone === "primary");

  return (
    <div className="space-y-4">
      {/* Greeting Card */}
      <Card className="text-center py-6" style={{ borderColor: "var(--border-accent)" }}>
        <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center text-3xl mb-3 shadow-lg gradient-primary">
          ☀️
        </div>
        <h2 className="text-lg font-extrabold" style={{ color: "var(--text-heading)" }}>{brief.greeting}</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{brief.date}</p>
        <p className="text-sm mt-3 max-w-md mx-auto" style={{ color: "var(--text)" }}>{brief.summary}</p>
      </Card>

      {/* Critical Alerts */}
      {criticalItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--danger)" }}>🚨 Critical Alerts</p>
          {criticalItems.map(item => (
            <BriefCard key={item.id} item={item} toneColors={toneColors} onClick={item.action ? () => router.push(item.action!) : undefined} />
          ))}
        </div>
      )}

      {/* Warnings */}
      {warningItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--warning)" }}>⚠️ Needs Attention</p>
          {warningItems.map(item => (
            <BriefCard key={item.id} item={item} toneColors={toneColors} onClick={item.action ? () => router.push(item.action!) : undefined} />
          ))}
        </div>
      )}

      {/* Good News */}
      {goodItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--success)" }}>✅ Looking Good</p>
          {goodItems.map(item => (
            <BriefCard key={item.id} item={item} toneColors={toneColors} onClick={item.action ? () => router.push(item.action!) : undefined} />
          ))}
        </div>
      )}

      {/* Opportunities */}
      {infoItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>💡 Opportunities</p>
          {infoItems.map(item => (
            <BriefCard key={item.id} item={item} toneColors={toneColors} onClick={item.action ? () => router.push(item.action!) : undefined} />
          ))}
        </div>
      )}

      {/* Top Action */}
      <Card style={{ borderColor: "var(--border-accent)", background: "linear-gradient(135deg, var(--primary-soft), var(--accent-soft, var(--primary-soft)))" }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>Today's Top Action</p>
            <p className="text-sm mt-1" style={{ color: "var(--text)" }}>{brief.topAction}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BriefCard({ item, toneColors, onClick }: { item: BriefItem; toneColors: Record<string, { bg: string; border: string; text: string }>; onClick?: () => void }) {
  const tc = toneColors[item.tone] || toneColors.neutral;
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      style={{ background: tc.bg, border: `1px solid ${tc.border}` }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <span className="text-xl flex-shrink-0">{item.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold" style={{ color: tc.text }}>{item.title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.detail}</p>
      </div>
      {item.action && (
        <span className="text-xs font-semibold flex-shrink-0" style={{ color: tc.text }}>→</span>
      )}
    </div>
  );
}
