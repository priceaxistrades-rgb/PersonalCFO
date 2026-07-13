"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CATEGORY_GROUPS, BILL_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { InvestmentForm } from "@/app/settings/InvestmentsManager";
import type { InvestmentRow, AccountOption } from "@/lib/types";
import {
  IconLightning, IconIncome, IconExpenses, IconInvestments,
  IconSavings, IconBills, IconDebt, IconInsurance, IconAnnual
} from "@/components/ui/Icons";

type QuickAddType = "income" | "expense" | "investment" | "goal" | "bill" | "debt" | "insurance" | "annual";

const TABS = [
  { id: "income",     label: "Income",     icon: IconIncome,     color: "var(--success)" },
  { id: "expense",    label: "Expense",    icon: IconExpenses,   color: "var(--danger)"  },
  { id: "investment", label: "Invest",     icon: IconInvestments,color: "var(--primary)" },
  { id: "goal",       label: "Goal",       icon: IconSavings,    color: "var(--accent)"  },
  { id: "bill",       label: "Bill",       icon: IconBills,      color: "var(--warning)" },
  { id: "debt",       label: "Debt",       icon: IconDebt,       color: "var(--danger)"  },
  { id: "insurance",  label: "Insurance",  icon: IconInsurance,  color: "var(--success)" },
  { id: "annual",     label: "Annual",     icon: IconAnnual,     color: "var(--primary)" },
] as const;

const inputStyle: React.CSSProperties = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

export function QuickActionCenter({ accounts = [], investments = [], defaultOpen = false, onClose }: { accounts?: any[]; investments?: any[]; defaultOpen?: boolean; onClose?: () => void; }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchedAccounts, setFetchedAccounts] = useState<any[]>([]);
  const [fetchedInvestments, setFetchedInvestments] = useState<any[]>([]);
  const [formType, setFormType] = useState<QuickAddType>("expense");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("Bank");
  const [newAccBalance, setNewAccBalance] = useState("");

  const close = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const activeAccounts = accounts.length > 0 ? accounts : fetchedAccounts;
  const activeInvestments = investments && investments.length > 0 ? investments : fetchedInvestments;

  const [form, setForm] = useState({
    amount: "", category: "", accountId: activeAccounts[0]?.id || "", note: "",
    name: "", type: "Stocks", symbol: "", schemeCode: "", units: "",
    goalName: "", goalCategory: "Emergency",
    billName: "", billCategory: "Electricity", dueDate: new Date().toISOString().split("T")[0],
    debtName: "", debtType: "PersonalLoan", principal: "", outstanding: "", rate: "", emi: "",
    insuranceName: "", insuranceType: "Health", premium: "", coverage: "", renewalDate: new Date().toISOString().split("T")[0],
    annualTitle: "", annualCategory: "Financial", annualTarget: "",
  });

  const [investmentFormKey, setInvestmentFormKey] = useState(0);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("open-quick-action-center", handleOpen);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-quick-action-center", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isOpen && accounts.length === 0 && fetchedAccounts.length === 0) {
      fetch("/api/manage/accounts")
        .then((r) => r.json())
        .then((d) => {
          if (d && d.rows) {
            setFetchedAccounts(d.rows);
            if (!form.accountId && d.rows[0]) {
              setForm((prev) => ({ ...prev, accountId: d.rows[0].id }));
            }
          }
        })
        .catch(() => {});
      fetch("/api/manage/investments")
        .then((r) => r.json())
        .then((d) => {
          if (d && d.rows) setFetchedInvestments(d.rows);
        })
        .catch(() => {});
    }
  }, [isOpen, accounts.length, fetchedAccounts.length]);

  const INCOME_CATS = INCOME_CATEGORIES;
  const EXPENSE_CATEGORIES = Object.values(CATEGORY_GROUPS).flat();

  const handleTypeChange = (type: QuickAddType) => {
    setFormType(type);
    if (type === "expense") setForm({ ...form, category: "Food" });
    if (type === "income") setForm({ ...form, category: "Salary" });
    if (type === "investment") setInvestmentFormKey((k) => k + 1);
    if (type === "goal") setForm({ ...form, goalName: "", goalCategory: "Emergency" });
    if (type === "bill") setForm({ ...form, billName: "", billCategory: "Utilities" });
    if (type === "debt") setForm({ ...form, debtName: "", debtType: "PersonalLoan" });
    if (type === "insurance") setForm({ ...form, insuranceName: "", insuranceType: "Health" });
    if (type === "annual") setForm({ ...form, annualTitle: "", annualCategory: "Financial" });
  };

  const submit = async () => {
    if (!form.amount && !form.principal && !form.premium && !form.annualTarget) {
      setError("Please enter a monetary amount to proceed.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let endpoint = "";
      let body: any = {};

      const today = new Date().toISOString().split("T")[0];

      if (formType === "income" || formType === "expense") {
        endpoint = "/api/transactions";
        body = {
          type: formType,
          category: form.category || (formType === "income" ? "Salary" : "Food"),
          amount: form.amount || "0",
          txnDate: today,
          accountId: form.accountId ? Number(form.accountId) : (activeAccounts[0]?.id || accounts[0]?.id || 1),
          note: form.note && form.note.trim() ? form.note.trim() : null,
        };
      } else if (formType === "goal") {
        endpoint = "/api/manage/goals";
        body = {
          name: form.goalName && form.goalName.trim() ? form.goalName.trim() : "New Goal",
          category: form.goalCategory || "Emergency",
          target: form.amount || "0",
          saved: "0",
          deadline: null,
          icon: "🎯",
        };
      } else if (formType === "bill") {
        endpoint = "/api/manage/bills";
        body = {
          name: form.billName && form.billName.trim() ? form.billName.trim() : "Utility Bill",
          category: form.billCategory || "Utilities",
          amount: form.amount || "0",
          dueDate: form.dueDate || today,
          frequency: "Monthly",
          paid: false,
        };
      } else if (formType === "debt") {
        endpoint = "/api/manage/debts";
        body = {
          name: form.debtName && form.debtName.trim() ? form.debtName.trim() : "Personal Loan",
          type: form.debtType || "PersonalLoan",
          principal: form.principal || form.amount || "0",
          outstanding: form.outstanding || form.amount || "0",
          interestRate: form.rate || "0",
          emi: form.emi || "0",
          tenureMonths: 12,
        };
      } else if (formType === "insurance") {
        endpoint = "/api/manage/insurance";
        body = {
          name: form.insuranceName && form.insuranceName.trim() ? form.insuranceName.trim() : "Health Shield Policy",
          type: form.insuranceType || "Health",
          provider: "General Insurance Provider",
          premium: form.premium || form.amount || "0",
          coverage: form.coverage || "100000",
          renewalDate: form.renewalDate || today,
        };
      } else if (formType === "annual") {
        endpoint = "/api/manage/annual";
        body = {
          year: new Date().getFullYear(),
          title: form.annualTitle && form.annualTitle.trim() ? form.annualTitle.trim() : "Annual Financial Target",
          category: form.annualCategory || "Financial",
          targetAmount: form.annualTarget || form.amount || "0",
          progress: 0,
          status: "Planned",
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok !== false) {
        close();
        setError("");
        setForm({
          ...form,
          amount: "", category: formType === "income" ? "Salary" : "Food", accountId: activeAccounts[0]?.id || "", note: "",
          goalName: "", goalCategory: "Emergency",
          billName: "", billCategory: "Electricity", dueDate: today,
          debtName: "", debtType: "PersonalLoan", principal: "", outstanding: "", rate: "", emi: "",
          insuranceName: "", insuranceType: "Health", premium: "", coverage: "", renewalDate: today,
          annualTitle: "", annualCategory: "Financial", annualTarget: "",
        });
        router.refresh();
      } else {
        setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error) || "Failed to save entry. Please verify input fields.");
      }
    } catch (err) {
      setError("Network error communicating with database server. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mb-6">
      {!isOpen ? (
        <div className="p-1 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-amber-500/20 border border-white/10 shadow-lg">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-between gap-4 transition-all duration-300 group hover:shadow-xl"
            style={{ background: "var(--surface)", color: "var(--text-heading)" }}
          >
            <span className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg grid place-items-center text-base shadow-md transition-transform group-hover:scale-110" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#fff" }}>
                <IconLightning size={16} />
              </span>
              <span className="text-left">
                <span className="block text-sm font-extrabold tracking-tight">Universal Quick Entry Hub</span>
                <span className="block text-[11px] font-medium text-slate-400">Log Transactions, Bills, Investments, Goals & Loans instantly</span>
              </span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-white/[0.05] border border-white/[0.08] text-indigo-400 group-hover:bg-indigo-500/10">
              <span>+ Add Entry</span>
              <span className="text-[10px]">⌘K</span>
            </span>
          </button>
        </div>
      ) : (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in" onClick={close}>
          <Card variant="glass" className="p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scale-in border border-indigo-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 mb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl grid place-items-center text-lg shadow-lg" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#fff" }}>
                  <IconLightning size={20} />
                </span>
                <div>
                  <h3 className="font-extrabold text-lg tracking-tight" style={{ color: "var(--text-heading)" }}>Quick Entry Command</h3>
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Select module & submit directly to database</p>
                </div>
              </div>
              <button onClick={close} className="btn btn-ghost w-9 h-9 rounded-xl font-bold font-mono">✕</button>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl text-xs font-bold border border-red-500/40 bg-red-500/10 text-red-400 flex items-center justify-between">
                <span>⚠️ {error}</span>
                <button onClick={() => setError("")} className="btn btn-ghost text-xs px-2 py-0.5 font-mono">✕</button>
              </div>
            )}

            {/* Type tabs */}
            <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1.5 hide-scrollbar">
              {TABS.map((t) => {
                const IconComp = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTypeChange(t.id)}
                    className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                      formType === t.id ? "shadow-md scale-[1.02]" : "opacity-60 hover:opacity-90 hover:bg-white/[0.03]"
                    }`}
                    style={{
                      background: formType === t.id ? t.color : "var(--surface-2)",
                      color: formType === t.id ? "#fff" : "var(--text)",
                      border: formType === t.id ? "none" : "1px solid var(--border)",
                    }}
                  >
                    <span><IconComp size={15} /></span>{t.label}
                  </button>
                );
              })}
            </div>

            {/* ─── INVESTMENT: Full InvestmentForm with stock/MF search ─── */}
            {formType === "investment" ? (
              <div>
                <InvestmentForm
                  key={investmentFormKey}
                  editingInvestment={null}
                  existingInvestments={investments || []}
                  onSave={async (payload) => {
                    const method = payload.id ? "PATCH" : "POST";
                    const res = await fetch("/api/manage/investments", {
                      method,
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      alert(`Error: ${err.error || "Could not add investment"}`);
                      return;
                    }
                    close();
                    setInvestmentFormKey((k) => k + 1);
                    router.refresh();
                  }}
                  onCancel={close}
                />
                <div className="mt-4 p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10">
                  <p className="text-xs font-medium text-indigo-300 leading-relaxed">
                    💡 Investments logged with a valid <strong>NSE stock symbol</strong> or <strong>MF scheme code</strong> automatically synchronize with live Indian market quotes across the <Link href="/markets" className="font-bold underline text-white">Live Markets</Link> and <Link href="/investments" className="font-bold underline text-white">Portfolio Dashboard</Link>.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Amount + Account (non-investment types) */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Amount / Value (₹)</label>
                    <input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input font-mono font-bold text-base" autoFocus />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Account Source</label>
                      <button
                        type="button"
                        onClick={() => setShowAddAccount(!showAddAccount)}
                        className="text-[11px] font-mono font-extrabold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                      >
                        {showAddAccount ? "✕ Cancel" : "+ New Account Source"}
                      </button>
                    </div>
                    <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: Number(e.target.value) })} className="input font-medium">
                      {activeAccounts.map((a) => (<option key={a.id} value={a.id}>{a.name} ({a.type})</option>))}
                    </select>
                    {showAddAccount && (
                      <div className="mt-2 p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-2 animate-fade-in">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300">Create Quick Household Account</p>
                        <input
                          placeholder="E.g. HDFC Salary Account or Cash Wallet"
                          value={newAccName}
                          onChange={(e) => setNewAccName(e.target.value)}
                          className="input text-xs font-medium py-1.5"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={newAccType}
                            onChange={(e) => setNewAccType(e.target.value)}
                            className="input text-xs font-medium py-1.5"
                          >
                            <option value="Bank">Bank Account</option>
                            <option value="Cash">Cash in Hand</option>
                            <option value="Wallet">Digital Wallet</option>
                            <option value="CreditCard">Credit Card</option>
                            <option value="FixedDeposit">Fixed Deposit</option>
                            <option value="PPF">PPF / Provident Fund</option>
                            <option value="Gold">Gold Reserve</option>
                            <option value="RealEstate">Real Estate</option>
                            <option value="Other">Other Asset</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Initial Bal (₹)"
                            value={newAccBalance}
                            onChange={(e) => setNewAccBalance(e.target.value)}
                            className="input text-xs font-mono font-bold py-1.5"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newAccName.trim()) return;
                            try {
                              const res = await fetch("/api/manage/accounts", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: newAccName.trim(), type: newAccType, category: "liquid", balance: newAccBalance || "0" }),
                              });
                              const data = await res.json().catch(() => ({}));
                              if (res.ok && data.row) {
                                setFetchedAccounts((prev) => [...prev, data.row]);
                                setForm((prev) => ({ ...prev, accountId: data.row.id }));
                                setShowAddAccount(false);
                                setNewAccName("");
                                setNewAccBalance("");
                                router.refresh();
                              } else {
                                alert("Could not create account: " + (typeof data.error === "string" ? data.error : JSON.stringify(data.error) || "Validation error"));
                              }
                            } catch {
                              alert("Network error communicating with database server.");
                            }
                          }}
                          className="btn btn-primary w-full py-1.5 text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                        >
                          + Save & Select Account
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dynamic fields */}
                {formType === "income" || formType === "expense" ? (
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Category</label>
                      <div className="flex gap-2">
                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input flex-1 font-medium">
                          {formType === "income"
                            ? INCOME_CATS.map(cat => (<option key={cat} value={cat}>{cat}</option>))
                            : EXPENSE_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))
                          }
                          <option value="custom">Custom...</option>
                        </select>
                        {form.category === "custom" && (
                          <input placeholder="Custom" className="input flex-1" onChange={(e) => setForm({ ...form, category: e.target.value })} />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Description / Note</label>
                      <input placeholder="E.g., Groceries or Bonus" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input font-medium" />
                    </div>
                  </div>
                ) : formType === "goal" ? (
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Goal Name</label><input placeholder="New Car or Retirement" value={form.goalName} onChange={(e) => setForm({ ...form, goalName: e.target.value })} className="input font-medium" /></div>
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Category</label><select value={form.goalCategory} onChange={(e) => setForm({ ...form, goalCategory: e.target.value })} className="input font-medium"><option value="Emergency">Emergency</option><option value="Vacation">Vacation</option><option value="House">House</option><option value="Car">Car</option><option value="Education">Education</option><option value="Wedding">Wedding</option><option value="Retirement">Retirement</option><option value="Custom">Custom</option></select></div>
                  </div>
                ) : formType === "bill" ? (
                  <div className="grid sm:grid-cols-3 gap-4 mb-5">
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Bill Payee</label><input placeholder="Electricity" value={form.billName} onChange={(e) => setForm({ ...form, billName: e.target.value })} className="input font-medium" /></div>
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Category</label><select value={form.billCategory} onChange={(e) => setForm({ ...form, billCategory: e.target.value })} className="input font-medium">{BILL_CATEGORIES.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input font-medium" /></div>
                  </div>
                ) : formType === "debt" ? (
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Loan Name</label><input placeholder="HDFC Home Loan" value={form.debtName} onChange={(e) => setForm({ ...form, debtName: e.target.value })} className="input font-medium" /></div>
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Loan Type</label><select value={form.debtType} onChange={(e) => setForm({ ...form, debtType: e.target.value })} className="input font-medium"><option value="HomeLoan">Home Loan</option><option value="CarLoan">Car Loan</option><option value="EducationLoan">Education Loan</option><option value="PersonalLoan">Personal Loan</option><option value="CreditCard">Credit Card</option></select></div>
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Interest Rate (%)</label><input type="number" placeholder="8.5" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} className="input font-mono font-medium" /></div>
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Monthly EMI (₹)</label><input type="number" placeholder="0.00" value={form.emi} onChange={(e) => setForm({ ...form, emi: e.target.value })} className="input font-mono font-bold" /></div>
                  </div>
                ) : formType === "insurance" ? (
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Policy Name</label><input placeholder="HDFC Ergo Health" value={form.insuranceName} onChange={(e) => setForm({ ...form, insuranceName: e.target.value })} className="input font-medium" /></div>
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Insurance Type</label><select value={form.insuranceType} onChange={(e) => setForm({ ...form, insuranceType: e.target.value })} className="input font-medium"><option value="Health">Health Shield</option><option value="Life">Term Life</option><option value="Vehicle">Vehicle Insurance</option><option value="Property">Property / Home</option></select></div>
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Coverage Amount (₹)</label><input type="number" placeholder="1000000" value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} className="input font-mono font-bold" /></div>
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Next Renewal</label><input type="date" value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} className="input font-medium" /></div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Plan Milestone Title</label><input placeholder="E.g., Down Payment Fund" value={form.annualTitle} onChange={(e) => setForm({ ...form, annualTitle: e.target.value })} className="input font-medium" /></div>
                    <div><label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Category</label><select value={form.annualCategory} onChange={(e) => setForm({ ...form, annualCategory: e.target.value })} className="input font-medium"><option value="Financial">Financial Target</option><option value="Savings">Capital Savings</option><option value="Investment">Investment Allocation</option><option value="Tax">Tax Shield</option><option value="Purchase">Major Purchase</option></select></div>
                  </div>
                )}

                <button onClick={submit} disabled={loading || !form.amount} className="btn btn-primary w-full py-3.5 rounded-xl text-sm font-extrabold shadow-lg disabled:opacity-40">
                  {loading ? "Commiting to Database..." : `Confirm & Save ${formType.charAt(0).toUpperCase() + formType.slice(1)} Entry →`}
                </button>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export function GlobalQuickActionModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handleOpen = () => {
      if (window.location.pathname === "/") return;
      setOpen(true);
    };
    window.addEventListener("open-quick-action-center", handleOpen);
    return () => window.removeEventListener("open-quick-action-center", handleOpen);
  }, []);

  if (!open || pathname === "/") return null;
  return (
    <div className="fixed inset-0 z-[250]">
      <QuickActionCenter accounts={[]} investments={[]} defaultOpen={true} onClose={() => setOpen(false)} />
    </div>
  );
}
