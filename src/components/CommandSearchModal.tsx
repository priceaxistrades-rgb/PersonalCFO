"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { inr } from "@/lib/format";
import {
  IconSearch, IconDashboard, IconIncome, IconExpenses, IconInvestments,
  IconMarkets, IconSavings, IconDebt, IconAI, IconBrief, IconMission,
  IconHealth, IconTimeline, IconSimulator, IconOpportunities, IconStress,
  IconDreams, IconTax, IconInsurance, IconBills, IconOnboarding, IconArrowRight
} from "@/components/ui/Icons";

type SearchResultItem = {
  id: string;
  category: "Module" | "Transaction" | "Investment" | "Bill" | "Goal" | "Debt";
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
  icon: any;
};

const STATIC_MODULES: SearchResultItem[] = [
  { id: "mod-acc", category: "Module", title: "Bank Accounts, Wallets & Cash Sources", subtitle: "Register and manage bank accounts, credit cards & liquid reserves", badge: "/settings#accounts", href: "/settings#accounts", icon: IconSavings },
  { id: "mod-1", category: "Module", title: "Mission Control", subtitle: "Dual diagnostic gauges & stress telemetry", badge: "/control", href: "/control", icon: IconMission },
  { id: "mod-2", category: "Module", title: "Financial Dashboard", subtitle: "Consolidated wealth & cash flow deck", badge: "/", href: "/", icon: IconDashboard },
  { id: "mod-3", category: "Module", title: "Executive Morning Briefing", subtitle: "Daily prioritized financial intelligence feed", badge: "/brief", href: "/brief", icon: IconBrief },
  { id: "mod-4", category: "Module", title: "Financial Health Index", subtitle: "4-pillar capital structure diagnostics", badge: "/health", href: "/health", icon: IconHealth },
  { id: "mod-5", category: "Module", title: "Income Revenue Streams", subtitle: "Salary, dividends & freelance revenue logs", badge: "/income", href: "/income", icon: IconIncome },
  { id: "mod-6", category: "Module", title: "Expenditures & Spend Leaks", subtitle: "Categorized outflows & burn rate telemetry", badge: "/expenses", href: "/expenses", icon: IconExpenses },
  { id: "mod-7", category: "Module", title: "Monitored Budget Ceilings", subtitle: "Set and track monthly spending limits", badge: "/budget", href: "/budget", icon: IconDashboard },
  { id: "mod-8", category: "Module", title: "Scheduled Bills & Subscriptions", subtitle: "Upcoming payables & recurring reminders", badge: "/bills", href: "/bills", icon: IconBills },
  { id: "mod-9", category: "Module", title: "Sovereign Net Worth Deck", subtitle: "Consolidated asset vs liability valuation", badge: "/networth", href: "/networth", icon: IconDashboard },
  { id: "mod-10", category: "Module", title: "Portfolio Assets & Holdings", subtitle: "Equities, mutual funds & capital holdings", badge: "/investments", href: "/investments", icon: IconInvestments },
  { id: "mod-11", category: "Module", title: "Live Market Tickers & Watchlist", subtitle: "Real-time NSE stocks & AMFI scheme NAVs", badge: "/markets", href: "/markets", icon: IconMarkets },
  { id: "mod-12", category: "Module", title: "Milestone Capital Vaults", subtitle: "Goal reserves and target completion tracking", badge: "/savings", href: "/savings", icon: IconSavings },
  { id: "mod-13", category: "Module", title: "Loans & Liability Telemetry", subtitle: "EMI obligations & amortization tracking", badge: "/debt", href: "/debt", icon: IconDebt },
  { id: "mod-14", category: "Module", title: "AI Financial Twin", subtitle: "Autonomous wealth advisory & instant QA", badge: "/ai", href: "/ai", icon: IconAI },
  { id: "mod-15", category: "Module", title: "Scenario Simulator & Shock Modeling", subtitle: "Model salary shocks, property & inflation", badge: "/simulator", href: "/simulator", icon: IconSimulator },
  { id: "mod-16", category: "Module", title: "Optimization Scanner", subtitle: "Automated detection of savings potential", badge: "/opportunities", href: "/opportunities", icon: IconOpportunities },
  { id: "mod-17", category: "Module", title: "Stress Telemetry & Risk Diagnostics", subtitle: "Real-time debt buffers & resilience factors", badge: "/stress", href: "/stress", icon: IconStress },
  { id: "mod-18", category: "Module", title: "Dream Planner & Feasibility Modeling", subtitle: "Feasibility modeling for major aspirations", badge: "/dreams", href: "/dreams", icon: IconDreams },
  { id: "mod-19", category: "Module", title: "Wealth Roadmap & Timeline", subtitle: "Compounding timeline & financial freedom path", badge: "/wealth", href: "/wealth", icon: IconTimeline },
  { id: "mod-20", category: "Module", title: "Tax Shield & Marginal Rate Engine", subtitle: "Old vs New regime comparative marginal engine", badge: "/tax", href: "/tax", icon: IconTax },
  { id: "mod-21", category: "Module", title: "Insurance Shield & Risk Coverage", subtitle: "Monitored sum assured & renewal alerts", badge: "/insurance", href: "/insurance", icon: IconInsurance },
  { id: "mod-22", category: "Module", title: "Personal CFO User Manual", subtitle: "Guide for using the complete website across desktop, tablet and mobile", badge: "/guide", href: "/guide", icon: IconOnboarding },
];

export function CommandSearchModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "p")) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("open-global-search", handleOpen);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-global-search", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const resetTimer = window.setTimeout(() => {
      if (!active) return;
      setQuery("");
      setSelectedIndex(0);
      setLoading(true);
      inputRef.current?.focus();
    }, 0);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);

    Promise.all([
      fetch("/api/transactions").then((r) => r.json()).catch(() => ({ rows: [] })),
      fetch("/api/manage/investments").then((r) => r.json()).catch(() => ({ rows: [] })),
      fetch("/api/manage/bills").then((r) => r.json()).catch(() => ({ rows: [] })),
      fetch("/api/manage/goals").then((r) => r.json()).catch(() => ({ rows: [] })),
      fetch("/api/manage/debts").then((r) => r.json()).catch(() => ({ rows: [] })),
    ]).then(([txData, invData, billData, goalData, debtData]) => {
      if (!active) return;
      if (txData.rows) setTransactions(txData.rows);
      if (invData.rows) setInvestments(invData.rows);
      if (billData.rows) setBills(billData.rows);
      if (goalData.rows) setGoals(goalData.rows);
      if (debtData.rows) setDebts(debtData.rows);
      setLoading(false);
    });

    return () => {
      active = false;
      window.clearTimeout(resetTimer);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: SearchResultItem[] = [];

    // Filter Static Modules
    STATIC_MODULES.forEach((m) => {
      if (!q || m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q) || m.badge?.toLowerCase().includes(q)) {
        list.push(m);
      }
    });

    if (q) {
      // Filter Transactions
      transactions.forEach((t) => {
        const cat = String(t.category || "").toLowerCase();
        const note = String(t.note || "").toLowerCase();
        const amt = String(t.amount || "");
        if (cat.includes(q) || note.includes(q) || amt.includes(q)) {
          list.push({
            id: `txn-${t.id}`,
            category: "Transaction",
            title: `${t.category} (${t.type === "income" ? "+" : "−"}₹${Number(t.amount).toLocaleString("en-IN")})`,
            subtitle: t.note ? `${t.note} · ${t.txnDate}` : `Logged on ${t.txnDate}`,
            badge: t.type.toUpperCase(),
            href: t.type === "income" ? "/income" : "/expenses",
            icon: t.type === "income" ? IconIncome : IconExpenses,
          });
        }
      });

      // Filter Investments
      investments.forEach((i) => {
        const name = String(i.name || "").toLowerCase();
        const sym = String(i.symbol || i.schemeCode || "").toLowerCase();
        if (name.includes(q) || sym.includes(q)) {
          list.push({
            id: `inv-${i.id}`,
            category: "Investment",
            title: i.name,
            subtitle: `${i.type} · Current Value: ₹${Number(i.currentValue).toLocaleString("en-IN")}`,
            badge: i.symbol || i.schemeCode || "Holding",
            href: "/investments",
            icon: IconInvestments,
          });
        }
      });

      // Filter Bills
      bills.forEach((b) => {
        if (String(b.name || "").toLowerCase().includes(q) || String(b.category || "").toLowerCase().includes(q)) {
          list.push({
            id: `bill-${b.id}`,
            category: "Bill",
            title: b.name,
            subtitle: `Due ${b.dueDate} · Amount: ₹${Number(b.amount).toLocaleString("en-IN")}`,
            badge: b.paid ? "PAID" : "PENDING",
            href: "/bills",
            icon: IconBills,
          });
        }
      });

      // Filter Goals
      goals.forEach((g) => {
        if (String(g.name || "").toLowerCase().includes(q) || String(g.category || "").toLowerCase().includes(q)) {
          list.push({
            id: `goal-${g.id}`,
            category: "Goal",
            title: g.name,
            subtitle: `Saved: ₹${Number(g.saved).toLocaleString("en-IN")} of ₹${Number(g.target).toLocaleString("en-IN")}`,
            badge: g.category,
            href: "/savings",
            icon: IconSavings,
          });
        }
      });

      // Filter Debts
      debts.forEach((d) => {
        if (String(d.name || "").toLowerCase().includes(q) || String(d.type || "").toLowerCase().includes(q)) {
          list.push({
            id: `debt-${d.id}`,
            category: "Debt",
            title: d.name,
            subtitle: `Outstanding: ₹${Number(d.outstanding).toLocaleString("en-IN")} · EMI: ₹${Number(d.emi).toLocaleString("en-IN")}/mo`,
            badge: d.type,
            href: "/debt",
            icon: IconDebt,
          });
        }
      });
    }

    return list.slice(0, 25);
  }, [query, transactions, investments, bills, goals, debts]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSelectedIndex(0), 0);
    return () => window.clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setOpen(false);
    router.push(item.href);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="command-search-overlay fixed inset-0 z-[300] flex items-start justify-center p-0 sm:p-4 sm:pt-24 bg-black/70 backdrop-blur-md animate-fade-in select-none" onClick={() => setOpen(false)}>
      <Card
        variant="glass"
        className="command-search-modal w-full sm:max-w-2xl overflow-hidden rounded-b-[2rem] sm:rounded-3xl border shadow-2xl transition-all scale-in !p-0"
        style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3.5 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="text-indigo-400 shrink-0"><IconSearch size={20} /></span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Search financial modules, transactions, assets, loans or enter command..."
            className="command-search-input w-full bg-transparent border-none outline-none text-sm sm:text-base font-bold tracking-tight placeholder:text-slate-500"
          />
          {loading && <span className="inline-block w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin shrink-0" />}
          <button onClick={() => setOpen(false)} className="btn btn-ghost px-2.5 py-1 text-xs font-mono font-bold rounded-xl border border-white/[0.08]">ESC</button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2.5 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium text-xs">
              No matching modules or records found for &quot;{query}&quot;. Try searching &quot;Salary&quot;, &quot;HDFC&quot;, or &quot;Net Worth&quot;.
            </div>
          ) : (
            results.map((item, idx) => {
              const IconComp = item.icon;
              const active = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                    active ? "bg-indigo-600 text-white shadow-md border-indigo-500/40" : "bg-transparent border-transparent hover:bg-surface-2 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-white/20 text-white" : "bg-surface-2 text-indigo-400"}`}>
                      <IconComp size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-extrabold truncate tracking-tight ${active ? "text-white" : "text-text-heading"}`}>{item.title}</p>
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${active ? "bg-black/20 text-white" : "bg-surface-3 text-slate-400"}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${active ? "text-indigo-100" : "text-slate-400 font-medium"}`}>{item.subtitle}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-mono ${active ? "text-white opacity-100" : "opacity-0"}`}>
                    Jump →
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-5 py-3 border-t bg-surface-2/40 flex items-center justify-between text-[10px] font-mono text-slate-500" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Sovereign OS Command Search v5.6</span>
        </div>
      </Card>
    </div>
  );
}
