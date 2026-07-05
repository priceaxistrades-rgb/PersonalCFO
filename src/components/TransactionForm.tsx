"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CUSTOM_CATEGORY = "__custom__";

export function TransactionForm({
  type,
  categories,
  members,
  accounts,
}: {
  type: "income" | "expense";
  categories: string[];
  members: { id: number; name: string }[];
  accounts?: { id: number; name: string; type: string; balance: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ category: categories[0], customCategory: "", amount: "", txnDate: today, memberId: "", accountId: "", note: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const finalCategory = form.category === CUSTOM_CATEGORY ? form.customCategory.trim() : form.category;
    if (!form.amount) return;
    if (!finalCategory) { setError("Please enter a custom category."); return; }
    setLoading(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, category: finalCategory, amount: form.amount, txnDate: form.txnDate, memberId: form.memberId || null, accountId: form.accountId || null, note: form.note || null }),
    });
    setLoading(false);
    if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error || "Could not save transaction."); return; }
    setForm({ ...form, category: categories[0], customCategory: "", amount: "", note: "" });
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="no-print">
      <button onClick={() => setOpen(!open)} className={`btn ${open ? "btn-ghost" : "btn-primary"} text-sm`}>
        {open ? "✕ Close" : `+ Add ${type === "income" ? "Income" : "Expense"}`}
      </button>

      {open && (
        <form onSubmit={submit} className="card p-5 mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end fade-in-up">
          {error && (
            <div className="sm:col-span-2 lg:col-span-3 p-3 rounded-lg text-sm font-medium" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>
          )}

          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input mt-1">
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              <option value={CUSTOM_CATEGORY}>+ Custom</option>
            </select>
            {form.category === CUSTOM_CATEGORY && (
              <input className="input mt-2" value={form.customCategory} onChange={(e) => setForm({ ...form, customCategory: e.target.value })} placeholder="Custom category" autoFocus />
            )}
          </label>

          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>
            Amount (₹)
            <input type="number" className="input mt-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" required />
          </label>

          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>
            Date
            <input type="date" className="input mt-1" value={form.txnDate} onChange={(e) => setForm({ ...form, txnDate: e.target.value })} />
          </label>

          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>
            Member
            <select className="input mt-1" value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
              <option value="">—</option>
              {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          </label>

          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>
            {type === "income" ? "Received In" : "Paid From"}
            <select className="input mt-1" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required>
              <option value="" disabled>Select account</option>
              {(accounts || []).map((a) => (<option key={a.id} value={a.id}>{a.name} · {a.type}</option>))}
            </select>
          </label>

          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>
            Note
            <input className="input mt-1" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" />
          </label>

          <button type="submit" disabled={loading} className="btn btn-success py-2.5 disabled:opacity-50">
            {loading ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}
