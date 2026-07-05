import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import {
  getTransactions,
  getBudgets,
  currentMonthKey,
  expenseByCategory,
  sumBy,
} from "@/lib/data";
import { BudgetsManager } from "./BudgetsManager";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const [txns, budgets] = await Promise.all([getTransactions(), getBudgets()]);
  const cm = currentMonthKey();
  const spent = new Map(expenseByCategory(txns, [cm]).map((c) => [c.label, c.value]));

  const rows = budgets
    .map((b) => {
      const limit = num(b.monthlyLimit);
      const used = spent.get(b.category) || 0;
      const diff = limit - used;
      const pct = limit > 0 ? (used / limit) * 100 : 0;
      return { category: b.category, limit, used, diff, pct };
    })
    .sort((a, b) => b.pct - a.pct);

  const totalBudget = sumBy(rows, (r) => r.limit);
  const totalSpent = sumBy(rows, (r) => r.used);
  const totalLeft = totalBudget - totalSpent;
  const overspent = rows.filter((r) => r.used > r.limit);
  const usedPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <SectionTitle title="Budget Planner" subtitle="Planned vs actual spending this month" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 kpi-scroll lg:grid stagger">
        <KpiCard label="Monthly Budget" value={inr(totalBudget, { compact: true })} icon="📊" tone="primary" />
        <KpiCard label="Spent So Far" value={inr(totalSpent, { compact: true })} icon="🧾" tone="danger" sub={`${usedPct.toFixed(0)}% used`} />
        <KpiCard label="Remaining" value={inr(totalLeft, { compact: true })} icon="💵" tone={totalLeft >= 0 ? "success" : "danger"} />
        <KpiCard label="Over Budget" value={String(overspent.length)} icon="⚠️" tone={overspent.length ? "danger" : "success"} sub="categories" />
      </div>

      <BudgetsManager budgets={budgets} />

      {overspent.length > 0 && (
        <Card className="!p-4" >
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>Overspending alert</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                You&apos;ve exceeded budget in: {overspent.map((o) => o.category).join(", ")}. Consider rebalancing next month.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card title="Category Budgets" subtitle="Sorted by usage">
        <Table headers={["Category", "Budget", "Spent", "Difference", "Progress", "Status"]} right={[1, 2, 3]}>
          {rows.map((r) => {
            const tone = r.pct >= 100 ? "danger" : r.pct >= 80 ? "warning" : "success";
            return (
              <Tr key={r.category}>
                <Td strong>{r.category}</Td>
                <Td right muted>{inr(r.limit)}</Td>
                <Td right strong>{inr(r.used)}</Td>
                <Td right>
                  <span style={{ color: r.diff >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {r.diff >= 0 ? "" : "−"}{inr(Math.abs(r.diff))}
                  </span>
                </Td>
                <Td>
                  <div className="w-32 ml-auto sm:ml-0">
                    <Progress value={r.pct} tone={tone} height={6} />
                  </div>
                </Td>
                <Td>
                  <Badge tone={tone}>
                    {r.pct >= 100 ? "Over" : r.pct >= 80 ? "Watch" : "On track"} · {r.pct.toFixed(0)}%
                  </Badge>
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
