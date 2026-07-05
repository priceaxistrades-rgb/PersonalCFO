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

function getMonthKey(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function sumBy<T>(arr: T[], fn: (x: T) => number): number { return arr.reduce((s, x) => s + fn(x), 0); }
function lastNMonths(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) }); }
  return out;
}
function monthlyFlow(txns: any[], months: { key: string; label: string }[]) {
  return months.map((m) => { const income = sumBy(txns.filter((t) => t.type === "income" && getMonthKey(t.txnDate) === m.key), (t) => num(t.amount)); const expense = sumBy(txns.filter((t) => t.type === "expense" && getMonthKey(t.txnDate) === m.key), (t) => num(t.amount)); return { ...m, income, expense, savings: income - expense }; });
}
function currentMonthKey(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function expenseByCategory(txns: any[], monthKeys?: string[]) {
  const map = new Map<string, number>();
  txns.filter((t) => t.type === "expense" && (!monthKeys || monthKeys.includes(getMonthKey(t.txnDate)))).forEach((t) => map.set(t.category, (map.get(t.category) || 0) + num(t.amount)));
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}
function healthScore(input: { savingsRate: number; emergencyMonths: number; debtToIncome: number; investmentRate: number }) {
  let score = 0;
  score += Math.min(30, (input.savingsRate / 30) * 30);
  score += Math.min(25, (input.emergencyMonths / 6) * 25);
  score += Math.max(0, Math.min(25, 25 - ((input.debtToIncome - 20) / 40) * 25));
  score += Math.min(20, (input.investmentRate / 50) * 20);
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function FilteredDashboard({ txns, bills, debts, goals, invs, accounts, members }: { txns: any[]; bills: any[]; debts: any[]; goals: any[]; invs: any[]; accounts: any[]; members: any[] }) {
  const router = useRouter();
  const go = (href: string) => router.push(href);
  const { isSelected, hasSelection, selectedIds } = useMemberFilter();

  const filteredTxns = txns.filter((t) => isSelected(t.memberId));
  const filteredAccounts = accounts.filter((a) => isSelected(a.memberId));
  const filteredInvestments = invs.filter((i) => isSelected(i.memberId));
  const filteredDebts = debts.filter((d) => isSelected(d.memberId));

  const liquidAssets = sumBy(filteredAccounts, (a) => num(a.balance));
  const investmentValue = sumBy(filteredInvestments, (i) => num(i.currentValue));
  const totalAssets = liquidAssets + investmentValue;
  const liabilities = sumBy(filteredDebts, (d) => num(d.outstanding));
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

  const invGrowth = sumBy(invs, (i) => num(i.currentValue)) - sumBy(invs, (i) => num(i.invested));
  const totalEmi = sumBy(debts, (d) => num(d.emi));
  const emergencyGoal = goals.find((g) => g.category === "Emergency");
  const emergencySaved = emergencyGoal ? num(emergencyGoal.saved) : 0;
  const monthlyExpense = hasSelection ? expense : (allThisMonth?.expense || 1);
  const emergencyMonths = monthlyExpense > 0 ? emergencySaved / monthlyExpense : 0;
  const debtToIncome = income > 0 ? (totalEmi / income) * 100 : 0;
  const investmentRate = totalAssets > 0 ? (investmentValue / totalAssets) * 100 : 0;
  const score = healthScore({ savingsRate, emergencyMonths, debtToIncome, investmentRate });

  const catData = expenseByCategory(filteredTxns, [cm]).slice(0, 7);
  const upcomingBills = bills.filter((b) => !b.paid).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
  const scoreTone = score >= 75 ? "success" : score >= 50 ? "warning" : "danger";
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const selectedNames = selectedIds.map((id) => memberMap.get(id)?.name?.split(" ")[0]).filter(Boolean);

  const hasNoData = txns.length === 0 && accounts.length === 0 && invs.length === 0 && debts.length === 0;
  if (hasNoData) return <EmptyDashboard />;

  return (
    <>
      {hasSelection && (
        <Card className="!p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg grid place-items-center text-sm" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>👤</span>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Showing data for: {selectedNames.join(", ")}</span>
          </div>
        </Card>
      )}

      {/* ─── KPI Row 1 ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 kpi-scroll lg:grid stagger">
        <KpiCard label="Net Worth" value={inr(netWorth, { compact: true })} icon="💎" tone="primary" sub="Assets − Liabilities" onClick={() => go("/networth")} />
        <KpiCard label="Cash" value={inr(liquidAssets, { compact: true })} icon="💵" tone="accent" sub="Liquid funds" onClick={() => go("/networth")} />
        <KpiCard label="Income" value={inr(income, { compact: true })} icon="💰" tone="success" trend={{ dir: income >= prevMonth.income ? "up" : "down", text: inr(Math.abs(income - prevMonth.income), { compact: true }), good: income >= prevMonth.income }} sub="vs last mo" onClick={() => go("/income")} />
        <KpiCard label="Expenses" value={inr(expense, { compact: true })} icon="🧾" tone="danger" trend={{ dir: expense <= prevMonth.expense ? "down" : "up", text: inr(Math.abs(expense - prevMonth.expense), { compact: true }), good: expense <= prevMonth.expense }} sub="vs last mo" onClick={() => go("/expenses")} />
      </div>

      {/* ─── KPI Row 2 ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 kpi-scroll lg:grid stagger mt-2 sm:mt-4">
        <KpiCard label="Savings %" value={`${savingsRate.toFixed(0)}%`} icon="🐖" tone="success" trend={{ dir: savingsRate >= 20 ? "up" : "down", text: `${savingsRate.toFixed(0)}%`, good: savingsRate >= 20 }} sub="of income" onClick={() => go("/reports")} />
        <KpiCard label="Inv. Growth" value={inr(invGrowth, { compact: true })} icon="📈" tone="primary" trend={{ dir: "up", text: `${invGrowth > 0 ? "+" : ""}${inr(invGrowth, { compact: true })}`, good: invGrowth >= 0 }} sub="unrealised" onClick={() => go("/investments")} />
        <KpiCard label="Emergency" value={`${emergencyMonths.toFixed(1)} mo`} icon="🛟" tone={emergencyMonths >= 6 ? "success" : "warning"} sub={`${inr(emergencySaved, { compact: true })}`} onClick={() => go("/savings")} />
        <KpiCard label="Total EMI" value={inr(totalEmi, { compact: true })} icon="🏦" tone="warning" sub={`${debtToIncome.toFixed(0)}% income`} onClick={() => go("/debt")} />
      </div>

      {/* ─── Charts ─── */}
      <div className="grid lg:grid-cols-3 gap-4 mt-4 stagger fade-in-up">
        <Card title="Income vs Expenses" subtitle={hasSelection ? "Filtered" : "Last 6 months"} className="lg:col-span-2">
          <LineChart labels={flow.map((f) => f.label)} series={[{ name: "Income", values: flow.map((f) => f.income), color: "#10b981" }, { name: "Expenses", values: flow.map((f) => f.expense), color: "#ef4444" }, { name: "Savings", values: flow.map((f) => f.savings), color: "#6366f1" }]} />
        </Card>
        <Card title="Financial Health" subtitle="Overall score">
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
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

      <div className="grid lg:grid-cols-3 gap-4 mt-4 stagger fade-in-up">
        <Card title="Spending by Category" subtitle={hasSelection ? "Filtered" : "This month"}>
          {catData.length ? <DonutChart data={catData} centerLabel="Total" centerValue={inr(expense, { compact: true })} /> : <p className="text-sm py-10 text-center" style={{ color: "var(--text-faint)" }}>No data yet</p>}
        </Card>
        <Card title="Goal Progress" subtitle="Top savings goals" className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
            {goals.slice(0, 6).map((g) => {
              const p = (num(g.saved) / num(g.target)) * 100;
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-heading)" }}><span>{g.icon}</span> {g.name}</span>
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

      <div className="grid lg:grid-cols-3 gap-4 mt-4 stagger fade-in-up">
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

function ScoreRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-semibold flex items-center gap-1.5" style={{ color: ok ? "var(--success)" : "var(--warning)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: ok ? "var(--success)" : "var(--warning)" }} />{value}
      </span>
    </div>
  );
}
