"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { inr } from "@/lib/format";
import {
  generateDreamPlannerReport,
  planDream,
  DREAM_PRESETS,
  type DreamCategory,
  type DreamInput,
  type DreamPlan,
  type DreamPlannerReport,
} from "@/lib/dream-planner";
import type {
  TransactionRow, AccountRow, InvestmentRow, DebtRow,
  BillRow, GoalRow,
} from "@/lib/types";

type DreamsData = {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
};

export function DreamsClient(data: DreamsData) {
  const report = generateDreamPlannerReport(data);
  const [customDreams, setCustomDreams] = useState<DreamPlan[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newDream, setNewDream] = useState<DreamInput>({
    name: "",
    category: "custom",
    targetAmount: 500000,
    timelineYears: 5,
    priority: "should",
  });

  const allDreams = [...report.dreams, ...customDreams];

  const handleAddDream = () => {
    if (!newDream.name || newDream.targetAmount <= 0) return;
    const plan = planDream(newDream, report.monthlySavings, report.netWorth);
    setCustomDreams(prev => [...prev, plan]);
    setNewDream({ name: "", category: "custom", targetAmount: 500000, timelineYears: 5, priority: "should" });
    setShowAdd(false);
  };

  const handlePreset = (preset: typeof DREAM_PRESETS[number]) => {
    setNewDream(prev => ({
      ...prev,
      name: prev.name || preset.label,
      category: preset.category,
      targetAmount: preset.defaultAmount,
      timelineYears: preset.defaultYears,
    }));
    setShowAdd(true);
  };

  const removeCustom = (idx: number) => {
    setCustomDreams(prev => prev.filter((_, i) => i !== idx));
  };

  const affordColor = (a: string) =>
    a === "affordable" ? "var(--success)" :
    a === "stretch" ? "var(--warning)" : "var(--danger)";

  const riskColor = (r: string) =>
    r === "low" ? "var(--success)" :
    r === "medium" ? "var(--warning)" : "var(--danger)";

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 kpi-scroll lg:grid stagger-wide slide-in-up">
        <KpiCard label="Net Worth" value={inr(report.netWorth, { compact: true })} icon="💎" tone="primary" />
        <KpiCard label="Monthly Savings" value={inr(report.monthlySavings, { compact: true })} icon="💰" tone="success" />
        <KpiCard label="Dreams Planned" value={`${allDreams.length}`} icon="✨" tone="primary" />
        <KpiCard
          label="Monthly Needed"
          value={inr(allDreams.reduce((s, d) => s + d.monthlyInvestment, 0), { compact: true })}
          icon="🎯"
          tone={allDreams.reduce((s, d) => s + d.monthlyInvestment, 0) <= report.monthlySavings ? "success" : "danger"}
        />
      </div>

      {/* Overall Assessment */}
      <Card>
        <div className="text-center py-3">
          <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center text-3xl mb-3 shadow-lg gradient-primary">🌟</div>
          <h2 className="text-xl font-extrabold" style={{ color: "var(--text-heading)" }}>Dream Planner</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {report.overallAffordability === "all achievable"
              ? "🎉 All your dreams are within reach!"
              : report.overallAffordability === "needs optimization"
              ? "⚡ Some dreams need adjustments to be achievable"
              : "🎯 Focus on your top priorities first"}
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <Badge tone={report.overallAffordability === "all achievable" ? "success" : report.overallAffordability === "needs optimization" ? "warning" : "danger"}>
              {report.overallAffordability === "all achievable" ? "✅ Achievable" : report.overallAffordability === "needs optimization" ? "⚡ Optimize" : "🎯 Prioritize"}
            </Badge>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              Need {inr(allDreams.reduce((s, d) => s + d.monthlyInvestment, 0))}/mo · Have {inr(report.monthlySavings)}/mo
            </span>
          </div>
        </div>
        <div className="p-3 rounded-xl mt-2" style={{ background: "var(--primary-soft)", border: "1px solid var(--border-accent)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>💡 {report.topRecommendation}</p>
        </div>
      </Card>

      {/* Quick Add Presets */}
      <Card title="Add a Dream" subtitle="Pick a dream to start planning">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DREAM_PRESETS.map(preset => (
            <button
              key={preset.category}
              onClick={() => handlePreset(preset)}
              className="p-3 rounded-xl text-center transition-all active:scale-95"
              style={{
                background: "var(--surface-2)",
                border: "2px solid var(--border)",
                minHeight: "72px",
              }}
            >
              <span className="text-2xl">{preset.icon}</span>
              <p className="text-xs font-bold mt-1" style={{ color: "var(--text-heading)" }}>{preset.label}</p>
              <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{inr(preset.defaultAmount, { compact: true })}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Dream Cards */}
      {allDreams.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <span className="text-4xl">🌟</span>
            <p className="text-lg font-bold mt-2" style={{ color: "var(--text-heading)" }}>No dreams planned yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Pick a preset above or add a custom dream</p>
          </div>
        </Card>
      )}

      {allDreams.map((dream, idx) => {
        const preset = DREAM_PRESETS.find(p => p.category === dream.dream.category);
        return (
          <Card key={idx}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl grid place-items-center text-xl shadow-md"
                  style={{ background: `${preset?.color || "var(--primary)"}22`, border: `2px solid ${preset?.color || "var(--primary)"}44` }}
                >
                  {preset?.icon || "🎯"}
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: "var(--text-heading)" }}>{dream.dream.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge tone={dream.dream.priority === "must" ? "danger" : dream.dream.priority === "should" ? "warning" : "success"}>
                      {dream.dream.priority === "must" ? "🔴 Must" : dream.dream.priority === "should" ? "🟡 Should" : "🟢 Nice to have"}
                    </Badge>
                    <Badge tone={dream.affordability === "affordable" ? "success" : dream.affordability === "stretch" ? "warning" : "danger"}>
                      {dream.affordability === "affordable" ? "✅ Affordable" : dream.affordability === "stretch" ? "⚡ Stretch" : "⚠️ Difficult"}
                    </Badge>
                  </div>
                </div>
              </div>
              {idx >= report.dreams.length && (
                <button onClick={() => removeCustom(idx - report.dreams.length)} className="btn btn-ghost text-xs px-2 py-1">✕</button>
              )}
            </div>

            {/* Target & Monthly */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <MiniStat label="Target" value={inr(dream.dream.targetAmount, { compact: true })} color="var(--text-heading)" />
              <MiniStat label="Monthly SIP" value={inr(dream.monthlyInvestment)} color={affordColor(dream.affordability)} />
              <MiniStat label="Timeline" value={`${dream.yearsToAchieve} yr`} color="var(--primary)" />
              <MiniStat label="Risk" value={dream.riskLevel} color={riskColor(dream.riskLevel)} />
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                <span style={{ color: "var(--text-faint)" }}>Progress from Net Worth</span>
                <span style={{ color: "var(--primary)" }}>{dream.progressPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, dream.progressPct)}%`, background: `linear-gradient(90deg, var(--primary), var(--accent))` }} />
              </div>
            </div>

            {/* Milestones */}
            {dream.milestones.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>Milestones</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {dream.milestones.filter((_, i) => i % Math.max(1, Math.floor(dream.milestones.length / 5)) === 0 || i === dream.milestones.length - 1).map((m, mi) => (
                    <div key={mi} className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-center" style={{ background: "var(--surface-2)", minWidth: "70px" }}>
                      <p className="text-[10px] font-bold" style={{ color: "var(--primary)" }}>Yr {m.year}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{inr(m.accumulated, { compact: true })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy */}
            <div className="p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Strategy</p>
              <ul className="space-y-1">
                {dream.strategy.map((s, si) => (
                  <li key={si} className="text-xs flex items-start gap-1.5" style={{ color: "var(--text)" }}>
                    <span className="mt-0.5 flex-shrink-0">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] mt-2 italic" style={{ color: "var(--text-faint)" }}>
                📊 {dream.riskNote}
              </p>
            </div>
          </Card>
        );
      })}

      {/* Add Custom Dream Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div
            className="relative w-full max-w-md rounded-2xl p-5 scale-in"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: "var(--text-heading)" }}>✨ Add Dream</h3>
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost w-9 h-9 rounded-full">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-faint)" }}>Dream Name</label>
                <input
                  type="text"
                  value={newDream.name}
                  onChange={e => setNewDream(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="e.g. My Dream Home"
                  style={{ minHeight: "44px" }}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-faint)" }}>Category</label>
                <select
                  value={newDream.category}
                  onChange={e => setNewDream(prev => ({ ...prev, category: e.target.value as DreamCategory }))}
                  className="input"
                  style={{ minHeight: "44px" }}
                >
                  {DREAM_PRESETS.map(p => (
                    <option key={p.category} value={p.category}>{p.icon} {p.label}</option>
                  ))}
                  <option value="custom">🎯 Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-faint)" }}>Target Amount (₹)</label>
                  <input
                    type="number"
                    value={newDream.targetAmount}
                    onChange={e => setNewDream(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                    className="input"
                    style={{ minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-faint)" }}>Timeline (Years)</label>
                  <input
                    type="number"
                    value={newDream.timelineYears}
                    onChange={e => setNewDream(prev => ({ ...prev, timelineYears: Number(e.target.value) }))}
                    className="input"
                    min={1}
                    max={40}
                    style={{ minHeight: "44px" }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-faint)" }}>Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["must", "should", "nice"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewDream(prev => ({ ...prev, priority: p }))}
                      className="p-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: newDream.priority === p ? "var(--primary-soft)" : "var(--surface-2)",
                        border: newDream.priority === p ? "2px solid var(--primary)" : "2px solid var(--border)",
                        color: newDream.priority === p ? "var(--primary)" : "var(--text-muted)",
                        minHeight: "44px",
                      }}
                    >
                      {p === "must" ? "🔴 Must" : p === "should" ? "🟡 Should" : "🟢 Nice"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddDream}
                disabled={!newDream.name || newDream.targetAmount <= 0}
                className="btn btn-primary w-full py-2.5 text-sm"
                style={{ minHeight: "44px" }}
              >
                ✨ Add Dream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2.5 rounded-lg text-center" style={{ background: "var(--surface-2)" }}>
      <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="text-sm font-extrabold mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}
