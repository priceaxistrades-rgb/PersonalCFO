"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none border";
const CUSTOM_CATEGORY = "__custom__";

export function TransactionForm({
  type,
  categories,
  members,
}: {
  type: "income" | "expense";
  categories: string[];
  members: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    category: categories[0],
    customCategory: "",
    amount: "",
    txnDate: today,
    memberId: "",
    note: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const finalCategory = form.category === CUSTOM_CATEGORY ? form.customCategory.trim() : form.category;
    if (!form.amount) return;
    if (!finalCategory) {
      setError("Please enter a custom category.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        category: finalCategory,
        amount: form.amount,
        txnDate: form.txnDate,
        memberId: form.memberId || null,
        note: form.note || null,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not save transaction.");
      return;
    }

    setForm({ ...form, category: categories[0], customCategory: "", amount: "", note: "" });
    setOpen(false);
    router.refresh();
  };

  const style = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

  return (
    <div className="no-print">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2"
        style={{ background: "var(--primary)" }}
      >
        {open ? "✕ Close" : `+ Add ${type === "income" ? "Income" : "Expense"}`}
      </button>

      {open && (
        <form onSubmit={submit} className="card p-4 mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          {error && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-lg p-2 text-xs" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Category
            <select
              className={inputCls}
              style={style}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value={CUSTOM_CATEGORY}>+ Custom</option>
            </select>
            {form.category === CUSTOM_CATEGORY && (
              <input
                className={`${inputCls} mt-2`}
                style={style}
                value={form.customCategory}
                onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                placeholder="Custom category"
                autoFocus
              />
            )}
          </label>

          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Amount (₹)
            <input
              type="number"
              className={inputCls}
              style={style}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
              required
            />
          </label>

          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Date
            <input
              type="date"
              className={inputCls}
              style={style}
              value={form.txnDate}
              onChange={(e) => setForm({ ...form, txnDate: e.target.value })}
            />
          </label>

          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Member
            <select
              className={inputCls}
              style={style}
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            >
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium sm:col-span-2 lg:col-span-1" style={{ color: "var(--text-muted)" }}>
            Note
            <input
              className={inputCls}
              style={style}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Optional"
            />
          </label>

          <button
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--success)", opacity: loading ? 0.75 : 1 }}
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}
