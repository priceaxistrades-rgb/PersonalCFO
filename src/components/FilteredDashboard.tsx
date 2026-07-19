"use client";

import { useRouter } from "next/navigation";
import { useMemberFilter } from "@/lib/filters";
import { usePrivacy } from "@/lib/privacy";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { DonutChart, LineChart, BarChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { BillToggle } from "@/components/BillToggle";
import { EmptyDashboard } from "@/components/EmptyState";
import { FinancialInsights } from "@/components/FinancialInsights";
import { inr, num, fmtDate, daysUntil } from "@/lib/format";
import { sumByPaise, monthKey, lastNMonths, monthlyFlow, expenseByCategory, currentMonthKey, healthScore } from "@/lib/data-utils";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { DashboardData, SpendingView } from "@/lib/types";
import {
  IconNetWorth, IconIncome, IconExpenses, IconSavings, IconInvestments,
  IconHealth, IconEmergency, IconAlert, IconUser, IconTarget,
  IconBills, IconDebt, IconDashboard, IconSparkles, IconArrowRight,
  IconCheck, IconPlus
} from "@/components/ui/Icons";

function getMonthKey(d: string | Date): string {
  return monthKey(d);
}

export function FilteredDashboard({ txns, bills, debts, goals, invs, accounts, members }: DashboardData) {
  const router = useRouter();
  const go = (href: string) => router.push(href);
  const { isSelected, hasSelection, selectedIds } = useMemberFilter();
  const { globalHidden } = usePrivacy();
  const displayMoney = (value: number, compact = false) => globalHidden ? "••••••" : inr(value, compact ? { compact: true } : undefined);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [spendingView, setSpendingView] = useState<SpendingView>("monthly");

  const filteredTxns = useMemo(() => txns.filter((t) => isSelected(t.memberId)), [txns, isSelected]);
  const filteredAccounts = useMemo(() => accounts.filter((a) => isSelected(a.memberId)), [accounts, isSelected]);
  const filteredInvestments = useMemo(() => invs.filter((i) => isSelected(i.memberId)), [invs, isSelected]);
  const filteredDebts = useMemo(() => debts.filter((d) => isSelected(d.memberId)), [debts, isSelected]);

  const liquidAssets = sumByPaise(filteredAccounts, (a) => a.balance);
  const cashInHand = sumByPaise(filteredAccounts.filter((a) => a.type === "Cash"), (a) => a.balance);
  const bankBalance = sumByPaise(filteredAccounts.filter((a) => a.type === "Bank"), (a) => a.balance);
  const investmentValue = sumByPaise(filteredInvestments, (i) => i.currentValue);
  const totalAssets = liquidAssets + investmentValue;
  const liabilities = sumByPaise(filteredDebts, (d) => d.outstanding);
  const netWorth = totalAssets - liabilities;

  const months = lastNMonths(6);
  const allFlow = monthlyFlow(txns, months);
  const flow = monthlyFlow(filteredTxns, months);

  const cm = currentMonthKey();
  const thisMonth = flow[flow.length - 1] || { income: 0, expense: 0, savings: 0 };
  const prevMonth = flow[flow.length - 2] ?? thisMonth;
  const allThisMonth = allFlow[allFlow.length - 1];

  const income = thisMonth.income;
  const expense = thisMonth.expense;
  const savings = income - expense;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const invGrowth = sumByPaise(invs, (i) => i.currentValue) - sumByPaise(invs, (i) => i.invested);
  const totalEmi = sumByPaise(debts, (d) => d.emi);
  const emergencyGoal = goals.find((g) => g.category === "Emergency");
  const emergencySaved = emergencyGoal ? num(emergencyGoal.saved) : 0;
  const monthlyExpense = hasSelection ? expense : (allThisMonth?.expense || 1);
  const emergencyMonths = monthlyExpense > 0 ? emergencySaved / monthlyExpense : 0;
  const debtToIncome = income > 0 ? (totalEmi / income) * 100 : 0;
  const investmentRate = totalAssets > 0 ? (investmentValue / totalAssets) * 100 : 0;
  const score = healthScore({ savingsRate, emergencyMonths, debtToIncome, investmentRate });

  const isOverspending = expense > income && income > 0;

  const getSpendingData = useCallback(() => {
    const today = new Date();
    const expTxns = filteredTxns.filter(t => t.type === "expense");
    if (spendingView === "daily") {
      const todayStr = today.toISOString().split("T")[0];
      const todayExp = expTxns.filter(t => t.txnDate === todayStr);
      const total = sumByPaise(todayExp, t => t.amount);
      const cats = expenseByCategory(todayExp);
      return { total, cats, label: "Today" };
    } else if (spendingView === "weekly") {
      const weekAgo = new Date(today.getTime() - 7 * 86400000);
      const weekExp = expTxns.filter(t => new Date(t.txnDate) >= weekAgo);
      const total = sumByPaise(weekExp, t => t.amount);
      const cats = expenseByCategory(weekExp);
      return { total, cats, label: "This Week" };
    } else if (spendingView === "yearly") {
      const yearKey = `${today.getFullYear()}-`;
      const yearExp = expTxns.filter(t => t.txnDate.startsWith(yearKey));
      const total = sumByPaise(yearExp, t => t.amount);
      const cats = expenseByCategory(yearExp);
      return { total, cats, label: `${today.getFullYear()}` };
    } else {
      const monthExp = expTxns.filter(t => monthKey(t.txnDate) === cm);
      const total = sumByPaise(monthExp, t => t.amount);
      const cats = expenseByCategory(monthExp);
      return { total, cats, label: "This Month" };
    }
  }, [filteredTxns, spendingView, cm]);

  const spending = getSpendingData();
  const catData = spending.cats.slice(0, 7);
  const upcomingBills = bills.filter((b) => !b.paid).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
  const scoreTone = score >= 75 ? "success" : score >= 50 ? "warning" : "danger";
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const selectedNames = selectedIds.map((id) => memberMap.get(id)?.name?.split(" ")[0]).filter(Boolean);

  const hasNoData = txns.length === 0 && accounts.length === 0 && invs.length === 0 && debts.length === 0;
  if (hasNoData) return <EmptyDashboard />;

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Health index remains visible in the dashboard KPI/insight cards.
          A blocking first-login modal was intentionally removed: it obscured
          core balances and made the score harder to scan on mobile. */}

      {/* Filter status banner */}
      {hasSelection && (
        <Card className="!p-3.5 border-indigo-500/30 bg-indigo-500/10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl grid place-items-center text-sm shadow-sm bg-indigo-500/20 text-indigo-400">
                <IconUser size={16} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Active Family Profile Filter</p>
                <p className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-heading)" }}>Showing isolated data for: {selectedNames.join(", ")}</p>
              </div>
            </div>
            <button onClick={() => router.push("/settings")} className="btn btn-ghost text-xs px-3 py-1.5 font-bold">Manage Profiles →</button>
          </div>
        </Card>
      )}

      {/* Overspending Alert Banner */}
      {isOverspending && (
        <div className="p-4 rounded-2xl flex items-center justify-between gap-4 flex-wrap border border-red-500/40 bg-red-500/10 shadow-lg animate-fade-in" role="alert">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl grid place-items-center text-xl bg-red-500/20 text-red-400 shrink-0">
              <IconAlert size={22} />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight text-red-400">Monthly Overspending Alert</p>
              <p className="text-xs mt-0.5 text-slate-300">
                Your expenditures (<strong className="font-mono" style={{ color: "var(--text-heading)" }}>{displayMoney(expense, true)}</strong>) currently exceed your income (<strong className="font-mono" style={{ color: "var(--text-heading)" }}>{displayMoney(income, true)}</strong>) by <strong className="text-red-600 dark:text-red-400 font-mono underline">{displayMoney(expense - income, true)}</strong>.
              </p>
            </div>
          </div>
          <button onClick={() => go("/budget")} className="btn btn-danger text-xs px-4 py-2 font-bold shadow-md">Reallocate Budget →</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SOVEREIGN HERO COCKPIT (THE COMMAND DECK)
          Bespoke high-contrast asset summary right at the top
          ═══════════════════════════════════════════════════════════════════ */}
      <Card className="!p-6 sm:!p-8 border bg-gradient-to-br from-indigo-950/20 via-surface to-surface shadow-2xl relative overflow-hidden" style={{ borderColor: "var(--border-strong)" }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mt-32 -mr-32" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mb-20 -ml-20" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          {/* Left Column: Sovereign Valuation */}
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-400 dark:text-indigo-300 border border-indigo-500/30">
                Sovereign Wealth Cockpit
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Live Consolidated Valuation</span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Household Net Worth</p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-4xl sm:text-6xl font-black tracking-tighter tabular-nums font-mono leading-none" style={{ color: "var(--text-heading)" }}>
                  {displayMoney(netWorth)}
                </h2>
                {invGrowth !== 0 && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${invGrowth >= 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"}`}>
                    {invGrowth >= 0 ? "+" : ""}{displayMoney(invGrowth, true)} unrealized
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block">Gross Assets</span>
                <span className="text-lg sm:text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{displayMoney(totalAssets)}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Bank: {displayMoney(bankBalance, true)} · Liquid: {displayMoney(cashInHand, true)}</span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block">Total Liabilities</span>
                <span className="text-lg sm:text-xl font-mono font-extrabold text-red-600 dark:text-red-400 mt-0.5 block">−{displayMoney(liabilities)}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Monthly EMI: {displayMoney(totalEmi, true)}/mo</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Contrast Diagnostic Cells */}
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3 shrink-0 w-full xl:w-80">
            <div
              onClick={() => go("/reports")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go("/reports"); } }}
              role="button"
              tabIndex={0}
              data-tone="success"
              className="dashboard-metric-card p-4 rounded-2xl border transition-all cursor-pointer group"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                <span>Monthly Capital Velocity</span>
                <IconIncome size={15} className="dashboard-metric-icon text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-xl font-mono font-black tabular-nums ${savings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {savings >= 0 ? "+" : ""}{displayMoney(savings, true)}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{savingsRate.toFixed(0)}% saved</span>
              </div>
              <div className="w-full h-1.5 rounded-full mt-2.5 overflow-hidden" style={{ background: "var(--surface-3)" }}>
                <div className="dashboard-metric-progress h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }} />
              </div>
            </div>

            <div
              onClick={() => go("/health")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go("/health"); } }}
              role="button"
              tabIndex={0}
              data-tone="primary"
              className="dashboard-metric-card p-4 rounded-2xl border transition-all cursor-pointer group"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                <span>AI Health & Runway</span>
                <IconHealth size={15} className="dashboard-metric-icon text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-black tabular-nums" style={{ color: "var(--text-heading)" }}>
                  Grade {score >= 75 ? "A" : score >= 50 ? "B" : "C"} ({score}/100)
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-300">{emergencyMonths.toFixed(1)} mo runway</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
                {score >= 75 ? "Excellent capital structure" : "Review emergency reserve ratio"}
              </p>
            </div>

            <div
              onClick={() => go("/investments")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go("/investments"); } }}
              role="button"
              tabIndex={0}
              data-tone="accent"
              className="dashboard-metric-card p-4 rounded-2xl border transition-all cursor-pointer group"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                <span>Portfolio Allocation</span>
                <IconInvestments size={15} className="dashboard-metric-icon text-purple-500 dark:text-purple-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-black tabular-nums text-purple-600 dark:text-purple-300">
                  {displayMoney(investmentValue, true)}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{investmentRate.toFixed(0)}% invested</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
                Active holdings linked to live market tickers
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── BENTO GRID: ROW 2 (CHARTS & HEALTH COCKPIT) ─── */}
      <div className="bento-grid">
        <div className="bento-col-8">
          <Card title="Cash Flow Dynamics" subtitle={hasSelection ? "Isolated Member Cash Flow" : "Last 6 Months Income vs Expense vs Net Capital Savings"} action={
            <button onClick={() => go("/reports")} className="btn btn-ghost text-xs px-2.5 py-1 font-bold flex items-center gap-1">Analytics Report <IconArrowRight size={13} /></button>
          }>
            <div className="pt-2">
              <LineChart
                labels={flow.map((f) => f.label)}
                series={[
                  { name: "Income", values: flow.map((f) => f.income), color: "#10b981" },
                  { name: "Expenses", values: flow.map((f) => f.expense), color: "#ef4444" },
                  { name: "Net Savings", values: flow.map((f) => f.savings), color: "#6366f1" }
                ]}
              />
            </div>
          </Card>
        </div>

        <div className="bento-col-4 flex flex-col">
          <Card title="Financial Health Engine" subtitle="Live diagnostic index" className="flex-1 flex flex-col justify-between" action={
            <button onClick={() => go("/health")} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">Diagnose</button>
          }>
            <div className="flex flex-col items-center justify-center py-3 my-auto">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-3)" strokeWidth="11" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={`var(--${scoreTone})`} strokeWidth="11" strokeLinecap="round" strokeDasharray={`${(score / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`} />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <span className="text-3xl font-black font-mono tabular-nums leading-none" style={{ color: "var(--text-heading)" }}>{score}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: `var(--${scoreTone})` }}>Index</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2.5 text-xs" style={{ borderColor: "var(--border)" }}>
              <ScoreRow label="Savings Rate (≥20%)" value={`${savingsRate.toFixed(0)}%`} ok={savingsRate >= 20} />
              <ScoreRow label="Emergency Cover (≥6m)" value={`${emergencyMonths.toFixed(1)} mo`} ok={emergencyMonths >= 6} />
              <ScoreRow label="Debt Ratio (≤35%)" value={`${debtToIncome.toFixed(0)}%`} ok={debtToIncome <= 35} />
              <ScoreRow label="Invested Assets (≥30%)" value={`${investmentRate.toFixed(0)}%`} ok={investmentRate >= 30} />
            </div>
          </Card>
        </div>
      </div>

      {/* Financial Insights Banner (Full Span status bar) */}
      <FinancialInsights txns={filteredTxns} bills={bills} />

      {/* ─── BENTO GRID: ROW 3 (SPENDING BY CATEGORY & GOALS) ─── */}
      <div className="bento-grid">
        <div className="bento-col-6 flex flex-col">
          <Card
            title="Spending Allocation"
            subtitle={spending.label}
            className="flex-1 flex flex-col justify-between"
            action={
              <div className="flex items-center gap-1 bg-white/[0.04] dark:bg-white/[0.04] p-1 rounded-xl border shrink-0" role="tablist" style={{ borderColor: "var(--border)" }}>
                {(["daily", "weekly", "monthly", "yearly"] as SpendingView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setSpendingView(v)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-tight transition-all"
                    role="tab"
                    aria-selected={spendingView === v}
                    style={{
                      background: spendingView === v ? "var(--primary)" : "transparent",
                      color: spendingView === v ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {v.slice(0, 1).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            }
          >
            <div>
              <div className="mb-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Period Total Outflow:</span>
                <span className="text-base font-black font-mono tabular-nums" style={{ color: "var(--text-heading)" }}>{displayMoney(spending.total)}</span>
              </div>
              {catData.length ? (
                <DonutChart data={catData} centerLabel="Total Spent" centerValue={displayMoney(spending.total, true)} />
              ) : (
                <div className="py-12 text-center text-sm font-medium" style={{ color: "var(--text-faint)" }}>No expense transactions logged for this timeframe</div>
              )}
            </div>
          </Card>
        </div>

        <div className="bento-col-6 flex flex-col">
          <Card title="Active Savings Goals" subtitle="Milestone tracking & capital readiness" className="flex-1 flex flex-col justify-between" action={
            <button onClick={() => go("/savings")} className="btn btn-ghost text-xs px-2.5 py-1 font-bold flex items-center gap-1">Manage Goals <IconArrowRight size={13} /></button>
          }>
            {goals.length ? (
              <div className="grid sm:grid-cols-2 gap-4 pt-1 my-auto">
                {goals.slice(0, 6).map((g) => {
                  const p = Math.min(100, (num(g.saved) / (num(g.target) || 1)) * 100);
                  const tone = p >= 75 ? "success" : p >= 40 ? "primary" : "warning";
                  return (
                    <div key={g.id} className="p-3.5 rounded-xl border transition-colors hover:border-indigo-500/40" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className="text-xs font-bold truncate flex items-center gap-2 min-w-0" style={{ color: "var(--text-heading)" }}>
                          <IconTarget size={14} className="text-indigo-400 shrink-0" /> <span className="truncate">{g.name}</span>
                        </span>
                        <span className={`badge badge-${tone} font-mono text-[10px] shrink-0`}>{p.toFixed(0)}%</span>
                      </div>
                      <Progress value={p} tone={tone} height={7} />
                      <div className="flex justify-between items-center mt-2.5 text-[11px] font-mono tabular-nums">
                        <span className="font-semibold" style={{ color: "var(--text)" }}>{displayMoney(num(g.saved), true)}</span>
                        <span style={{ color: "var(--text-faint)" }}>Target: {displayMoney(num(g.target), true)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-2xl bg-surface-2/40 my-auto" style={{ borderColor: "var(--border-strong)" }}>
                <span className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 grid place-items-center mb-3">
                  <IconTarget size={24} />
                </span>
                <p className="text-base font-extrabold" style={{ color: "var(--text-heading)" }}>Zero Capital Vaults Configured</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">Initialize your emergency reserve or retirement capital vault to begin milestone progress tracking.</p>
                <button onClick={() => go("/savings")} className="btn btn-primary px-5 py-2 text-xs font-bold mt-4 shadow-md flex items-center gap-1.5">
                  <IconPlus size={14} /> <span>Create Savings Vault</span>
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ─── BENTO GRID: ROW 4 (UPCOMING BILLS & EMI LOANS) ─── */}
      <div className="bento-grid">
        <div className="bento-col-7 flex flex-col">
          <Card title="Upcoming Bills & Subscriptions" subtitle="Due dates and automated liability tracking" className="flex-1 flex flex-col justify-between" action={
            <button onClick={() => go("/bills")} className="btn btn-ghost text-xs px-2.5 py-1 font-bold flex items-center gap-1">All Bills <IconArrowRight size={13} /></button>
          }>
            {upcomingBills.length ? (
              <Table headers={["Bill Payee", "Category", "Due Date", "Amount", "Action"]} right={[3, 4]}>
                {upcomingBills.map((b) => {
                  const dleft = daysUntil(b.dueDate);
                  const isLate = dleft < 0;
                  const isUrgent = dleft <= 3 && dleft >= 0;
                  return (
                    <Tr key={b.id}>
                      <Td strong>{b.name}</Td>
                      <Td><Badge tone="neutral">{b.category}</Badge></Td>
                      <Td>
                        <span className="font-medium">{fmtDate(b.dueDate)}</span>{" "}
                        <span className={`text-xs font-bold ml-1 ${isLate ? "text-red-400" : isUrgent ? "text-amber-400" : "text-slate-500"}`}>
                          ({isLate ? `${-dleft}d overdue` : `${dleft}d left`})
                        </span>
                      </Td>
                      <Td right strong className="font-mono">{displayMoney(num(b.amount))}</Td>
                      <Td right><BillToggle id={b.id} paid={b.paid} /></Td>
                    </Tr>
                  );
                })}
              </Table>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-emerald-500/30 bg-emerald-500/5 rounded-2xl my-auto">
                <span className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 grid place-items-center mb-3 shadow-sm">
                  <IconCheck size={24} />
                </span>
                <p className="text-base font-extrabold text-emerald-400">All Scheduled Liabilities Cleared</p>
                <p className="text-xs text-slate-300 max-w-md mt-1 leading-relaxed">Zero unpaid recurring subscriptions or utility payables due for this cycle across all household profiles.</p>
                <button onClick={() => go("/bills")} className="btn btn-ghost px-4 py-2 text-xs font-bold mt-3 border" style={{ borderColor: "var(--border)", color: "var(--text-heading)" }}>View Payables Archive →</button>
              </div>
            )}
          </Card>
        </div>

        <div className="bento-col-5 flex flex-col">
          <Card title="Debt & EMI Obligations" subtitle="Active loan outflow index" className="flex-1 flex flex-col justify-between" action={
            <button onClick={() => go("/debt")} className="btn btn-ghost text-xs px-2.5 py-1 font-bold flex items-center gap-1">Debt Payoff <IconArrowRight size={13} /></button>
          }>
            {debts.length ? (
              <div>
                <div className="pt-2">
                  <BarChart data={debts.map((dt) => ({ label: dt.type.replace("Loan", "").replace("Personal", "Pers"), value: num(dt.emi) }))} />
                </div>
                <div className="mt-5 pt-4 border-t flex items-center justify-between text-sm" style={{ borderColor: "var(--border)" }}>
                  <span className="font-medium" style={{ color: "var(--text-muted)" }}>Total Monthly EMI</span>
                  <span className="text-lg font-black font-mono tabular-nums text-red-600 dark:text-red-400">{displayMoney(totalEmi)}</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-emerald-500/30 bg-emerald-500/5 rounded-2xl my-auto">
                <span className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 grid place-items-center mb-3 shadow-sm">
                  <IconCheck size={24} />
                </span>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">Zero Household Debt</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mt-1 leading-relaxed">All household accounts are currently debt-free with ₹0 EMI liabilities. Monthly cash flow is 100% unencumbered.</p>
                <div className="mt-5 pt-4 border-t w-full flex items-center justify-between text-sm" style={{ borderColor: "var(--border)" }}>
                  <span className="font-medium text-slate-500 dark:text-slate-400">Total Monthly EMI</span>
                  <span className="text-lg font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">₹0.00</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, ok, reason }: { label: string; value: string; ok: boolean; reason?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0" role="listitem">
      <div>
        <span className="font-medium text-xs sm:text-[13px]" style={{ color: "var(--text-muted)" }}>{label}</span>
        {reason && <p className="text-[10px] font-semibold mt-0.5" style={{ color: ok ? "var(--success)" : "var(--warning)" }}>{reason}</p>}
      </div>
      <span className="font-bold font-mono tabular-nums text-[13px] flex items-center gap-1.5" style={{ color: ok ? "var(--success)" : "var(--warning)" }}>
        <span className="w-2 h-2 rounded-full shadow-sm shrink-0" style={{ background: ok ? "var(--success)" : "var(--warning)" }} aria-hidden="true" />
        {value}
      </span>
    </div>
  );
}
