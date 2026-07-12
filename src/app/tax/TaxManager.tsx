"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Kpi";
import { estimateTax } from "@/lib/tax";
import { inr } from "@/lib/format";
import { IconTax, IconSparkles, IconCheck, IconAlert } from "@/components/ui/Icons";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

const FIELDS = [
  { key: "grossSalary", label: "Gross Salary (Annual)", hint: "Your total salary before deductions" },
  { key: "businessIncome", label: "Business / Professional Income", hint: "Income from business or freelancing" },
  { key: "capitalGains", label: "Capital Gains (LTCG Equity)", hint: "Profits from stocks/mutual funds" },
  { key: "section80c", label: "Section 80C", hint: "PPF, ELSS, EPF, LIC, Tuition (Max ₹1.5L)" },
  { key: "section80d", label: "Section 80D", hint: "Health insurance premium (Max ₹1L)" },
  { key: "hraExemption", label: "HRA Exemption", hint: "House rent allowance exemption" },
  { key: "homeLoanInterest", label: "Home Loan Interest", hint: "Section 24 - Max ₹2L" },
];

export function TaxManager({ initialProfile }: { initialProfile: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!initialProfile);
  const [form, setForm] = useState({
    regime: initialProfile?.regime || "new",
    grossSalary: initialProfile?.grossSalary || 0,
    businessIncome: initialProfile?.businessIncome || 0,
    capitalGains: initialProfile?.capitalGains || 0,
    section80c: initialProfile?.section80c || 0,
    section80d: initialProfile?.section80d || 0,
    hraExemption: initialProfile?.hraExemption || 0,
    homeLoanInterest: initialProfile?.homeLoanInterest || 0,
  });

  const result = useMemo(() => estimateTax(form), [form]);
  const totalIncome = Number(form.grossSalary) + Number(form.businessIncome) + Number(form.capitalGains);
  const effectiveRate = totalIncome > 0 ? (result.selectedTax / totalIncome) * 100 : 0;

  const save = async () => {
    await fetch("/api/manage/tax", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setIsEditing(false);
    router.refresh();
  };

  const reset = async () => {
    if (!confirm("Reset tax profile? This will clear all your tax data.")) return;
    await fetch("/api/manage/tax", { method: "DELETE" });
    setForm({
      regime: "new",
      grossSalary: 0,
      businessIncome: 0,
      capitalGains: 0,
      section80c: 0,
      section80d: 0,
      hraExemption: 0,
      homeLoanInterest: 0,
    });
    setIsEditing(true);
    router.refresh();
  };

  const DEDUCTIONS = [
    { label: "Section 80C", used: Number(form.section80c), max: 150000, note: "PPF, ELSS, EPF, LIC, Tuition" },
    { label: "Section 80D", used: Number(form.section80d), max: 100000, note: "Health insurance (self + parents)" },
    { label: "Section 24(b)", used: Number(form.homeLoanInterest), max: 200000, note: "Home loan interest" },
    { label: "NPS 80CCD(1B)", used: 0, max: 50000, note: "Extra ₹50k NPS deduction" },
    { label: "HRA Exemption", used: Number(form.hraExemption), max: 240000, note: "House rent allowance" },
  ];

  const unusedDeductions = DEDUCTIONS.reduce((s, d) => s + Math.max(0, d.max - d.used), 0);

  return (
    <div className="space-y-6 animate-fade-in w-full select-none">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
            <IconTax size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Tax Shield & Marginal Rate Engine</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Tax Engine v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Old vs New regime comparative marginal modeling, monitored 80C/80D deduction limits & capital gains calculations</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Taxable Profile</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4 text-center bg-surface-2 border" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Income</p>
          <p className="text-xl font-mono font-black mt-1" style={{ color: "var(--text-heading)" }}>{inr(totalIncome, { compact: true })}</p>
        </Card>
        <Card className="!p-4 text-center bg-surface-2 border" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Tax</p>
          <p className="text-xl font-mono font-black mt-1 text-red-400">{inr(result.selectedTax)}</p>
          <p className="text-[10px] uppercase font-mono font-bold text-indigo-400">{form.regime} regime</p>
        </Card>
        <Card className="!p-4 text-center bg-surface-2 border" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Effective Rate</p>
          <p className="text-xl font-mono font-black mt-1 text-amber-400">{effectiveRate.toFixed(1)}%</p>
        </Card>
        <Card className="!p-4 text-center bg-surface-2 border" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Unused Deductions</p>
          <p className="text-xl font-mono font-black mt-1 text-emerald-400">{inr(unusedDeductions, { compact: true })}</p>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2.5 no-print">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn btn-primary px-5 py-2 text-xs font-bold rounded-xl shadow-md"
        >
          {isEditing ? "Cancel Edit" : "Configure Tax Profile"}
        </button>
        {initialProfile && (
          <button
            onClick={reset}
            className="btn btn-secondary px-4 py-2 text-xs font-bold rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Reset Profile
          </button>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card title="Configure Income & Deductions" subtitle="Update annual compensation parameters for exact tax calculations">
          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <label className="text-xs font-bold text-slate-300">
              Selected Tax Regime
              <select
                value={form.regime}
                onChange={(e) => setForm({ ...form, regime: e.target.value })}
                className="input mt-1.5 font-bold"
              >
                <option value="new">New Regime (Lower marginal rates, zero 80C/HRA exemptions)</option>
                <option value="old">Old Regime (Higher marginal rates, full exemptions allowed)</option>
              </select>
            </label>
            
            {FIELDS.map((field) => (
              <label key={field.key} className="text-xs font-bold text-slate-300">
                {field.label}
                <input
                  type="number"
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                  className="input font-mono font-bold mt-1.5"
                  placeholder="0"
                />
                <span className="text-[10px] font-normal block mt-0.5 text-slate-400">
                  {field.hint}
                </span>
              </label>
            ))}
          </div>
          
          <div className="mt-5 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
            <h4 className="font-extrabold mb-1 text-sm text-indigo-300 flex items-center gap-2">
              <IconSparkles size={16} /> Recommendation Analysis
            </h4>
            <p className="text-xs font-semibold leading-relaxed" style={{ color: result.recommended === form.regime ? "var(--success)" : "var(--warning)" }}>
              {result.recommended === form.regime 
                ? `You are currently utilizing the optimal regime. You will save ${inr(Math.abs(result.taxOld - result.taxNew))} with the ${result.recommended.toUpperCase()} regime.`
                : `Switch to the ${result.recommended.toUpperCase()} regime to save ${inr(Math.abs(result.taxOld - result.taxNew))} annually in income taxes.`}
            </p>
          </div>
          
          <div className="flex gap-2.5 mt-5">
            <button
              onClick={save}
              className="btn btn-success px-6 py-2.5 text-xs font-bold rounded-xl shadow-md"
            >
              Confirm & Save Tax Profile
            </button>
          </div>
        </Card>
      )}

      {/* Tax Regime Comparison */}
      {!isEditing && (
        <Card title="Regime Comparative Assessment" subtitle="Side-by-side marginal rate calculations">
          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <div 
              className="p-5 rounded-2xl border-2 transition-all"
              style={{ 
                borderColor: result.recommended === "old" ? "var(--success)" : "var(--border)",
                background: result.recommended === "old" ? "var(--success-soft)" : "var(--surface-2)"
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-base" style={{ color: "var(--text-heading)" }}>Old Regime</span>
                {result.recommended === "old" && <Badge tone="success">Optimal Regime</Badge>}
              </div>
              <p className="text-3xl font-black font-mono" style={{ color: "var(--text-heading)" }}>{inr(result.taxOld)}</p>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Taxable Base: {inr(result.taxableOld)}
              </p>
            </div>
            
            <div 
              className="p-5 rounded-2xl border-2 transition-all"
              style={{ 
                borderColor: result.recommended === "new" ? "var(--success)" : "var(--border)",
                background: result.recommended === "new" ? "var(--success-soft)" : "var(--surface-2)"
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-base" style={{ color: "var(--text-heading)" }}>New Regime</span>
                {result.recommended === "new" && <Badge tone="success">Optimal Regime</Badge>}
              </div>
              <p className="text-3xl font-black font-mono" style={{ color: "var(--text-heading)" }}>{inr(result.taxNew)}</p>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Taxable Base: {inr(result.taxableNew)}
              </p>
            </div>
          </div>
          
          {result.cgTax > 0 && (
            <p className="text-xs font-mono font-bold text-slate-400 mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              + {inr(result.cgTax)} Long Term Capital Gains Tax (LTCG @ 12.5%)
            </p>
          )}
        </Card>
      )}

      {/* Deductions Progress */}
      <Card title="Deduction Utilization Tracking" subtitle="Monitored 80C, 80D, and Section 24 limits">
        <div className="space-y-4 pt-1">
          {DEDUCTIONS.map((d) => {
            const pct = Math.min(100, (d.used / d.max) * 100);
            return (
              <div key={d.label} className="p-3 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>
                    {d.label}
                    <span className="text-slate-400 font-normal ml-2">{d.note}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {inr(d.used)} / {inr(d.max)}
                  </span>
                </div>
                <Progress value={pct} tone={pct >= 100 ? "success" : pct >= 50 ? "primary" : "warning"} height={7} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Empty State */}
      {!initialProfile && !isEditing && (
        <div className="card p-12 text-center border border-dashed rounded-2xl bg-surface-2/40" style={{ borderColor: "var(--border-strong)" }}>
          <span className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 grid place-items-center mx-auto mb-4">
            <IconTax size={28} />
          </span>
          <h3 className="text-lg font-extrabold mb-1" style={{ color: "var(--text-heading)" }}>No Tax Profile Initialized</h3>
          <p className="text-xs text-slate-400 mb-5 max-w-md mx-auto leading-relaxed">
            Input your annual compensation parameters to compute marginal tax liability and determine your optimal regime.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary px-6 py-2.5 text-xs font-bold rounded-xl shadow-md"
          >
            + Initialize Tax Profile
          </button>
        </div>
      )}
    </div>
  );
}
