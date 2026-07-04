import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { Table, Tr, Td } from "@/components/ui/Table";
import { BillToggle } from "@/components/BillToggle";
import { inr, num, fmtDate, daysUntil } from "@/lib/format";
import { getBills, sumBy } from "@/lib/data";
import { BillsManager } from "../settings/BillsManager";

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
      <SectionTitle title="Bill Tracker" subtitle="Never miss a due date again" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Outstanding" value={inr(totalDue, { compact: true })} icon="🔔" tone="warning" sub={`${unpaid.length} bills`} />
        <KpiCard label="Paid This Cycle" value={inr(totalPaid, { compact: true })} icon="✅" tone="success" sub={`${paid.length} bills`} />
        <KpiCard label="Due Within 7 Days" value={String(dueSoon.length)} icon="⏰" tone="primary" />
        <KpiCard label="Overdue" value={String(overdue.length)} icon="🚨" tone={overdue.length ? "danger" : "success"} />
      </div>

      {(overdue.length > 0 || dueSoon.length > 0) && (
        <Card className="!p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⏰</span>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--text)" }}>Reminder: </span>
              {overdue.length > 0 && <span style={{ color: "var(--danger)" }}>{overdue.length} bill(s) overdue. </span>}
              {dueSoon.length > 0 && <span style={{ color: "var(--warning)" }}>{dueSoon.length} bill(s) due within a week. </span>}
              Pay early to avoid late fees and protect your credit score.
            </p>
          </div>
        </Card>
      )}

      <BillsManager bills={bills} />

      <Card title="All Bills" subtitle="Sorted by due date">
        <Table headers={["Bill", "Category", "Frequency", "Due Date", "Amount", "Status"]} right={[4, 5]}>
          {bills.map((b) => {
            const dleft = daysUntil(b.dueDate);
            const late = !b.paid && dleft < 0;
            const soon = !b.paid && dleft >= 0 && dleft <= 7;
            return (
              <Tr key={b.id}>
                <Td strong>{b.name}</Td>
                <Td muted>{b.category}</Td>
                <Td><Badge>{b.frequency}</Badge></Td>
                <Td muted>
                  {fmtDate(b.dueDate)}{" "}
                  {!b.paid && (
                    <span style={{ color: late ? "var(--danger)" : soon ? "var(--warning)" : "var(--text-faint)" }}>
                      ({dleft < 0 ? `${-dleft}d late` : `${dleft}d`})
                    </span>
                  )}
                </Td>
                <Td right strong>{inr(num(b.amount))}</Td>
                <Td right><BillToggle id={b.id} paid={b.paid} /></Td>
              </Tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
