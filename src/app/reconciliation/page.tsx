import { SectionTitle, Badge } from "@/components/ui/Card";
import { getAllTransactions } from "@/lib/data";
import { ReconciliationClient } from "./ReconciliationClient";

export const dynamic = "force-dynamic";

export default async function ReconciliationPage() {
  const transactions = await getAllTransactions();
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Transaction Reconciliation"
        subtitle="Verify recorded activity and review potential duplicate entries before they affect your reports."
        action={<Badge tone="primary">Data integrity</Badge>}
      />
      <ReconciliationClient transactions={transactions.map((row) => ({
        id: row.id,
        type: row.type,
        category: row.category,
        amount: String(row.amount),
        txnDate: row.txnDate,
        note: row.note,
        accountId: row.accountId,
        reconciled: Boolean(row.reconciled),
        reconciledAt: row.reconciledAt ? new Date(row.reconciledAt).toISOString() : null,
      }))} />
    </div>
  );
}
