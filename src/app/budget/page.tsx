import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import {
  getAllTransactions,
  getBudgets,
  currentMonthKey,
  expenseByCategory,
  sumBy,
} from "@/lib/data";
import { BudgetsManager } from "./BudgetsManager";
import { IconBudgets, IconExpenses, IconSavings, IconAlert } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const [txns, budgets] = await Promise.all([getAllTransactions(), getBudgets()]);
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
      <SectionTitle title="Budget Allocation Ceilings" subtitle="Planned monthly expenditure targets vs actual spending metrics" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Monthly Budget" value={inr(totalBudget, { compact: true })} icon={<IconBudgets size={18} />} tone="primary" />
        <KpiCard label="Spent So Far" value={inr(totalSpent, { compact: true })} icon={<IconExpenses size={18} />} tone="danger" sub={`${usedPct.toFixed(0)}% used`} />
        <KpiCard label="Remaining Allocation" value={inr(totalLeft, { compact: true })} icon={<IconSavings size={18} />} tone={totalLeft >= 0 ? "success" : "danger"} />
        <KpiCard label="Over Ceiling" value={String(overspent.length)} icon={<IconAlert size={18} />} tone={overspent.length ? "danger" : "success"} sub="monitored categories" />
      </div>

      <BudgetsManager budgets={budgets} />

      {overspent.length > 0 && (
        <Card className="!p-4 border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 grid place-items-center shrink-0">
              <IconAlert size={18} />
            </span>
            <div>
              <p className="text-sm font-extrabold tracking-tight text-red-400">Ceiling Breach Alert</p>
              <p className="text-xs mt-0.5 text-slate-300">
                You have exceeded targeted ceilings in: <strong className="text-white">{overspent.map((o) => o.category).join(", ")}</strong>. Consider rebalancing or modifying category ceilings above.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card title="Category Allocation Breakdown" subtitle="Ranked by ceiling utilization percentage">
        <Table headers={["Category", "Budget Ceiling", "Actual Spent", "Variance", "Utilization Progress", "Status"]} right={[1, 2, 3]}>
          {rows.map((r) => {
            const tone = r.pct >= 100 ? "danger" : r.pct >= 80 ? "warning" : "success";
            return (
              <Tr key={r.category}>
                <Td strong><Badge tone="primary">{r.category}</Badge></Td>
                <Td right muted className="font-mono">{inr(r.limit)}</Td>
                <Td right strong className="font-mono">{inr(r.used)}</Td>
                <Td right className="font-mono font-bold">
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
                    {r.pct >= 100 ? "Over" : r.pct >= 80 ? "Watch" : "On Track"} · {r.pct.toFixed(0)}%
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
