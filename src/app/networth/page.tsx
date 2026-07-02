import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { LineChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import { getAccounts, getInvestments, getDebts, getSnapshots, computeNetWorth, sumBy } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NetWorthPage() {
  const [accs, invs, debts, snaps, nw] = await Promise.all([
    getAccounts(),
    getInvestments(),
    getDebts(),
    getSnapshots(),
    computeNetWorth(),
  ]);

  const labels = snaps.map((s) =>
    new Date(s.snapshotDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
  );
  const netSeries = snaps.map((s) => num(s.assets) - num(s.liabilities));
  const assetSeries = snaps.map((s) => num(s.assets));
  const liabSeries = snaps.map((s) => num(s.liabilities));

  const first = netSeries[0] ?? 0;
  const last = netSeries[netSeries.length - 1] ?? nw.netWorth;
  const prev = netSeries[netSeries.length - 2] ?? last;
  const yearlyGrowth = last - first;
  const yearlyPct = first > 0 ? (yearlyGrowth / first) * 100 : 0;
  const monthlyGrowth = last - prev;

  const assetRows = [
    ...accs.map((a) => ({ name: a.name, type: a.type, value: num(a.balance), kind: "asset" as const })),
    ...invs.map((i) => ({ name: i.name, type: i.type, value: num(i.currentValue), kind: "asset" as const })),
  ].sort((a, b) => b.value - a.value);
  const liabRows = debts.map((d) => ({ name: d.name, type: d.type, value: num(d.outstanding) }));

  return (
    <div className="space-y-6">
      <SectionTitle title="Net Worth Tracker" subtitle="Your complete financial picture over time" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Net Worth" value={inr(nw.netWorth, { compact: true })} icon="💎" tone="primary" />
        <KpiCard label="Total Assets" value={inr(nw.totalAssets, { compact: true })} icon="📦" tone="success" />
        <KpiCard label="Total Liabilities" value={inr(nw.liabilities, { compact: true })} icon="📉" tone="danger" />
        <KpiCard
          label="12-Month Growth"
          value={inr(yearlyGrowth, { compact: true })}
          icon="🚀"
          tone="accent"
          trend={{ dir: yearlyGrowth >= 0 ? "up" : "down", text: `${yearlyPct.toFixed(0)}%`, good: yearlyGrowth >= 0 }}
        />
      </div>

      <Card title="Net Worth Trend" subtitle={`Monthly net growth: ${inr(monthlyGrowth, { compact: true })}`}>
        <LineChart
          labels={labels}
          series={[
            { name: "Net Worth", values: netSeries, color: "#6366f1" },
            { name: "Assets", values: assetSeries, color: "#10b981" },
            { name: "Liabilities", values: liabSeries, color: "#ef4444" },
          ]}
          height={280}
        />
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Assets" subtitle={`${inr(nw.totalAssets, { compact: true })} total`}>
          <Table headers={["Asset", "Type", "Value"]} right={[2]}>
            {assetRows.map((a, i) => (
              <Tr key={i}>
                <Td strong>{a.name}</Td>
                <Td><Badge tone="success">{a.type}</Badge></Td>
                <Td right strong>{inr(a.value, { compact: true })}</Td>
              </Tr>
            ))}
          </Table>
        </Card>

        <Card title="Liabilities" subtitle={`${inr(nw.liabilities, { compact: true })} total`}>
          <Table headers={["Liability", "Type", "Balance"]} right={[2]}>
            {liabRows.map((l, i) => (
              <Tr key={i}>
                <Td strong>{l.name}</Td>
                <Td><Badge tone="danger">{l.type}</Badge></Td>
                <Td right strong>{inr(l.value, { compact: true })}</Td>
              </Tr>
            ))}
          </Table>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-between text-sm font-bold">
              <span style={{ color: "var(--text)" }}>Net Worth</span>
              <span style={{ color: "var(--primary)" }}>{inr(nw.netWorth, { compact: true })}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
