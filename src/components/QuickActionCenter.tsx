"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { CATEGORY_GROUPS, BILL_CATEGORIES } from "@/lib/categories";

const inputStyle: React.CSSProperties = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

type QuickAddType = "income" | "expense" | "investment" | "goal" | "bill" | "debt" | "insurance" | "annual";

const TABS = [
  { id: "income",     label: "Income",     icon: "💰", color: "var(--success)" },
  { id: "expense",    label: "Expense",    icon: "💸", color: "var(--danger)"  },
  { id: "investment", label: "Invest",     icon: "📈", color: "var(--primary)" },
  { id: "goal",       label: "Goal",       icon: "🎯", color: "var(--accent)"  },
  { id: "bill",       label: "Bill",       icon: "🔔", color: "var(--warning)" },
  { id: "debt",       label: "Debt",       icon: "🏦", color: "var(--danger)"  },
  { id: "insurance",  label: "Insurance",  icon: "🛡️", color: "var(--success)" },
  { id: "annual",     label: "Annual",     icon: "🗓️", color: "var(--primary)" },
] as const;

export function QuickActionCenter({ accounts }: { accounts: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formType, setFormType] = useState<QuickAddType>("expense");
  const [form, setForm] = useState({
    amount: "", category: "", accountId: accounts[0]?.id || "", note: "",
    name: "", type: "Stocks", symbol: "", schemeCode: "", units: "",
    goalName: "", goalCategory: "Emergency",
    billName: "", billCategory: "Electricity", dueDate: new Date().toISOString().split("T")[0],
    debtName: "", debtType: "PersonalLoan", principal: "", outstanding: "", rate: "", emi: "",
    insuranceName: "", insuranceType: "Health", premium: "", coverage: "", renewalDate: new Date().toISOString().split("T")[0],
    annualTitle: "", annualCategory: "Financial", annualTarget: "",
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
      let body: any = { amount: Number(form.amount), note: form.note, accountId: form.accountId };

      if (formType === "income" || formType === "expense") {
        endpoint = "/api/transactions";
        body = { ...body, type: formType, category: form.category, txnDate: new Date().toISOString().split("T")[0] };
      } else if (formType === "investment") {
        endpoint = "/api/manage/investments";
        body = { name: form.name, type: form.type, invested: Number(form.amount), currentValue: Number(form.amount), annualReturn: 0, symbol: form.symbol || null, schemeCode: form.schemeCode || null, units: form.units || null, startDate: new Date().toISOString().split("T")[0] };
      } else if (formType === "goal") {
        endpoint = "/api/manage/goals";
        body = { name: form.goalName, category: form.goalCategory, target: Number(form.amount), saved: 0, icon: "🎯" };
      } else if (formType === "bill") {
        endpoint = "/api/manage/bills";
        body = { name: form.billName, category: form.billCategory, amount: Number(form.amount), dueDate: form.dueDate, frequency: "Monthly" };
      } else if (formType === "debt") {
        endpoint = "/api/manage/debts";
        body = { name: form.debtName, type: form.debtType, principal: Number(form.principal || form.amount), outstanding: Number(form.outstanding || form.amount), interestRate: Number(form.rate || 0), emi: Number(form.emi || 0), tenureMonths: 12 };
      } else if (formType === "insurance") {
        endpoint = "/api/manage/insurance";
        body = { name: form.insuranceName, type: form.insuranceType, provider: "General", premium: Number(form.premium || form.amount), coverage: Number(form.coverage || 0), renewalDate: form.renewalDate };
      } else if (formType === "annual") {
        endpoint = "/api/manage/annual";
        body = { year: new Date().getFullYear(), title: form.annualTitle, category: form.annualCategory, targetAmount: Number(form.annualTarget || form.amount), progress: 0, status: "Planned" };
      }

      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setIsOpen(false); setForm({ ...form, amount: "", note: "" }); router.refresh(); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative mb-6">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="quick-add-btn w-full py-4 rounded-xl text-sm flex items-center justify-center gap-3">
          <span className="text-xl">⚡</span> Universal Quick Add
        </button>
      ) : (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <Card variant="glass" className="p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: "var(--border-accent)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-heading)" }}>
                <span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>⚡</span>
                Quick Entry
              </h3>
              <button onClick={() => setIsOpen(false)} className="btn btn-ghost w-8 h-8 rounded-full text-xs">✕</button>
            </div>

            {/* Type tabs */}
            <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 hide-scrollbar">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTypeChange(t.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                    formType === t.id ? "scale-105" : "opacity-50 hover:opacity-80"
                  }`}
                  style={{
                    background: formType === t.id ? t.color : "var(--surface-3)",
                    color: formType === t.id ? "#fff" : "var(--text)",
                  }}
                >
                  <span className="mr-1">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            {/* Amount + Account */}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Amount (₹)</label>
                <input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" autoFocus />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Account</label>
                <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: Number(e.target.value) })} className="input">
                  {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name} ({a.type})</option>))}
                </select>
              </div>
            </div>

            {/* Dynamic fields */}
            {formType === "income" || formType === "expense" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Category</label>
                  <div className="flex gap-2">
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input flex-1">
                      {Object.values(CATEGORY_GROUPS).flat().map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                      <option value="custom">Custom...</option>
                    </select>
                    {form.category === "custom" && (
                      <input placeholder="Custom" className="input flex-1" onChange={(e) => setForm({ ...form, category: e.target.value })} />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Note</label>
                  <input placeholder="Optional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input" />
                </div>
              </div>
            ) : formType === "investment" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Asset Name</label><input placeholder="HDFC Index Fund" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input"><option value="Stocks">Stocks</option><option value="MutualFunds">Mutual Funds</option><option value="Gold">Gold</option><option value="Other">Other</option></select></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Symbol / Code</label><input placeholder="RELIANCE.NS" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="input" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Units</label><input type="number" placeholder="Qty" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} className="input" /></div>
              </div>
            ) : formType === "goal" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Goal Name</label><input placeholder="New Car" value={form.goalName} onChange={(e) => setForm({ ...form, goalName: e.target.value })} className="input" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Category</label><select value={form.goalCategory} onChange={(e) => setForm({ ...form, goalCategory: e.target.value })} className="input"><option value="Emergency">Emergency</option><option value="Vacation">Vacation</option><option value="House">House</option><option value="Car">Car</option><option value="Education">Education</option><option value="Wedding">Wedding</option><option value="Retirement">Retirement</option><option value="Custom">Custom</option></select></div>
              </div>
            ) : formType === "bill" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Bill Name</label><input placeholder="Electricity" value={form.billName} onChange={(e) => setForm({ ...form, billName: e.target.value })} className="input" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Category</label><select value={form.billCategory} onChange={(e) => setForm({ ...form, billCategory: e.target.value })} className="input">{BILL_CATEGORIES.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" /></div>
              </div>
            ) : formType === "debt" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Loan Name</label><input placeholder="Car Loan" value={form.debtName} onChange={(e) => setForm({ ...form, debtName: e.target.value })} className="input" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Type</label><select value={form.debtType} onChange={(e) => setForm({ ...form, debtType: e.target.value })} className="input"><option value="HomeLoan">Home Loan</option><option value="CarLoan">Car Loan</option><option value="EducationLoan">Education Loan</option><option value="PersonalLoan">Personal Loan</option><option value="CreditCard">Credit Card</option></select></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Interest (%)</label><input type="number" placeholder="8.5" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} className="input" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>EMI (₹)</label><input type="number" placeholder="Monthly EMI" value={form.emi} onChange={(e) => setForm({ ...form, emi: e.target.value })} className="input" /></div>
              </div>
            ) : formType === "insurance" ? (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Policy Name</label><input placeholder="HDFC Life" value={form.insuranceName} onChange={(e) => setForm({ ...form, insuranceName: e.target.value })} className="input" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Type</label><select value={form.insuranceType} onChange={(e) => setForm({ ...form, insuranceType: e.target.value })} className="input"><option value="Health">Health</option><option value="Life">Life</option><option value="Vehicle">Vehicle</option><option value="Property">Property</option></select></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Coverage (₹)</label><input type="number" placeholder="500000" value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} className="input" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Renewal</label><input type="date" value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} className="input" /></div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Plan Title</label><input placeholder="Buy House" value={form.annualTitle} onChange={(e) => setForm({ ...form, annualTitle: e.target.value })} className="input" /></div>
                <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Category</label><select value={form.annualCategory} onChange={(e) => setForm({ ...form, annualCategory: e.target.value })} className="input"><option value="Financial">Financial</option><option value="Savings">Savings</option><option value="Investment">Investment</option><option value="Tax">Tax</option><option value="Purchase">Purchase</option></select></div>
              </div>
            )}

            <button onClick={submit} disabled={loading || !form.amount} className="quick-add-btn w-full py-3 rounded-xl text-sm disabled:opacity-40">
              {loading ? "Saving..." : `Save ${formType.charAt(0).toUpperCase() + formType.slice(1)}`}
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
