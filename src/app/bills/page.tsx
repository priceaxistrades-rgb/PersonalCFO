import { Card, SectionTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { inr, num, daysUntil } from "@/lib/format";
import { getBills, sumBy } from "@/lib/data";
import { BillsManager } from "../settings/BillsManager";
import { IconBills, IconCheck, IconAlert, IconOpportunities } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function BillsPage() {
  const bills = await getBills();
  const paid = bills.filter((b) => b.paid);
  const unpaid = bills.filter((b) => !b.paid);
  const totalDue = sumBy(unpaid, (b) => num(b.amount));
  const totalPaid = sumBy(paid, (b) => num(b.amount));
  const overdue = unpaid.filter((b) => daysUntil(b.dueDate) < 0);
  const dueSoon = unpaid.filter((b) => daysUntil(b.dueDate) >= 0 && daysUntil(b.dueDate) <= 7);

  return (
    <div className="space-y-6">
      <SectionTitle title="Scheduled Payables & Subscriptions" subtitle="Monitored household liabilities and automated payment tracking" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Outstanding" value={inr(totalDue, { compact: true })} icon={<IconBills size={18} />} tone="warning" sub={`${unpaid.length} bills`} />
        <KpiCard label="Cleared This Cycle" value={inr(totalPaid, { compact: true })} icon={<IconCheck size={18} />} tone="success" sub={`${paid.length} bills`} />
        <KpiCard label="Due Within 7 Days" value={String(dueSoon.length)} icon={<IconOpportunities size={18} />} tone="primary" />
        <KpiCard label="Overdue" value={String(overdue.length)} icon={<IconAlert size={18} />} tone={overdue.length ? "danger" : "success"} />
      </div>

      {(overdue.length > 0 || dueSoon.length > 0) && (
        <Card className="!p-4 border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 grid place-items-center shrink-0">
              <IconAlert size={18} />
            </span>
            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
              <span className="font-bold uppercase tracking-wider text-amber-400 block sm:inline">Payable Advisory: </span>
              {overdue.length > 0 && <span className="font-bold text-red-400">{overdue.length} bill(s) overdue. </span>}
              {dueSoon.length > 0 && <span className="font-bold text-amber-400">{dueSoon.length} bill(s) due within 7 days. </span>}
              Clear outstanding obligations promptly to maintain household financial integrity.
            </p>
          </div>
        </Card>
      )}

      <BillsManager bills={bills} />
    </div>
  );
}
