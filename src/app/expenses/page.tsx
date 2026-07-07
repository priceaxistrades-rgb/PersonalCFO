import { SectionTitle } from "@/components/ui/Card";
import { TransactionForm } from "@/components/TransactionForm";
import { MemberSelectorClient } from "@/components/MemberSelectorClient";
import { FilteredExpenses } from "@/components/FilteredExpenses";
import { getAllTransactions, getMembers, getAccounts } from "@/lib/data";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

const expenseCategories = [...EXPENSE_CATEGORIES];

export default async function ExpensesPage() {
  const [txns, members, accounts] = await Promise.all([getAllTransactions(), getMembers(), getAccounts()]);
  const expenses = txns.filter((t) => t.type === "expense");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Expense Tracker"
        subtitle="Every rupee, categorised and visualised"
        action={<TransactionForm type="expense" categories={expenseCategories} members={members} accounts={accounts} />}
      />

      <MemberSelectorClient members={members} />

      <FilteredExpenses expenses={expenses} members={members} accounts={accounts} />
    </div>
  );
}
