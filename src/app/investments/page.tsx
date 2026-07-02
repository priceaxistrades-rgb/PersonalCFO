import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import { getInvestments, sumBy } from "@/lib/data";
import { simpleCagr, yearsBetween } from "@/lib/market";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  MutualFunds: "Mutual Funds",
  RealEstate: "Real Estate",
};

export default async function InvestmentsPage() {
  const invs = await getInvestments();
  const invested = sumBy(invs, (i) => num(i.invested));
  const current = sumBy(invs, (i) => num(i.currentValue));
  const pnl = current - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  const weightedReturn =
    current > 0 ? sumBy(invs, (i) => num(i.annualReturn) * num(i.currentValue)) / current : 0;

  const cagrFor = (i: (typeof invs)[number]) => {
    if (i.startDate) {
      const yrs = yearsBetween(i.startDate);
      const c = simpleCagr(num(i.invested), num(i.currentValue), yrs);
      if (c !== null) return c;
    }
    return num(i.annualReturn);
  };

  // allocation by type
  const byType = new Map<string, number>();
  invs.forEach((i) => byType.set(i.type, (byType.get(i.type) || 0) + num(i.currentValue)));
  const allocation = [...byType.entries()]
    .map(([t, v]) => ({ label: TYPE_LABELS[t] || t, value: v }))
    .sort((a, b) => b.value - a.value);

  const rows = [...invs].sort((a, b) => num(b.currentValue) - num(a.currentValue));

  return (
    <div className="space-y-6">
      <SectionTitle title="Investment Dashboard" subtitle="Portfolio performance & allocation" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Portfolio Value" value={inr(current, { compact: true })} icon="📈" tone="primary" />
        <KpiCard label="Total Invested" value={inr(invested, { compact: true })} icon="💼" tone="accent" />
        <KpiCard
          label="Total P&L"
          value={inr(pnl, { compact: true })}
          icon={pnl >= 0 ? "🟢" : "🔴"}
          tone={pnl >= 0 ? "success" : "danger"}
          trend={{ dir: pnl >= 0 ? "up" : "down", text: `${pnlPct.toFixed(1)}%`, good: pnl >= 0 }}
        />
        <KpiCard label="Weighted Return" value={`${weightedReturn.toFixed(1)}%`} icon="🎯" tone="warning" sub="p.a." />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Asset Allocation" subtitle="By instrument type">
          <DonutChart data={allocation} centerLabel="Total" centerValue={inr(current, { compact: true })} />
        </Card>

        <Card
          title="Holdings"
          subtitle="All investments with CAGR"
          className="lg:col-span-2"
          action={
            <Link
              href="/markets"
              className="text-xs font-semibold no-print px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              🛰️ Live Markets
            </Link>
          }
        >
          <Table headers={["Instrument", "Type", "Invested", "Current", "P&L", "CAGR"]} right={[2, 3, 4, 5]}>
            {rows.map((i) => {
              const inv = num(i.invested);
              const cur = num(i.currentValue);
              const p = cur - inv;
              const pp = inv > 0 ? (p / inv) * 100 : 0;
              const c = cagrFor(i);
              return (
                <Tr key={i.id}>
                  <Td strong>{i.name}</Td>
                  <Td><Badge>{TYPE_LABELS[i.type] || i.type}</Badge></Td>
                  <Td right muted>{inr(inv, { compact: true })}</Td>
                  <Td right strong>{inr(cur, { compact: true })}</Td>
                  <Td right>
                    <span style={{ color: p >= 0 ? "var(--success)" : "var(--danger)" }}>
                      {p >= 0 ? "+" : "−"}{inr(Math.abs(p), { compact: true })} ({pp.toFixed(1)}%)
                    </span>
                  </Td>
                  <Td right>
                    <span style={{ color: c >= 0 ? "var(--success)" : "var(--danger)" }}>
                      {c >= 0 ? "+" : ""}{c.toFixed(1)}%
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        </Card>
      </div>
    </div>
  );
}
