"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Kpi";
import { estimateTax } from "@/lib/tax";
import { inr } from "@/lib/format";

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
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Income</p>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>{inr(totalIncome, { compact: true })}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Estimated Tax</p>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--danger)" }}>{inr(result.selectedTax)}</p>
          <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{form.regime} regime</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Effective Rate</p>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--warning)" }}>{effectiveRate.toFixed(1)}%</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Unused Deductions</p>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--success)" }}>{inr(unusedDeductions, { compact: true })}</p>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          {isEditing ? "Cancel" : "✏️ Edit Tax Profile"}
        </button>
        {initialProfile && (
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            🗑 Reset Profile
          </button>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card title="Edit Tax Details" subtitle="Update your income and deductions">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Tax Regime
              <select
                value={form.regime}
                onChange={(e) => setForm({ ...form, regime: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border mt-1"
                style={inputStyle}
              >
                <option value="new">New Regime (Lower rates, fewer deductions)</option>
                <option value="old">Old Regime (Higher deductions allowed)</option>
              </select>
            </label>
            
            {FIELDS.map((field) => (
              <label key={field.key} className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {field.label}
                <input
                  type="number"
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg text-sm border mt-1"
                  style={inputStyle}
                  placeholder="0"
                />
                <span className="text-[10px] block mt-0.5" style={{ color: "var(--text-faint)" }}>
                  {field.hint}
                </span>
              </label>
            ))}
          </div>
          
          <div className="mt-4 p-4 rounded-xl" style={{ background: "var(--surface-2)" }}>
            <h4 className="font-semibold mb-2 text-sm" style={{ color: "var(--text)" }}>
              💡 Recommendation
            </h4>
            <p className="text-sm" style={{ color: result.recommended === form.regime ? "var(--success)" : "var(--warning)" }}>
              {result.recommended === form.regime 
                ? `✓ You are using the optimal regime. You'll save ${inr(Math.abs(result.taxOld - result.taxNew))} with ${result.recommended} regime.`
                : `⚠️ Switch to ${result.recommended} regime to save ${inr(Math.abs(result.taxOld - result.taxNew))} in taxes.`}
            </p>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={save}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--success)" }}
            >
              Save Tax Profile
            </button>
          </div>
        </Card>
      )}

      {/* Tax Comparison */}
      {!isEditing && (
        <Card title="Tax Regime Comparison" subtitle="Old vs New regime calculations">
          <div className="grid sm:grid-cols-2 gap-4">
            <div 
              className="p-4 rounded-xl border-2"
              style={{ 
                borderColor: result.recommended === "old" ? "var(--success)" : "var(--border)",
                background: result.recommended === "old" ? "var(--success-soft)" : "var(--surface-2)"
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold" style={{ color: "var(--text)" }}>Old Regime</span>
                {result.recommended === "old" && <Badge tone="success">Recommended</Badge>}
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{inr(result.taxOld)}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Taxable: {inr(result.taxableOld)}
              </p>
            </div>
            
            <div 
              className="p-4 rounded-xl border-2"
              style={{ 
                borderColor: result.recommended === "new" ? "var(--success)" : "var(--border)",
                background: result.recommended === "new" ? "var(--success-soft)" : "var(--surface-2)"
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold" style={{ color: "var(--text)" }}>New Regime</span>
                {result.recommended === "new" && <Badge tone="success">Recommended</Badge>}
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{inr(result.taxNew)}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Taxable: {inr(result.taxableNew)}
              </p>
            </div>
          </div>
          
          {result.cgTax > 0 && (
            <p className="text-sm mt-4" style={{ color: "var(--text-muted)" }}>
              + {inr(result.cgTax)} Capital Gains Tax (LTCG @12.5%)
            </p>
          )}
        </Card>
      )}

      {/* Deductions Progress */}
      <Card title="Tax-Saving Deductions" subtitle="Track your 80C, 80D, and other deductions">
        <div className="space-y-4">
          {DEDUCTIONS.map((d) => {
            const pct = Math.min(100, (d.used / d.max) * 100);
            return (
              <div key={d.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {d.label}
                    <span className="text-xs ml-2" style={{ color: "var(--text-faint)" }}>{d.note}</span>
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
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
        <Card className="!p-8 text-center">
          <div className="text-4xl mb-3">🧮</div>
          <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>No Tax Profile Set</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Add your income details to calculate and compare tax under both regimes
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            + Create Tax Profile
          </button>
        </Card>
      )}
    </div>
  );
}
