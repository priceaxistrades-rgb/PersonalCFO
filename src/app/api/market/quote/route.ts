import { fetchMutualFund, fetchStock, MarketQuote } from "@/lib/market";

export const dynamic = "force-dynamic";

// GET /api/market/quote?stocks=RELIANCE.NS,TCS.NS&mf=122639,120716
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stocks = (searchParams.get("stocks") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const mfs = (searchParams.get("mf") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const results = await Promise.all([
    ...stocks.map((s) => fetchStock(s)),
    ...mfs.map((c) => fetchMutualFund(c)),
  ]);

  const quotes: Record<string, MarketQuote> = {};
  for (const q of results) quotes[`${q.kind}:${q.id}`] = q;

  return Response.json({ ok: true, quotes });
}
