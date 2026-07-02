import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { LineChart, GroupedBarChart, BarChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { PrintButton } from "@/components/PrintButton";
import { ExcelButton } from "@/components/ExcelButton";
import { inr, num } from "@/lib/format";
import {
  getTransactions,
  getSnapshots,
  getInvestments,
  lastNMonths,
  monthlyFlow,
  expenseByCategory,
  sumBy,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [txns, snaps, invs] = await Promise.all([
    getTransactions(),
    getSnapshots(),
    getInvestments(),
  ]);

  const months = lastNMonths(6);
  const flow = monthlyFlow(txns, months);
  const totalIncome = sumBy(flow, (f) => f.income);
  const totalExpense = sumBy(flow, (f) => f.expense);
  const totalSavings = totalIncome - totalExpense;
  const avgSavingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  // Quarterly grouping (last 4 quarters approx from snapshots is complex; use 6-month flow grouped by 2)
  const catData = expenseByCategory(txns).slice(0, 8);

  const nwLabels = snaps.map((s) =>
    new Date(s.snapshotDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
  );
  const nwSeries = snaps.map((s) => num(s.assets) - num(s.liabilities));

  const invInvested = sumBy(invs, (i) => num(i.invested));
  const invCurrent = sumBy(invs, (i) => num(i.currentValue));

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Financial Reports"
        subtitle="Comprehensive monthly, quarterly & yearly analysis"
        action={
          <div className="flex items-center gap-2">
            <ExcelButton compact />
            <PrintButton />
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="6-Mo Income" value={inr(totalIncome, { compact: true })} icon="💰" tone="success" />
        <KpiCard label="6-Mo Expenses" value={inr(totalExpense, { compact: true })} icon="🧾" tone="danger" />
        <KpiCard label="6-Mo Savings" value={inr(totalSavings, { compact: true })} icon="🐖" tone="primary" />
        <KpiCard label="Avg Savings Rate" value={`${avgSavingsRate.toFixed(0)}%`} icon="📊" tone="accent" />
      </div>

      <Card title="Income vs Expense vs Savings" subtitle="Monthly comparison report">
        <GroupedBarChart
          groups={flow.map((f) => f.label)}
          series={[
            { name: "Income", values: flow.map((f) => f.income), color: "#10b981" },
            { name: "Expenses", values: flow.map((f) => f.expense), color: "#ef4444" },
            { name: "Savings", values: flow.map((f) => f.savings), color: "#6366f1" },
          ]}
        />
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Net Worth Growth" subtitle="12-month trend">
          <LineChart labels={nwLabels} series={[{ name: "Net Worth", values: nwSeries, color: "#6366f1" }]} />
        </Card>
        <Card title="Top Expense Categories" subtitle="Across all records">
          <BarChart data={catData} />
        </Card>
      </div>

      <Card title="Monthly Statement" subtitle="Detailed breakdown">
        <Table headers={["Month", "Income", "Expenses", "Savings", "Savings Rate"]} right={[1, 2, 3, 4]}>
          {flow.map((f) => {
            const rate = f.income > 0 ? (f.savings / f.income) * 100 : 0;
            return (
              <Tr key={f.key}>
                <Td strong>{f.label}</Td>
                <Td right><span style={{ color: "var(--success)" }}>{inr(f.income)}</span></Td>
                <Td right><span style={{ color: "var(--danger)" }}>{inr(f.expense)}</span></Td>
                <Td right strong>{inr(f.savings)}</Td>
                <Td right>
                  <Badge tone={rate >= 30 ? "success" : rate >= 15 ? "primary" : "warning"}>
                    {rate.toFixed(0)}%
                  </Badge>
                </Td>
              </Tr>
            );
          })}
          <Tr>
            <Td strong>Total</Td>
            <Td right strong><span style={{ color: "var(--success)" }}>{inr(totalIncome)}</span></Td>
            <Td right strong><span style={{ color: "var(--danger)" }}>{inr(totalExpense)}</span></Td>
            <Td right strong>{inr(totalSavings)}</Td>
            <Td right strong>{avgSavingsRate.toFixed(0)}%</Td>
          </Tr>
        </Table>
      </Card>

      <Card title="Investment Summary" subtitle="Portfolio snapshot">
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Invested</p>
            <p className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>{inr(invInvested, { compact: true })}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current Value</p>
            <p className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>{inr(invCurrent, { compact: true })}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Gains</p>
            <p className="text-xl font-bold mt-1" style={{ color: "var(--success)" }}>
              +{inr(invCurrent - invInvested, { compact: true })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
