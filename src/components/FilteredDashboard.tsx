"use client";

import { useRouter } from "next/navigation";
import { useMemberFilter } from "@/lib/filters";
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

function getMonthKey(d: string | Date): string {
  return monthKey(d);
}

export function FilteredDashboard({ txns, bills, debts, goals, invs, accounts, members }: DashboardData) {
  const router = useRouter();
  const go = (href: string) => router.push(href);
  const { isSelected, hasSelection, selectedIds } = useMemberFilter();

  // Live clock — memoize the update to prevent full re-render every second
  const [now, setNow] = useState(new Date());
  const [timeOnly, setTimeOnly] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNow(d);
      setTimeOnly(d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Health Score popup state
  const [showHealthPopup, setShowHealthPopup] = useState(false);
  useEffect(() => {
    const shown = sessionStorage.getItem("healthPopupShown");
    if (!shown) {
      setShowHealthPopup(true);
      sessionStorage.setItem("healthPopupShown", "1");
    }
  }, []);

  // Spending view
  const [spendingView, setSpendingView] = useState<SpendingView>("monthly");

  const filteredTxns = useMemo(() => txns.filter((t) => isSelected(t.memberId)), [txns, isSelected]);
  const filteredAccounts = useMemo(() => accounts.filter((a) => isSelected(a.memberId)), [accounts, isSelected]);
  const filteredInvestments = useMemo(() => invs.filter((i) => isSelected(i.memberId)), [invs, isSelected]);
  const filteredDebts = useMemo(() => debts.filter((d) => isSelected(d.memberId)), [debts, isSelected]);

  // Use BigInt-precise sumByPaise for all monetary calculations
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

  // Overspending check
  const isOverspending = expense > income && income > 0;

  // Spending view calculations
  const today = new Date();
  const getSpendingData = useCallback(() => {
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
    <>
      {/* Health Score Popup */}
      {showHealthPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowHealthPopup(false)} role="dialog" aria-modal="true" aria-labelledby="health-score-title">
          <Card variant="glass" className="w-full max-w-md p-6 scale-in" style={{ borderColor: "var(--border-accent)" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center text-3xl mb-3 shadow-lg" style={{ background: `var(--${scoreTone})`, color: "#fff" }} role="img" aria-label={score >= 75 ? "Excellent" : score >= 50 ? "Good" : "Needs attention"}>
                {score >= 75 ? "🎉" : score >= 50 ? "💪" : "⚠️"}
              </div>
              <h2 id="health-score-title" className="text-xl font-extrabold" style={{ color: "var(--text-heading)" }}>Your Financial Health Score</h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <div className="flex flex-col items-center mb-5">
              <div className="relative w-32 h-32" role="img" aria-label={`Health score: ${score} out of 100`}>
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-3)" strokeWidth="12" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={`var(--${scoreTone})`} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(score / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`} />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-3xl font-extrabold" style={{ color: "var(--text-heading)" }}>{score}</span>
                </div>
              </div>
              <p className="text-sm font-semibold mt-2" style={{ color: `var(--${scoreTone})` }}>
                {score >= 75 ? "Excellent! You're in great shape." : score >= 50 ? "Good progress — keep improving!" : "Needs attention — let's work on this."}
              </p>
            </div>
            <div className="space-y-2.5 text-sm">
              <ScoreRow label="Savings rate" value={`${savingsRate.toFixed(0)}%`} ok={savingsRate >= 20} reason={savingsRate >= 20 ? "Above 20% target" : "Below 20% target — try to save more"} />
              <ScoreRow label="Emergency cover" value={`${emergencyMonths.toFixed(1)} mo`} ok={emergencyMonths >= 6} reason={emergencyMonths >= 6 ? "6+ months covered" : "Need 6+ months of expenses saved"} />
              <ScoreRow label="Debt-to-income" value={`${debtToIncome.toFixed(0)}%`} ok={debtToIncome <= 35} reason={debtToIncome <= 35 ? "Under 35% — healthy" : "Over 35% — reduce debt"} />
              <ScoreRow label="Invested assets" value={`${investmentRate.toFixed(0)}%`} ok={investmentRate >= 30} reason={investmentRate >= 30 ? "30%+ in investments — good" : "Under 30% — invest more"} />
            </div>
            <button onClick={() => { setShowHealthPopup(false); }} className="btn btn-primary w-full py-3 mt-5 rounded-xl text-sm" aria-label="Close health score popup">Got it!</button>
            <a href="/health" className="btn btn-secondary w-full py-3 mt-2 rounded-xl text-sm block text-center" aria-label="View full health score breakdown">📊 View Full Health Score</a>
          </Card>
        </div>
      )}

      {hasSelection && (
        <Card className="!p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg grid place-items-center text-sm" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>👤</span>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Showing data for: {selectedNames.join(", ")}</span>
          </div>
        </Card>
      )}

      {/* Overspending Alert */}
      {isOverspending && (
        <div className="p-3.5 rounded-xl mb-4 flex items-center gap-3 fade-in-up" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)" }} role="alert">
          <span className="text-2xl" aria-hidden="true">🚨</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--danger)" }}>Overspending Alert!</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Your expenses ({inr(expense, { compact: true })}) exceed your income ({inr(income, { compact: true })}) this month by <strong style={{ color: "var(--danger)" }}>{inr(expense - income, { compact: true })}</strong>.
            </p>
          </div>
          <button onClick={() => go("/budget")} className="btn btn-ghost text-[11px] px-2 py-1 ml-auto flex-shrink-0" style={{ color: "var(--danger)" }} aria-label="Go to budget page to fix overspending">Fix →</button>
        </div>
      )}

      {/* ─── KPI Row 1 ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 kpi-scroll lg:grid stagger-wide slide-in-up">
        <KpiCard label="Net Worth" value={inr(netWorth, { compact: true })} icon="💎" tone="primary" sub="Assets − Liabilities" onClick={() => go("/networth")} />
        <KpiCard label="Cash in Hand" value={inr(cashInHand, { compact: true })} icon="💵" tone="success" sub={`Bank: ${inr(bankBalance, { compact: true })}`} onClick={() => go("/networth")} />
        <KpiCard label="Income" value={inr(income, { compact: true })} icon="💰" tone="success" trend={{ dir: income >= prevMonth.income ? "up" : "down", text: inr(Math.abs(income - prevMonth.income), { compact: true }), good: income >= prevMonth.income }} sub="vs last mo" onClick={() => go("/income")} />
        <KpiCard label="Expenses" value={inr(expense, { compact: true })} icon="🧾" tone={isOverspending ? "danger" : "danger"} trend={{ dir: expense <= prevMonth.expense ? "down" : "up", text: inr(Math.abs(expense - prevMonth.expense), { compact: true }), good: expense <= prevMonth.expense }} sub={isOverspending ? "⚠️ Over budget!" : "vs last mo"} onClick={() => go("/expenses")} />
      </div>

      {/* ─── KPI Row 2 ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 kpi-scroll lg:grid stagger-wide slide-in-up mt-2 sm:mt-4">
        <KpiCard label="Savings %" value={`${savingsRate.toFixed(0)}%`} icon="🐖" tone="success" trend={{ dir: savingsRate >= 20 ? "up" : "down", text: `${savingsRate.toFixed(0)}%`, good: savingsRate >= 20 }} sub="of income" onClick={() => go("/reports")} />
        <KpiCard label="Inv. Growth" value={inr(invGrowth, { compact: true })} icon="📈" tone="primary" trend={{ dir: "up", text: `${invGrowth > 0 ? "+" : ""}${inr(invGrowth, { compact: true })}`, good: invGrowth >= 0 }} sub="unrealised" onClick={() => go("/investments")} />
        <KpiCard label="Emergency" value={`${emergencyMonths.toFixed(1)} mo`} icon="🛟" tone={emergencyMonths >= 6 ? "success" : "warning"} sub={`${inr(emergencySaved, { compact: true })}`} onClick={() => go("/savings")} />
        <KpiCard
          label="Health Score"
          value={`${score}/100`}
          icon={score >= 75 ? "🎉" : score >= 50 ? "💪" : "⚠️"}
          tone={scoreTone}
          sub="Click for details"
          onClick={() => go("/health")}
        />
      </div>

      {/* ─── Charts ─── */}
      <div className="grid lg:grid-cols-3 gap-4 mt-4 stagger-wide tilt-in">
        <Card title="Income vs Expenses" subtitle={hasSelection ? "Filtered" : "Last 6 months"} className="lg:col-span-2">
          <LineChart labels={flow.map((f) => f.label)} series={[{ name: "Income", values: flow.map((f) => f.income), color: "#10b981" }, { name: "Expenses", values: flow.map((f) => f.expense), color: "#ef4444" }, { name: "Savings", values: flow.map((f) => f.savings), color: "#6366f1" }]} />
        </Card>
        <Card title="Financial Health" subtitle="Overall score" action={
          <button onClick={() => go("/health")} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "var(--primary-soft)", color: "var(--primary)" }} aria-label="View full health score breakdown">Details</button>
        }>
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-40 h-40" role="img" aria-label={`Health score: ${score} out of 100`}>
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-3)" strokeWidth="12" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={`var(--${scoreTone})`} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(score / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`} />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-3xl font-extrabold" style={{ color: "var(--text-heading)" }}>{score}</p>
                  <p className="text-[10px] font-semibold" style={{ color: "var(--text-faint)" }}>out of 100</p>
                </div>
              </div>
            </div>
            <div className="mt-4 w-full space-y-2 text-xs">
              <ScoreRow label="Savings rate" value={`${savingsRate.toFixed(0)}%`} ok={savingsRate >= 20} />
              <ScoreRow label="Emergency cover" value={`${emergencyMonths.toFixed(1)} mo`} ok={emergencyMonths >= 6} />
              <ScoreRow label="Debt-to-income" value={`${debtToIncome.toFixed(0)}%`} ok={debtToIncome <= 35} />
              <ScoreRow label="Invested assets" value={`${investmentRate.toFixed(0)}%`} ok={investmentRate >= 30} />
            </div>
          </div>
        </Card>
      </div>

      <FinancialInsights txns={filteredTxns} bills={bills} />

      {/* Spending by Category with View Tabs */}
      <div className="grid lg:grid-cols-3 gap-4 mt-4 stagger-wide slide-in-up">
        <Card
          title="Spending by Category"
          subtitle={spending.label}
          action={
            <div className="flex gap-1 no-print" role="tablist" aria-label="Spending view period">
              {(["daily", "weekly", "monthly", "yearly"] as SpendingView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setSpendingView(v)}
                  className="px-2 py-1 rounded-md text-[10px] font-bold capitalize transition-all"
                  role="tab"
                  aria-selected={spendingView === v}
                  style={{
                    background: spendingView === v ? "var(--primary)" : "var(--surface-3)",
                    color: spendingView === v ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {v.slice(0, 1).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          }
        >
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
            Total: <strong style={{ color: "var(--text-heading)" }}>{inr(spending.total, { compact: true })}</strong>
          </p>
          {catData.length ? <DonutChart data={catData} centerLabel="Total" centerValue={inr(spending.total, { compact: true })} /> : <p className="text-sm py-10 text-center" style={{ color: "var(--text-faint)" }}>No data for this period</p>}
        </Card>
        <Card title="Goal Progress" subtitle="Top savings goals" className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
            {goals.slice(0, 6).map((g) => {
              const p = (num(g.saved) / num(g.target)) * 100;
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-heading)" }}><span aria-hidden="true">{g.icon}</span> {g.name}</span>
                    <span className="badge badge-primary">{p.toFixed(0)}%</span>
                  </div>
                  <Progress value={p} tone={p >= 75 ? "success" : p >= 40 ? "primary" : "warning"} />
                  <div className="flex justify-between mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}><span>{inr(num(g.saved), { compact: true })}</span><span>{inr(num(g.target), { compact: true })}</span></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4 stagger-wide card-reveal">
        <Card title="Upcoming Bills" subtitle="Unpaid & due soon" className="lg:col-span-2">
          <Table headers={["Bill", "Category", "Due", "Amount", "Status"]} right={[3, 4]}>
            {upcomingBills.map((b) => {
              const dleft = daysUntil(b.dueDate);
              return (
                <Tr key={b.id}>
                  <Td strong>{b.name}</Td>
                  <Td><Badge tone="neutral">{b.category}</Badge></Td>
                  <Td muted>{fmtDate(b.dueDate)} <span style={{ color: dleft < 3 ? "var(--danger)" : "var(--text-faint)" }}>({dleft < 0 ? `${-dleft}d late` : `${dleft}d`})</span></Td>
                  <Td right strong>{inr(num(b.amount))}</Td>
                  <Td right><BillToggle id={b.id} paid={b.paid} /></Td>
                </Tr>
              );
            })}
            {!upcomingBills.length && (<Tr><Td muted>All bills paid 🎉</Td><Td muted>—</Td><Td muted>—</Td><Td right muted>—</Td><Td right muted>—</Td></Tr>)}
          </Table>
        </Card>
        <Card title="EMI Summary" subtitle="Active loans">
          <BarChart data={debts.map((dt) => ({ label: dt.type.replace("Loan", ""), value: num(dt.emi) }))} />
          <div className="mt-4 pt-4 border-t flex justify-between text-sm" style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text-muted)" }}>Total monthly EMI</span>
            <span className="font-bold" style={{ color: "var(--text-heading)" }}>{inr(totalEmi)}</span>
          </div>
        </Card>
      </div>
    </>
  );
}

function ScoreRow({ label, value, ok, reason }: { label: string; value: string; ok: boolean; reason?: string }) {
  return (
    <div className="flex items-center justify-between" role="listitem">
      <div>
        <span style={{ color: "var(--text-muted)" }}>{label}</span>
        {reason && <p className="text-[10px]" style={{ color: ok ? "var(--success)" : "var(--warning)" }}>{reason}</p>}
      </div>
      <span className="font-semibold flex items-center gap-1.5" style={{ color: ok ? "var(--success)" : "var(--warning)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: ok ? "var(--success)" : "var(--warning)" }} aria-hidden="true" />{value}
      </span>
    </div>
  );
}
