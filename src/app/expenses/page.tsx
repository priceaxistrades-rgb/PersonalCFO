import { SectionTitle } from "@/components/ui/Card";
import { TransactionForm } from "@/components/TransactionForm";
import { MemberSelectorClient } from "@/components/MemberSelectorClient";
import { FilteredExpenses } from "@/components/FilteredExpenses";
import { getTransactions, getMembers } from "@/lib/data";

export const dynamic = "force-dynamic";

const EXPENSE_CATEGORIES = [
  "Housing", "Food", "Groceries", "Electricity", "Water", "Gas", "Internet",
  "Mobile", "Transportation", "Fuel", "Insurance", "Medical", "Education",
  "Shopping", "Entertainment", "Subscriptions", "Travel", "Gifts",
  "Investments", "Miscellaneous",
];

export default async function ExpensesPage() {
  const [txns, members] = await Promise.all([getTransactions(), getMembers()]);
  const expenses = txns.filter((t) => t.type === "expense");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Expense Tracker"
        subtitle="Every rupee, categorised and visualised"
        action={<TransactionForm type="expense" categories={EXPENSE_CATEGORIES} members={members} />}
      />

      <MemberSelectorClient members={members} />

      <FilteredExpenses expenses={expenses} members={members} />
    </div>
  );
}
