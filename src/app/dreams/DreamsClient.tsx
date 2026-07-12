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
import {
  IconDreams, IconNetWorth, IconSavings, IconTarget,
  IconSparkles, IconCheck, IconAlert, IconPlus
} from "@/components/ui/Icons";

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
      name: preset.label,
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
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
            <IconDreams size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Dream Planner & Feasibility Modeling</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Aspirations v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Feasibility simulations, required monthly SIP calculations, and timeline projections against household capital</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Model Milestone Target</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Household Net Worth" value={inr(report.netWorth, { compact: true })} icon={<IconNetWorth size={18} />} tone="primary" />
        <KpiCard label="Net Monthly Savings" value={inr(report.monthlySavings, { compact: true })} icon={<IconSavings size={18} />} tone="success" />
        <KpiCard label="Dreams Configured" value={`${allDreams.length}`} icon={<IconDreams size={18} />} tone="primary" />
        <KpiCard
          label="Monthly SIP Needed"
          value={inr(allDreams.reduce((s, d) => s + d.monthlyInvestment, 0), { compact: true })}
          icon={<IconTarget size={18} />}
          tone={allDreams.reduce((s, d) => s + d.monthlyInvestment, 0) <= report.monthlySavings ? "success" : "danger"}
        />
      </div>

      {/* Overall Assessment Card */}
      <Card variant="glass" className="text-center py-6 border border-indigo-500/30 shadow-lg">
        <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center mb-3 shadow-lg text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
          <IconDreams size={28} />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>Milestone Readiness Engine</h2>
        <p className="text-xs font-semibold mt-1" style={{ color: "var(--text-muted)" }}>
          {report.overallAffordability === "all achievable"
            ? "All your planned milestones are achievable within your current capital allocation velocity."
            : report.overallAffordability === "needs optimization"
            ? "Certain milestones require timeline extensions or SIP adjustments to be fully funded."
            : "Focus on your highest priority aspirations first to prevent cash flow strain."}
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Badge tone={report.overallAffordability === "all achievable" ? "success" : report.overallAffordability === "needs optimization" ? "warning" : "danger"}>
            {report.overallAffordability === "all achievable" ? "Achievable" : report.overallAffordability === "needs optimization" ? "Optimize Required" : "Prioritize"}
          </Badge>
          <span className="text-xs font-mono font-bold" style={{ color: "var(--text-faint)" }}>
            Monthly Needed: {inr(allDreams.reduce((s, d) => s + d.monthlyInvestment, 0))}/mo · Available: {inr(report.monthlySavings)}/mo
          </span>
        </div>
        <div className="p-3.5 rounded-xl mt-4 mx-auto max-w-2xl border border-indigo-500/20 bg-indigo-500/10 text-left">
          <p className="text-xs font-bold text-indigo-300 flex items-center gap-2">
            <IconSparkles size={16} className="text-indigo-400 shrink-0" /> {report.topRecommendation}
          </p>
        </div>
      </Card>

      {/* Quick Add Presets */}
      <Card title="Milestone Templates" subtitle="Select a preset to model feasibility against household capital">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {DREAM_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              className="p-3 rounded-xl border bg-surface-2 transition-all text-left flex flex-col justify-between hover:border-indigo-500/40"
              style={{ borderColor: "var(--border)", minHeight: 76 }}
            >
              <span className="text-indigo-400 mb-2"><IconTarget size={18} /></span>
              <div>
                <p className="text-xs font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>{preset.label}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{inr(preset.defaultAmount, { compact: true })} · {preset.defaultYears} yrs</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Custom Dream Modal/Form */}
      {showAdd && (
        <Card className="border border-indigo-500/40 bg-indigo-500/10 p-5 shadow-xl animate-scale-in">
          <div className="flex justify-between items-center pb-3 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-indigo-300">Model Custom Milestone</h3>
            <button onClick={() => setShowAdd(false)} className="btn btn-ghost w-7 h-7 rounded-lg text-xs font-bold">✕</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Milestone Name</label>
              <input placeholder="E.g. Child Higher Education" value={newDream.name} onChange={e => setNewDream({ ...newDream, name: e.target.value })} className="input font-medium text-xs" autoFocus />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Target Amount (₹)</label>
              <input type="number" value={newDream.targetAmount} onChange={e => setNewDream({ ...newDream, targetAmount: Number(e.target.value) })} className="input font-mono font-bold text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Timeline (Years)</label>
              <input type="number" value={newDream.timelineYears} onChange={e => setNewDream({ ...newDream, timelineYears: Number(e.target.value) })} className="input font-mono font-bold text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Priority Level</label>
              <select value={newDream.priority} onChange={e => setNewDream({ ...newDream, priority: e.target.value as any })} className="input font-medium text-xs">
                <option value="must">Must Have (Non-negotiable)</option>
                <option value="should">Should Have (High priority)</option>
                <option value="could">Could Have (Aspirational)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2.5 justify-end mt-5 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={handleAddDream} className="btn btn-success px-5 py-2 text-xs font-bold shadow-md">Run Feasibility Model</button>
            <button onClick={() => setShowAdd(false)} className="btn btn-secondary px-4 py-2 text-xs font-bold">Cancel</button>
          </div>
        </Card>
      )}

      {/* Modeled Dreams List */}
      <div className="grid sm:grid-cols-2 gap-4">
        {allDreams.map((plan, idx) => {
          const isCustom = idx >= report.dreams.length;
          const dream = plan.dream;
          const projectedValue = plan.totalInvested + plan.expectedReturns;
          return (
            <Card key={`${dream.name}-${idx}`} className="flex flex-col justify-between border" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: affordColor(plan.affordability) }} />
                      <h4 className="font-extrabold text-base tracking-tight truncate" style={{ color: "var(--text-heading)" }}>{dream.name}</h4>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{inr(dream.targetAmount)} in {dream.timelineYears} yrs · <span className="uppercase text-[10px] font-bold text-indigo-400">{dream.priority}</span></p>
                  </div>
                  {isCustom && (
                    <button onClick={() => removeCustom(idx - report.dreams.length)} className="btn btn-ghost text-xs text-red-400 px-2 py-1 font-bold">Remove</button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
                  <div className="p-2.5 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Monthly SIP Needed</span>
                    <span className="text-sm font-extrabold mt-0.5 block" style={{ color: "var(--text-heading)" }}>{inr(plan.monthlyInvestment)}/mo</span>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Projected SIP Value</span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">{inr(projectedValue)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <span className="uppercase text-[10px] text-slate-400">Feasibility Status</span>
                  <Badge tone={plan.affordability === "affordable" ? "success" : plan.affordability === "stretch" ? "warning" : "danger"}>
                    {plan.affordability.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
