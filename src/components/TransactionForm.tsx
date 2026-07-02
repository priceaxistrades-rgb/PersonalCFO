"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full px-3 py-2 rounded-lg text-sm outline-none border";

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
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    category: categories[0],
    amount: "",
    txnDate: today,
    memberId: "",
    note: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    setLoading(true);
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type }),
    });
    setLoading(false);
    setForm({ ...form, amount: "", note: "" });
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
        <form
          onSubmit={submit}
          className="card p-4 mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end"
        >
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Category
            <select
              className={inputCls}
              style={style}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
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
            style={{ background: "var(--success)" }}
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}
