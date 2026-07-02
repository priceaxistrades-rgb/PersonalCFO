"use client";

import { useMemberFilter } from "@/lib/filters";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart, BarChart, LineChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num, fmtDate } from "@/lib/format";

// Local helpers (no DB)
function getMonthKey(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function sumBy<T>(arr: T[], fn: (x: T) => number): number {
  return arr.reduce((s, x) => s + fn(x), 0);
}

function lastNMonths(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
    });
  }
  return out;
}

function monthlyFlow(txns: any[], months: { key: string; label: string }[]) {
  return months.map((m) => {
    const income = sumBy(
      txns.filter((t) => t.type === "income" && getMonthKey(t.txnDate) === m.key),
      (t) => num(t.amount)
    );
    const expense = sumBy(
      txns.filter((t) => t.type === "expense" && getMonthKey(t.txnDate) === m.key),
      (t) => num(t.amount)
    );
    return { ...m, income, expense, savings: income - expense };
  });
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function expenseByCategory(txns: any[], monthKeys?: string[]) {
  const map = new Map<string, number>();
  txns
    .filter((t) => t.type === "expense" && (!monthKeys || monthKeys.includes(getMonthKey(t.txnDate))))
    .forEach((t) => map.set(t.category, (map.get(t.category) || 0) + num(t.amount)));
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function FilteredExpenses({ 
  expenses, 
  members 
}: { 
  expenses: any[]; 
  members: any[];
}) {
  const { isSelected, hasSelection, selectedIds } = useMemberFilter();
  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const selectedNames = selectedIds.map((id) => memberMap.get(id)?.split(" ")[0]).filter(Boolean);

  // Filter by selected members
  const filteredExpenses = expenses.filter((t) => isSelected(t.memberId));
  
  const cm = currentMonthKey();
  const months = lastNMonths(6);
  const flow = monthlyFlow(filteredExpenses, months);

  const thisMonth = filteredExpenses.filter((t) => getMonthKey(t.txnDate) === cm);
  const total = sumBy(thisMonth, (t) => num(t.amount));
  const avg = sumBy(flow, (f) => f.expense) / flow.length;

  // daily this month
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const dailyTotal = sumBy(filteredExpenses.filter((t) => t.txnDate === todayKey), (t) => num(t.amount));
  const weeklyTotal = sumBy(filteredExpenses.filter((t) => new Date(t.txnDate) >= weekAgo), (t) => num(t.amount));
  const yearKey = String(now.getFullYear());
  const yearlyTotal = sumBy(filteredExpenses.filter((t) => t.txnDate.startsWith(yearKey)), (t) => num(t.amount));

  const catData = expenseByCategory(filteredExpenses, [cm]);

  return (
    <>
      {hasSelection && (
        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--primary)" }}>👤</span>
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Showing expenses for: {selectedNames.join(", ")}
            </span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Today" value={inr(dailyTotal, { compact: true })} icon="📅" tone="accent" />
        <KpiCard label="This Week" value={inr(weeklyTotal, { compact: true })} icon="🗓️" tone="primary" />
        <KpiCard label="This Month" value={inr(total, { compact: true })} icon="🧾" tone="danger" sub={`avg ${inr(avg, { compact: true })}`} />
        <KpiCard label="This Year" value={inr(yearlyTotal, { compact: true })} icon="📆" tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Monthly Spend Trend" subtitle={hasSelection ? "Filtered" : "Last 6 months"} className="lg:col-span-2">
          <LineChart labels={flow.map((f) => f.label)} series={[{ name: "Expenses", values: flow.map((f) => f.expense), color: "#ef4444" }]} />
        </Card>
        <Card title="Category Split" subtitle="This month">
          {catData.length ? (
            <DonutChart data={catData.slice(0, 8)} centerLabel="Total" centerValue={inr(total, { compact: true })} />
          ) : (
            <p className="text-sm py-10 text-center" style={{ color: "var(--text-faint)" }}>
              {hasSelection ? "No expenses for selected members" : "No expenses recorded"}
            </p>
          )}
        </Card>
      </div>

      <Card title="Top Spending Categories" subtitle={hasSelection ? "Filtered" : "This month, ranked"}>
        <BarChart data={catData.slice(0, 10)} />
      </Card>

      <Card title="Recent Transactions" subtitle={hasSelection ? `Filtered entries (${filteredExpenses.length})` : "Latest 30 entries"}>
        <Table headers={["Date", "Category", "Member", "Note", "Amount"]} right={[4]}>
          {(hasSelection ? filteredExpenses : expenses).slice(0, 30).map((t) => (
            <Tr key={t.id}>
              <Td muted>{fmtDate(t.txnDate)}</Td>
              <Td><Badge>{t.category}</Badge></Td>
              <Td muted>{t.memberId ? memberMap.get(t.memberId) ?? "—" : "—"}</Td>
              <Td muted>{t.note || "—"}</Td>
              <Td right strong><span style={{ color: "var(--danger)" }}>−{inr(num(t.amount))}</span></Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
