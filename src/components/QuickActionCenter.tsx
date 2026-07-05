"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { inr } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

export function QuickActionCenter({ accounts }: { accounts: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "income",
    amount: "",
    category: "Salary",
    accountId: accounts[0]?.id || "",
    note: "",
  });

  const presets = [
    { label: "Salary", type: "income", category: "Salary", icon: "💰" },
    { label: "Freelance", type: "income", category: "Freelance", icon: "💻" },
    { label: "Quick Expense", type: "expense", category: "Food", icon: "💸" },
    { label: "Other", type: "income", category: "Other", icon: "✨" },
  ];

  const handlePreset = (p: typeof presets[0]) => {
    setForm({ ...form, type: p.type, category: p.category });
  };

  const submit = async () => {
    if (!form.amount || !form.accountId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          txnDate: new Date().toISOString().split("T")[0],
        }),
      });
      if (res.ok) {
        setIsOpen(false);
        setForm({ ...form, amount: "", note: "" });
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mb-6">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)} 
          className="w-full py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white" }}
        >
          <span className="text-xl">⚡</span> Quick Add Transaction
        </button>
      ) : (
        <Card className="p-5 shadow-2xl border-2" style={{ borderColor: "var(--primary)" }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <span className="text-lg">⚡</span> Quick Entry
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-xs opacity-50 hover:opacity-100">Close ✕</button>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
                className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${form.type === p.type && form.category === p.category ? 'ring-2 ring-offset-2' : 'opacity-70 hover:opacity-100'}`}
                style={{ 
                  background: p.type === "income" ? "var(--success-soft)" : "var(--danger-soft)", 
                  color: p.type === "income" ? "var(--success)" : "var(--danger)",
                  outlineColor: p.type === "income" ? "var(--success)" : "var(--danger)"
                }}
              >
                <span className="block text-sm mb-1">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-60">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-50">₹</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.amount} 
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 rounded-lg text-sm border" 
                  style={inputStyle} 
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-60">Account</label>
              <select 
                value={form.accountId} 
                onChange={(e) => setForm({ ...form, accountId: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm border" 
                style={inputStyle}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
             <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-60">Category</label>
              <input 
                placeholder="Salary, Freelance, etc." 
                value={form.category} 
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border" 
                style={inputStyle} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-60">Note (Optional)</label>
              <input 
                placeholder="Add a note..." 
                value={form.note} 
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border" 
                style={inputStyle} 
              />
            </div>
          </div>

          <button 
            onClick={submit} 
            disabled={loading || !form.amount}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "Processing..." : `Save ${form.type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </Card>
      )}
    </div>
  );
}
