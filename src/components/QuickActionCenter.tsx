"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { inr } from "@/lib/format";
import { CATEGORY_GROUPS } from "@/lib/categories";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

type QuickAddType = "income" | "expense" | "investment" | "goal" | "bill" | "debt" | "insurance" | "annual";

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
    name: "",
    type: "Stocks",
    symbol: "",
    schemeCode: "",
    units: "",
    goalName: "",
    goalCategory: "Emergency",
    billName: "",
    billCategory: "Utilities",
    dueDate: new Date().toISOString().split("T")[0],
    debtName: "",
    debtType: "PersonalLoan",
    principal: "",
    outstanding: "",
    rate: "",
    emi: "",
    insuranceName: "",
    insuranceType: "Health",
    premium: "",
    coverage: "",
    renewalDate: new Date().toISOString().split("T")[0],
    annualTitle: "",
    annualCategory: "Financial",
    annualTarget: "",
  });

  const handleTypeChange = (type: QuickAddType) => {
    setFormType(type);
    if (type === "expense") setForm({ ...form, category: "Food" });
    if (type === "income") setForm({ ...form, category: "Salary" });
    if (type === "investment") setForm({ ...form, name: "", type: "Stocks" });
    if (type === "goal") setForm({ ...form, goalName: "", goalCategory: "Emergency" });
    if (type === "bill") setForm({ ...form, billName: "", billCategory: "Utilities" });
    if (type === "debt") setForm({ ...form, debtName: "", debtType: "PersonalLoan" });
    if (type === "insurance") setForm({ ...form, insuranceName: "", insuranceType: "Health" });
    if (type === "annual") setForm({ ...form, annualTitle: "", annualCategory: "Financial" });
  };

  const submit = async () => {
    if (!form.amount && !form.principal && !form.premium && !form.annualTarget) return;
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
      } else if (formType === "bill") {
        endpoint = "/api/manage/bills";
        body = {
          name: form.billName,
          category: form.billCategory,
          amount: Number(form.amount),
          dueDate: form.dueDate,
          frequency: "Monthly",
        };
      } else if (formType === "debt") {
        endpoint = "/api/manage/debts";
        body = {
          name: form.debtName,
          type: form.debtType,
          principal: Number(form.principal || form.amount),
          outstanding: Number(form.outstanding || form.amount),
          interestRate: Number(form.rate || 0),
          emi: Number(form.emi || 0),
          tenureMonths: 12,
        };
      } else if (formType === "insurance") {
        endpoint = "/api/manage/insurance";
        body = {
          name: form.insuranceName,
          type: form.insuranceType,
          provider: "General",
          premium: Number(form.premium || form.amount),
          coverage: Number(form.coverage || 0),
          renewalDate: form.renewalDate,
        };
      } else if (formType === "annual") {
        endpoint = "/api/manage/annual";
        body = {
          year: new Date().getFullYear(),
          title: form.annualTitle,
          category: form.annualCategory,
          targetAmount: Number(form.annualTarget || form.amount),
          progress: 0,
          status: "Planned",
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
          className="quick-add-btn w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-3"
        >
          <span className="text-xl">⚡</span> Universal Quick Add
        </button>
      ) : (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm scale-in"
          onClick={() => setIsOpen(false)}
        >
          <Card className="p-5 shadow-2xl w-full max-w-2xl" variant="glass" style={{ borderColor: "var(--primary)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
                <span className="text-lg">⚡</span> Financial Brain Entry
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-xs opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>Close ✕</button>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
              {(
                [
                  { id: "income", label: "Income", icon: "💰", color: "var(--success)" },
                  { id: "expense", label: "Expense", icon: "💸", color: "var(--danger)" },
                  { id: "investment", label: "Investment", icon: "📈", color: "var(--primary)" },
                  { id: "goal", label: "Goal", icon: "🎯", color: "var(--accent)" },
                  { id: "bill", label: "Bill", icon: "🔔", color: "var(--warning)" },
                  { id: "debt", label: "Debt", icon: "🏦", color: "var(--danger)" },
                  { id: "insurance", label: "Insurance", icon: "🛡️", color: "var(--success)" },
                  { id: "annual", label: "Annual Plan", icon: "🗓️", color: "var(--primary)" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTypeChange(t.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    formType === t.id ? 'ring-2 ring-offset-2 scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ 
                    background: formType === t.id ? t.color : "var(--surface-3)", 
                    color: formType === t.id ? "white" : "var(--text)",
                    outlineColor: t.color,
                  }}
                >
                  <span className="mr-1">{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.amount} 
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                  style={inputStyle} 
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Account</label>
                <select 
                  value={form.accountId} 
                  onChange={(e) => setForm({ ...form, accountId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
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
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Category</label>
                  <div className="flex gap-2">
                    <select 
                      value={form.category} 
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                      style={inputStyle}
                    >
                      {Object.values(CATEGORY_GROUPS).flat().map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    {form.category === "custom" && (
                      <input 
                        placeholder="Custom category" 
                        className="flex-1 px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                        style={inputStyle} 
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Note</label>
                  <input 
                    placeholder="Optional note..." 
                    value={form.note} 
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
              </div>
            ) : formType === "investment" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Asset Name</label>
                  <input 
                    placeholder="e.g. HDFC Index Fund" 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Type</label>
                  <select 
                    value={form.type} 
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle}
                  >
                    <option value="Stocks">Stocks</option>
                    <option value="MutualFunds">Mutual Funds</option>
                    <option value="Gold">Gold</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Symbol / Code</label>
                  <input 
                    placeholder="RELIANCE.NS or 12345" 
                    value={form.symbol} 
                    onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Units</label>
                  <input 
                    type="number" 
                    placeholder="Quantity" 
                    value={form.units} 
                    onChange={(e) => setForm({ ...form, units: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
              </div>
            ) : formType === "goal" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Goal Name</label>
                  <input 
                    placeholder="e.g. New Car" 
                    value={form.goalName} 
                    onChange={(e) => setForm({ ...form, goalName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Category</label>
                  <select 
                    value={form.goalCategory} 
                    onChange={(e) => setForm({ ...form, goalCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
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
            ) : formType === "bill" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Bill Name</label>
                  <input 
                    placeholder="e.g. Electricity" 
                    value={form.billName} 
                    onChange={(e) => setForm({ ...form, billName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Category</label>
                  <select 
                    value={form.billCategory} 
                    onChange={(e) => setForm({ ...form, billCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle}
                  >
                    <option value="Utilities">Utilities</option>
                    <option value="Rent">Rent</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Due Date</label>
                  <input 
                    type="date" 
                    value={form.dueDate} 
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
              </div>
            ) : formType === "debt" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Loan Name</label>
                  <input 
                    placeholder="e.g. Car Loan" 
                    value={form.debtName} 
                    onChange={(e) => setForm({ ...form, debtName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Type</label>
                  <select 
                    value={form.debtType} 
                    onChange={(e) => setForm({ ...form, debtType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle}
                  >
                    <option value="HomeLoan">Home Loan</option>
                    <option value="CarLoan">Car Loan</option>
                    <option value="EducationLoan">Education Loan</option>
                    <option value="PersonalLoan">Personal Loan</option>
                    <option value="CreditCard">Credit Card</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Interest Rate (%)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 8.5" 
                    value={form.rate} 
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>EMI (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Monthly EMI" 
                    value={form.emi} 
                    onChange={(e) => setForm({ ...form, emi: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
              </div>
            ) : formType === "insurance" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Policy Name</label>
                  <input 
                    placeholder="e.g. HDFC Life" 
                    value={form.insuranceName} 
                    onChange={(e) => setForm({ ...form, insuranceName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Type</label>
                  <select 
                    value={form.insuranceType} 
                    onChange={(e) => setForm({ ...form, insuranceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle}
                  >
                    <option value="Health">Health</option>
                    <option value="Life">Life</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Property">Property</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Coverage Amount</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 500000" 
                    value={form.coverage} 
                    onChange={(e) => setForm({ ...form, coverage: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Renewal Date</label>
                  <input 
                    type="date" 
                    value={form.renewalDate} 
                    onChange={(e) => setForm({ ...form, renewalDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Plan Title</label>
                  <input 
                    placeholder="e.g. Buy House" 
                    value={form.annualTitle} 
                    onChange={(e) => setForm({ ...form, annualTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-60" style={{ color: "var(--text-muted)" }}>Category</label>
                  <select 
                    value={form.annualCategory} 
                    onChange={(e) => setForm({ ...form, annualCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm border transition-all duration-200" 
                    style={inputStyle}
                  >
                    <option value="Financial">Financial</option>
                    <option value="Savings">Savings</option>
                    <option value="Investment">Investment</option>
                    <option value="Tax">Tax</option>
                    <option value="Purchase">Purchase</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              onClick={submit} 
              disabled={loading || !form.amount}
              className="quick-add-btn w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Processing..." : `Save ${formType.charAt(0).toUpperCase() + formType.slice(1)}`}
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
