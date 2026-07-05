import { getInvestments, getWatchlist } from "@/lib/data";
import { MarketsClient } from "./MarketsClient";

export default async function MarketsPage() {
  const watchItemsPromise = getWatchlist();
  const investmentsPromise = getInvestments();

  return <MarketsClient watchItemsPromise={watchItemsPromise} investmentsPromise={investmentsPromise} />;
}
