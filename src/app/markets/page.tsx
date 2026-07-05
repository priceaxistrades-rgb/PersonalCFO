import { getInvestments, getWatchlist, getAccounts } from "@/lib/data";
import { MarketsClient } from "./MarketsClient";

export default async function MarketsPage() {
  const [watchItems, investments, accounts] = await Promise.all([
    getWatchlist(),
    getInvestments(),
    getAccounts(),
  ]);

  return <MarketsClient
    watchItemsPromise={Promise.resolve(watchItems)}
    investmentsPromise={Promise.resolve(investments)}
    accounts={accounts.map(a => ({ id: a.id, name: a.name, type: a.type }))}
  />;
}
