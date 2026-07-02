"use client";

import { useMemberFilter } from "@/lib/filters";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart, LineChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num, fmtDate } from "@/lib/format";

// Local month key function
function getMonthKey(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Helper functions that don't need DB
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

export function FilteredIncome({ 
  income, 
  members 
}: { 
  income: any[]; 
  members: any[];
}) {
  const { isSelected, hasSelection, selectedIds } = useMemberFilter();
  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const selectedNames = selectedIds.map((id) => memberMap.get(id)?.split(" ")[0]).filter(Boolean);

  // Filter by selected members
  const filteredIncome = income.filter((t) => isSelected(t.memberId));
  
  const cm = currentMonthKey();
  const months = lastNMonths(6);
  const flow = monthlyFlow(filteredIncome, months);

  const thisMonthIncome = filteredIncome.filter((t) => getMonthKey(t.txnDate) === cm);
  const total = sumBy(thisMonthIncome, (t) => num(t.amount));
  const avg = flow.length > 0 ? sumBy(flow, (f) => f.income) / flow.length : 0;

  const byCat = new Map<string, number>();
  thisMonthIncome.forEach((t) => byCat.set(t.category, (byCat.get(t.category) || 0) + num(t.amount)));
  const catData = [...byCat.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const topSource = catData[0];

  return (
    <>
      {hasSelection && (
        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--primary)" }}>👤</span>
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Showing income for: {selectedNames.join(", ")}
            </span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="This Month" value={inr(total, { compact: true })} icon="💰" tone="success" />
        <KpiCard label="6-Month Average" value={inr(avg, { compact: true })} icon="📊" tone="primary" />
        <KpiCard label="Income Sources" value={String(catData.length)} icon="🔗" tone="accent" sub="active streams" />
        <KpiCard label="Top Source" value={topSource ? inr(topSource.value, { compact: true }) : "—"} icon="⭐" tone="warning" sub={topSource?.label} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Income Trend" subtitle={hasSelection ? "Filtered" : "Monthly inflow"} className="lg:col-span-2">
          <LineChart
            labels={flow.map((f) => f.label)}
            series={[{ name: "Income", values: flow.map((f) => f.income), color: "#10b981" }]}
          />
        </Card>
        <Card title="Source Breakdown" subtitle="This month">
          {catData.length ? (
            <DonutChart data={catData} centerLabel="Total" centerValue={inr(total, { compact: true })} />
          ) : (
            <p className="text-sm py-10 text-center" style={{ color: "var(--text-faint)" }}>
              {hasSelection ? "No income for selected members" : "No income recorded"}
            </p>
          )}
        </Card>
      </div>

      <Card title="Recent Income" subtitle={hasSelection ? `Latest entries (${filteredIncome.length})` : "Latest 25 entries"}>
        <Table headers={["Date", "Source", "Member", "Note", "Amount"]} right={[4]}>
          {(hasSelection ? filteredIncome : income).slice(0, 25).map((t) => (
            <Tr key={t.id}>
              <Td muted>{fmtDate(t.txnDate)}</Td>
              <Td strong>
                <Badge tone="success">{t.category}</Badge>
              </Td>
              <Td muted>{t.memberId ? memberMap.get(t.memberId) ?? "—" : "—"}</Td>
              <Td muted>{t.note || "—"}</Td>
              <Td right strong>
                <span style={{ color: "var(--success)" }}>+{inr(num(t.amount))}</span>
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
