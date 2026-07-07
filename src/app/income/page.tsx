import { SectionTitle } from "@/components/ui/Card";
import { TransactionForm } from "@/components/TransactionForm";
import { MemberSelectorClient } from "@/components/MemberSelectorClient";
import { FilteredIncome } from "@/components/FilteredIncome";
import { getAllTransactions, getMembers, getAccounts } from "@/lib/data";
import { INCOME_CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

const incomeCategories = [...INCOME_CATEGORIES];

export default async function IncomePage() {
  const [txns, members, accounts] = await Promise.all([getAllTransactions(), getMembers(), getAccounts()]);
  const income = txns.filter((t) => t.type === "income");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Income Tracker"
        subtitle="All earning sources for the household"
        action={<TransactionForm type="income" categories={incomeCategories} members={members} accounts={accounts} />}
      />

      <MemberSelectorClient members={members} />

      <FilteredIncome income={income} members={members} accounts={accounts} />
    </div>
  );
}
