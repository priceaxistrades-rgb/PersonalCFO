import { SectionTitle } from "@/components/ui/Card";
import { TransactionForm } from "@/components/TransactionForm";
import { MemberSelectorClient } from "@/components/MemberSelectorClient";
import { FilteredIncome } from "@/components/FilteredIncome";
import { getTransactions, getMembers, getAccounts } from "@/lib/data";

export const dynamic = "force-dynamic";

const INCOME_CATEGORIES = [
  "Salary",
  "Business",
  "Freelancing",
  "Rental Income",
  "Dividends",
  "Interest",
  "Other Income",
];

export default async function IncomePage() {
  const [txns, members, accounts] = await Promise.all([getTransactions(), getMembers(), getAccounts()]);
  const income = txns.filter((t) => t.type === "income");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Income Tracker"
        subtitle="All earning sources for the household"
        action={<TransactionForm type="income" categories={INCOME_CATEGORIES} members={members} accounts={accounts} />}
      />

      <MemberSelectorClient members={members} />

      <FilteredIncome income={income} members={members} accounts={accounts} />
    </div>
  );
}
