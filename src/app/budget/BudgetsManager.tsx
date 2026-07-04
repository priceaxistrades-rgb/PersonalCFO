"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
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
    <Card title="📊 Manage Budgets" subtitle={`${budgets.length} categories · synced from Expense categories`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 no-print">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Budget spending is calculated automatically from the Expense tab. Category names must match expense categories.
        </p>
        <button onClick={() => { setShowAdd(!showAdd); setEditing(null); setError(""); }} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
          {showAdd ? "Cancel" : "+ Add Budget"}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="space-y-3 mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
          {error && <div className="rounded-lg p-2 text-xs" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>}
          <div className="grid sm:grid-cols-[1fr_180px_auto] gap-3 items-start">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border mt-1"
                style={inputStyle}
              >
                {BUDGET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
                <option value={CUSTOM_CATEGORY}>+ Custom</option>
              </select>
              {form.category === CUSTOM_CATEGORY && (
                <input
                  value={form.customCategory}
                  onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                  placeholder="Custom category"
                  className="w-full px-3 py-2 rounded-lg text-sm border mt-2"
                  style={inputStyle}
                  autoFocus
                />
              )}
            </label>

            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Monthly Limit
              <input
                type="number"
                placeholder="Monthly limit"
                value={form.monthlyLimit}
                onChange={(e) => setForm({ ...form, monthlyLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm border mt-1"
                style={inputStyle}
              />
            </label>

            <div className="flex gap-2 sm:pt-5">
              <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save</button>
              <button onClick={reset} className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Table headers={["Category", "Monthly Limit", "Actions"]} right={[1, 2]}>
        {budgets.map((b) => (
          <Tr key={b.id}>
            <Td><Badge>{b.category}</Badge></Td>
            <Td right strong>{inr(Number(b.monthlyLimit))}</Td>
            <Td right>
              <div className="flex justify-end gap-2 no-print">
                <button onClick={() => startEdit(b)} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => del(b.id)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}
