"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { IconBudgets } from "@/components/ui/Icons";
import { inr } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };
const CUSTOM_CATEGORY = "__custom__";
const BUDGET_CATEGORIES = [
  "Housing",
  "Food",
  "Groceries",
  "Electricity",
  "Water",
  "Gas",
  "Internet",
  "Mobile",
  "Transportation",
  "Fuel",
  "Insurance",
  "Medical",
  "Education",
  "Shopping",
  "Entertainment",
  "Subscriptions",
  "Travel",
  "Gifts",
  "Investments",
  "Miscellaneous",
];

export function BudgetsManager({ budgets }: { budgets: { id: number; category: string; monthlyLimit: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: BUDGET_CATEGORIES[0], customCategory: "", monthlyLimit: 0 });

  const reset = () => {
    setEditing(null);
    setShowAdd(false);
    setError("");
    setForm({ category: BUDGET_CATEGORIES[0], customCategory: "", monthlyLimit: 0 });
  };

  const finalCategory = () => form.category === CUSTOM_CATEGORY ? form.customCategory.trim() : form.category;

  const save = async () => {
    setError("");
    const category = finalCategory();
    if (!category) {
      setError("Please choose or enter a category.");
      return;
    }
    if (!Number.isFinite(Number(form.monthlyLimit)) || Number(form.monthlyLimit) < 0) {
      setError("Please enter a valid monthly limit.");
      return;
    }

    await fetch("/api/manage/budgets", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, category, monthlyLimit: form.monthlyLimit } : { category, monthlyLimit: form.monthlyLimit }),
    });
    reset();
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this budget category?")) return;
    await fetch("/api/manage/budgets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  const startEdit = (budget: { id: number; category: string; monthlyLimit: string }) => {
    const known = BUDGET_CATEGORIES.includes(budget.category);
    setEditing(budget.id);
    setShowAdd(false);
    setError("");
    setForm({
      category: known ? budget.category : CUSTOM_CATEGORY,
      customCategory: known ? "" : budget.category,
      monthlyLimit: Number(budget.monthlyLimit),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 shrink-0">
            <IconBudgets size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Monitored Budget Ceilings</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">Ceilings v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Set and track monthly spending limits with dynamic real-time category utilization meters</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => { setShowAdd(!showAdd); setEditing(null); setError(""); }}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>{showAdd ? "Cancel Ceiling Configuration ✕" : "+ Set Category Ceiling"}</span>
          </button>
        </div>
      </div>

      <Card title="Active Category Ceilings & Utilization" subtitle={`${budgets.length} monitored spending limits · auto-synced with categorized expenses`}>
        <div className="mb-5 pb-3 border-b no-print" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
          Monthly budget utilization metrics dynamically calculate your total actual outflow from exact expense category labels logged in the Expense Tracker.
        </p>
      </div>

      {(showAdd || editing) && (
        <div className="space-y-4 mb-6 p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 shadow-lg animate-fade-in no-print">
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
              {editing ? "Edit Spending Ceiling" : "Configure New Category Ceiling"}
            </h4>
            <button onClick={reset} className="btn btn-ghost w-7 h-7 rounded-lg text-xs">✕</button>
          </div>

          {error && <div className="rounded-xl p-3 text-xs font-bold border border-red-500/40 bg-red-500/10 text-red-400">{error}</div>}

          <div className="grid sm:grid-cols-[1fr_200px_auto] gap-4 items-start">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Target Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-bold border"
                style={inputStyle}
              >
                {BUDGET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
                <option value={CUSTOM_CATEGORY}>+ Custom Category Label</option>
              </select>
              {form.category === CUSTOM_CATEGORY && (
                <input
                  value={form.customCategory}
                  onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                  placeholder="Custom category name"
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-bold border mt-2"
                  style={inputStyle}
                  autoFocus
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Monthly Limit (₹)</label>
              <input
                type="number"
                placeholder="E.g., 15000"
                value={form.monthlyLimit}
                onChange={(e) => setForm({ ...form, monthlyLimit: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-mono font-extrabold border"
                style={inputStyle}
              />
            </div>

            <div className="flex gap-2 sm:pt-6">
              <button onClick={save} className="btn btn-success px-4 py-2.5 rounded-xl text-xs font-bold shadow-md">Confirm Limit</button>
              <button onClick={reset} className="btn btn-secondary px-3 py-2.5 rounded-xl text-xs font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Table headers={["Expense Category", "Monthly Ceiling (₹)", "Management Actions"]} right={[1, 2]}>
        {budgets.map((b) => (
          <Tr key={b.id}>
            <Td strong><Badge tone="primary">{b.category}</Badge></Td>
            <Td right strong className="font-mono text-indigo-300 text-sm font-bold">{inr(Number(b.monthlyLimit))}</Td>
            <Td right>
              <div className="flex justify-end gap-1.5 no-print">
                <button onClick={() => startEdit(b)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-indigo-500/20" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => del(b.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90" style={{ background: "var(--danger)" }}>Remove</button>
              </div>
            </Td>
          </Tr>
        ))}
        {!budgets.length && (
          <Tr><Td muted className="py-8 text-center" strong>No budget limits configured. Click '+ Set Category Ceiling' to monitor expenditures.</Td><Td muted>—</Td><Td right muted>—</Td></Tr>
        )}
      </Table>
    </Card>
    </div>
  );
}
