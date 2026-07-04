import { searchIndianStocks } from "@/lib/indian-stocks";

export const dynamic = "force-dynamic";

type StockResult = {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE" | "INDEX" | "OTHER";
  sector?: string;
};

function normaliseExchange(symbol: string, exchange?: string): StockResult["exchange"] {
  if (symbol.startsWith("^")) return "INDEX";
  if (symbol.endsWith(".NS") || exchange?.toUpperCase().includes("NSE")) return "NSE";
  if (symbol.endsWith(".BO") || exchange?.toUpperCase().includes("BSE")) return "BSE";
  return "OTHER";
}

async function searchYahooIndianStocks(q: string): Promise<StockResult[]> {
  if (q.trim().length < 1) return [];
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=50&newsCount=0&enableFuzzyQuery=true&quotesQueryId=tss_match_phrase_query`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 PersonalCFO/1.0",
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      quotes?: Array<{
        symbol?: string;
        shortname?: string;
        longname?: string;
        exchDisp?: string;
        exchange?: string;
        quoteType?: string;
        sector?: string;
      }>;
    };

    return (json.quotes || [])
      .filter((item) => {
        const symbol = item.symbol || "";
        const quoteType = item.quoteType || "";
        const exchangeText = `${item.exchange || ""} ${item.exchDisp || ""}`.toUpperCase();
        const isIndian = symbol.endsWith(".NS") || symbol.endsWith(".BO") || symbol.startsWith("^NSE") || symbol.startsWith("^BSE") || exchangeText.includes("NSE") || exchangeText.includes("BSE");
        const isUsable = ["EQUITY", "INDEX", "ETF", "MUTUALFUND"].includes(quoteType) || symbol.endsWith(".NS") || symbol.endsWith(".BO") || symbol.startsWith("^");
        return Boolean(symbol && isIndian && isUsable);
      })
      .map((item) => ({
        symbol: item.symbol!,
        name: item.longname || item.shortname || item.symbol!,
        exchange: normaliseExchange(item.symbol!, item.exchDisp || item.exchange),
        sector: item.sector,
      }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const [yahoo, fallback] = await Promise.all([
    searchYahooIndianStocks(q),
    Promise.resolve(searchIndianStocks(q)),
  ]);

  const seen = new Set<string>();
  const results = [...yahoo, ...fallback]
    .filter((item) => {
      if (seen.has(item.symbol)) return false;
      seen.add(item.symbol);
      return true;
    })
    .slice(0, 50);

  return Response.json({ ok: true, results });
}
