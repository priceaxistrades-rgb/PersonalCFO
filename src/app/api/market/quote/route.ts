import { catchErr } from "@/lib/catch";
import { fetchMutualFund, fetchStock, fetchByYahooKind, MarketQuote, resolveLiveSymbol } from "@/lib/market";

export const dynamic = "force-dynamic";

// GET /api/market/quote?stocks=RELIANCE.NS,TCS.NS&mf=122639,120716
// GET /api/market/quote?commodities=GOLDBEES.NS,SILVERBEES.NS&crypto=BTC-USD,ETH-USD&indices=^NSEI&reits=EMBIREL.NS&bonds=BONDHILDR.NS
// GET /api/market/quote?investments=1,2,3  (auto-resolve live symbols from investment types)

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
  const commodities = (searchParams.get("commodities") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cryptos = (searchParams.get("crypto") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const indices = (searchParams.get("indices") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const reits = (searchParams.get("reits") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const bonds = (searchParams.get("bonds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const results = await Promise.all([
    ...stocks.map((s) => fetchStock(s)),
    ...mfs.map((c) => fetchMutualFund(c)),
    ...commodities.map((s) => fetchByYahooKind(s, "commodity")),
    ...cryptos.map((s) => fetchByYahooKind(s, "crypto")),
    ...indices.map((s) => fetchByYahooKind(s, "index")),
    ...reits.map((s) => fetchByYahooKind(s, "reit")),
    ...bonds.map((s) => fetchByYahooKind(s, "bond")),
  ]);

  const quotes: Record<string, MarketQuote> = {};
  for (const q of results) quotes[`${q.kind}:${q.id}`] = q;

  return Response.json({ ok: true, quotes });
}
