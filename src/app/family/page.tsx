import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { DonutChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import { getAllTransactions, getMembers, currentMonthKey, monthKey, sumBy } from "@/lib/data";
import { MembersManager } from "../settings/MembersManager";
import { TransactionsManager } from "../settings/TransactionsManager";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const [txns, members] = await Promise.all([getAllTransactions(), getMembers()]);
  const cm = currentMonthKey();
  const monthExpenses = txns.filter((t) => t.type === "expense" && monthKey(t.txnDate) === cm);
  const total = sumBy(monthExpenses, (t) => num(t.amount));

  const perMember = members.map((m) => {
    const spend = sumBy(monthExpenses.filter((t) => t.memberId === m.id), (t) => num(t.amount));
    const cats = new Map<string, number>();
    monthExpenses
      .filter((t) => t.memberId === m.id)
      .forEach((t) => cats.set(t.category, (cats.get(t.category) || 0) + num(t.amount)));
    const topCat = [...cats.entries()].sort((a, b) => b[1] - a[1])[0];
    return { ...m, spend, topCat: topCat?.[0] ?? "—", pct: total > 0 ? (spend / total) * 100 : 0 };
  });

  const unassigned = sumBy(monthExpenses.filter((t) => !t.memberId), (t) => num(t.amount));
  const donutData = perMember
    .filter((m) => m.spend > 0)
    .map((m) => ({ label: m.name, value: m.spend, color: m.color }));

  const topSpender = [...perMember].sort((a, b) => b.spend - a.spend)[0];

  return (
    <div className="space-y-6">
      <SectionTitle title="Family Budget Planner" subtitle="Spending tracked per family member" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 kpi-scroll lg:grid stagger">
        <KpiCard label="Family Spend" value={inr(total, { compact: true })} icon="👨‍👩‍👧‍👦" tone="primary" sub="this month" />
        <KpiCard label="Members" value={String(members.length)} icon="🧑‍🤝‍🧑" tone="accent" />
        <KpiCard label="Top Spender" value={topSpender?.name.split(" ")[0] ?? "—"} icon="📌" tone="warning" sub={inr(topSpender?.spend ?? 0, { compact: true })} />
        <KpiCard label="Per Member Avg" value={inr(total / Math.max(members.length, 1), { compact: true })} icon="➗" tone="success" />
      </div>

      <MembersManager members={members} />
      <TransactionsManager transactions={txns} members={members} />

      <div className="grid lg:grid-cols-3 gap-4 stagger fade-in-up">
        <Card title="Spend Distribution" subtitle="By member, this month">
          {donutData.length ? (
            <DonutChart data={donutData} centerLabel="Total" centerValue={inr(total, { compact: true })} />
          ) : (
            <p className="text-sm py-10 text-center" style={{ color: "var(--text-faint)" }}>No data</p>
          )}
        </Card>

        <Card title="Member Breakdown" subtitle="Allocation and top category" className="lg:col-span-2">
          <div className="space-y-4">
            {perMember.map((m) => (
              <div key={m.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text)" }}>
                    <span className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                    {m.name}
                    <Badge>{m.role}</Badge>
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{inr(m.spend)}</span>
                </div>
                <Progress value={m.pct} tone="primary" height={6} />
                <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                  {m.pct.toFixed(0)}% of family spend · Top: {m.topCat}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Shared & Household Expenses" subtitle="This month detail">
        <Table headers={["Member", "Role", "Top Category", "Monthly Spend", "% of Total"]} right={[3, 4]}>
          {perMember.map((m) => (
            <Tr key={m.id}>
              <Td strong>{m.name}</Td>
              <Td muted>{m.role}</Td>
              <Td muted>{m.topCat}</Td>
              <Td right strong>{inr(m.spend)}</Td>
              <Td right muted>{m.pct.toFixed(1)}%</Td>
            </Tr>
          ))}
          {unassigned > 0 && (
            <Tr>
              <Td strong>Unassigned</Td>
              <Td muted>—</Td>
              <Td muted>Misc</Td>
              <Td right strong>{inr(unassigned)}</Td>
              <Td right muted>{((unassigned / Math.max(total, 1)) * 100).toFixed(1)}%</Td>
            </Tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
