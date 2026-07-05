"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { inr } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

type QuickAddType = "income" | "expense" | "investment" | "goal";

export function QuickActionCenter({ accounts }: { accounts: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formType, setFormType] = useState<QuickAddType>("expense");
  const [form, setForm] = useState({
    amount: "",
    category: "",
    accountId: accounts[0]?.id || "",
    note: "",
    // For investments
    name: "",
    type: "Stocks",
    symbol: "",
    schemeCode: "",
    units: "",
    // For goals
    goalName: "",
    goalCategory: "Emergency",
  });

  const handleTypeChange = (type: QuickAddType) => {
    setFormType(type);
    if (type === "expense") setForm({ ...form, category: "Food" });
    if (type === "income") setForm({ ...form, category: "Salary" });
    if (type === "investment") setForm({ ...form, name: "", type: "Stocks" });
    if (type === "goal") setForm({ ...form, goalName: "", goalCategory: "Emergency" });
  };

  const submit = async () => {
    if (!form.amount) return;
    setLoading(true);
    try {
      let endpoint = "";
      let body: any = { 
        amount: Number(form.amount), 
        note: form.note,
        accountId: form.accountId
      };

      if (formType === "income" || formType === "expense") {
        endpoint = "/api/transactions";
        body = {
          ...body,
          type: formType,
          category: form.category,
          txnDate: new Date().toISOString().split("T")[0],
        };
      } else if (formType === "investment") {
        endpoint = "/api/manage/investments";
        body = {
          name: form.name,
          type: form.type,
          invested: Number(form.amount),
          currentValue: Number(form.amount),
          annualReturn: 0,
          symbol: form.symbol || null,
          schemeCode: form.schemeCode || null,
          units: form.units || null,
          startDate: new Date().toISOString().split("T")[0],
        };
      } else if (formType === "goal") {
        endpoint = "/api/manage/goals";
        body = {
          name: form.goalName,
          category: form.goalCategory,
          target: Number(form.amount),
          saved: 0,
          icon: "🎯",
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
          <span className="text-xl">⚡</span> Universal Quick Add
        </button>
      ) : (
        <Card className="p-5 shadow-2xl border-2" style={{ borderColor: "var(--primary)" }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <span className="text-lg">⚡</span> Financial Brain Entry
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-xs opacity-50 hover:opacity-100">Close ✕</button>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(
              [
                { id: "income", label: "Income", icon: "💰", color: "var(--success)" },
                { id: "expense", label: "Expense", icon: "💸", color: "var(--danger)" },
                { id: "investment", label: "Investment", icon: "📈", color: "var(--primary)" },
                { id: "goal", label: "Savings Goal", icon: "🎯", color: "var(--accent)" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => handleTypeChange(t.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${formType === t.id ? 'ring-2 ring-offset-2' : 'opacity-60 hover:opacity-100'}`}
                style={{ 
                  background: formType === t.id ? t.color : "var(--surface-3)", 
                  color: formType === t.id ? "white" : "var(--text)",
                  outlineColor: t.color
                }}
              >
                <span className="mr-1">{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-60">Amount (₹)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={form.amount} 
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border" 
                style={inputStyle} 
                autoFocus
              />
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

          {formType === "income" || formType === "expense" ? (
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
               <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60">Category</label>
                <input 
                  placeholder="Salary, Food, etc." 
                  value={form.category} 
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border" 
                  style={inputStyle} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60">Note</label>
                <input 
                  placeholder="Optional note..." 
                  value={form.note} 
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border" 
                  style={inputStyle} 
                />
              </div>
            </div>
          ) : formType === "investment" ? (
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60">Asset Name</label>
                <input 
                  placeholder="e.g. HDFC Index Fund" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border" 
                  style={inputStyle} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60">Type</label>
                <select 
                  value={form.type} 
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border" 
                  style={inputStyle}
                >
                  <option value="Stocks">Stocks</option>
                  <option value="MutualFunds">Mutual Funds</option>
                  <option value="Gold">Gold</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60">Symbol / Code</label>
                <input 
                  placeholder="RELIANCE.NS or 12345" 
                  value={form.symbol} 
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border" 
                  style={inputStyle} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60">Units</label>
                <input 
                  type="number" 
                  placeholder="Quantity" 
                  value={form.units} 
                  onChange={(e) => setForm({ ...form, units: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border" 
                  style={inputStyle} 
                />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60">Goal Name</label>
                <input 
                  placeholder="e.g. New Car" 
                  value={form.goalName} 
                  onChange={(e) => setForm({ ...form, goalName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border" 
                  style={inputStyle} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60">Category</label>
                <select 
                  value={form.goalCategory} 
                  onChange={(e) => setForm({ ...form, goalCategory: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border" 
                  style={inputStyle}
                >
                  <option value="Emergency">Emergency</option>
                  <option value="Vacation">Vacation</option>
                  <option value="House">House</option>
                  <option value="Car">Car</option>
                  <option value="Education">Education</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Retirement">Retirement</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
          )}

          <button 
            onClick={submit} 
            disabled={loading || !form.amount}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "Processing..." : `Save ${formType.charAt(0).toUpperCase() + formType.slice(1)}`}
          </button>
        </Card>
      )}
    </div>
  );
}
