"use client";

import { Card, Badge } from "@/components/ui/Card";
import { inr } from "@/lib/format";
import { generateMorningBrief, type MorningBrief, type BriefItem } from "@/lib/morning-brief";
import type { HealthScoreInput } from "@/lib/health-score-engine";
import { useRouter } from "next/navigation";
import { IconBrief, IconTarget, IconAlert, IconSparkles, IconArrowRight } from "@/components/ui/Icons";

export function BriefClient(data: HealthScoreInput & { userName?: string }) {
  const brief = generateMorningBrief(data);
  const router = useRouter();

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
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 shrink-0">
            <IconBrief size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Executive Morning Briefing</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">Intelligence v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Automated daily intelligence feed prioritizing urgent liquidity risks, health factor alerts, and optimization steps</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Financial Entry</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      {/* Hero Greeting Card */}
      <Card variant="glass" className="text-center py-8 border border-indigo-500/30 shadow-xl">
        <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center mb-4 shadow-lg text-white" style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}>
          <IconBrief size={28} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>{brief.greeting}</h2>
        <p className="text-xs font-bold tracking-widest uppercase mt-1 text-indigo-400 font-mono">{brief.date}</p>
        <p className="text-sm sm:text-[15px] mt-4 max-w-xl mx-auto font-medium leading-relaxed" style={{ color: "var(--text)" }}>{brief.summary}</p>
      </Card>

      {/* Top Action Bento Banner */}
      <Card className="border border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent shadow-lg">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-2xl grid place-items-center bg-indigo-500/20 text-indigo-400 shrink-0 shadow-sm">
            <IconTarget size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">Recommended Executive Action</p>
            <p className="text-sm sm:text-base font-bold mt-1 leading-snug" style={{ color: "var(--text-heading)" }}>{brief.topAction}</p>
          </div>
        </div>
      </Card>

      {/* Bento Grid of Alerts */}
      <div className="bento-grid">
        {/* Left Column: Critical & Warnings */}
        <div className="bento-col-6 space-y-6">
          {criticalItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Critical Alerts
                </p>
                <Badge tone="danger">{criticalItems.length}</Badge>
              </div>
              <div className="space-y-2.5">
                {criticalItems.map(item => (
                  <BriefCard key={item.id} item={item} toneColors={toneColors} onClick={item.action ? () => router.push(item.action!) : undefined} />
                ))}
              </div>
            </div>
          )}

          {warningItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">Needs Attention</p>
                <Badge tone="warning">{warningItems.length}</Badge>
              </div>
              <div className="space-y-2.5">
                {warningItems.map(item => (
                  <BriefCard key={item.id} item={item} toneColors={toneColors} onClick={item.action ? () => router.push(item.action!) : undefined} />
                ))}
              </div>
            </div>
          )}

          {criticalItems.length === 0 && warningItems.length === 0 && (
            <Card className="py-12 text-center border-emerald-500/30 bg-emerald-500/5">
              <span className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 grid place-items-center mx-auto mb-3">
                <IconSparkles size={24} />
              </span>
              <p className="text-base font-bold text-emerald-400">No Urgent Action Required</p>
              <p className="text-xs text-slate-400 mt-1">All your accounts, bills, and spending allocations are strictly within safe parameters.</p>
            </Card>
          )}
        </div>

        {/* Right Column: Opportunities & Positive Metrics */}
        <div className="bento-col-6 space-y-6">
          {infoItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-400">Optimization Opportunities</p>
                <Badge tone="primary">{infoItems.length}</Badge>
              </div>
              <div className="space-y-2.5">
                {infoItems.map(item => (
                  <BriefCard key={item.id} item={item} toneColors={toneColors} onClick={item.action ? () => router.push(item.action!) : undefined} />
                ))}
              </div>
            </div>
          )}

          {goodItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">Positive Indicators</p>
                <Badge tone="success">{goodItems.length}</Badge>
              </div>
              <div className="space-y-2.5">
                {goodItems.map(item => (
                  <BriefCard key={item.id} item={item} toneColors={toneColors} onClick={item.action ? () => router.push(item.action!) : undefined} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BriefCard({ item, toneColors, onClick }: { item: BriefItem; toneColors: Record<string, { bg: string; border: string; text: string }>; onClick?: () => void }) {
  const tc = toneColors[item.tone] || toneColors.neutral;
  const isClickable = Boolean(onClick);
  return (
    <div
      className={`flex items-start gap-3.5 p-4 rounded-2xl transition-all duration-200 ${isClickable ? "cursor-pointer hover:scale-[1.015] hover:shadow-lg" : ""}`}
      style={{ background: tc.bg, border: `1px solid ${tc.border}` }}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (onClick) onClick(); } } : undefined}
    >
      <span className="shrink-0 mt-0.5" style={{ color: tc.text }}>
        {item.tone === "danger" || item.tone === "warning" ? <IconAlert size={20} /> : <IconSparkles size={20} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold tracking-tight" style={{ color: tc.text }}>{item.title}</p>
        <p className="text-xs mt-1 font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>{item.detail}</p>
      </div>
      {item.action && (
        <span className="shrink-0 px-2.5 py-1 rounded-lg border shadow-sm" style={{ borderColor: "var(--border)", color: tc.text }}>
          <IconArrowRight size={14} />
        </span>
      )}
    </div>
  );
}
