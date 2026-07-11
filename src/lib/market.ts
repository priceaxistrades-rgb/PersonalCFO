// Live market data helpers — Indian mutual funds (mfapi.in) & NSE stocks (Yahoo Finance).
// All fetches are server-side to avoid CORS and keep it key-free.
//
// ⚠️  PRECISION NOTE: Market data (stock prices, NAV) arrives as floating-point
// from external APIs and is inherently approximate. Using parseFloat() here is
// acceptable because the source data is already float. CAGR uses Math.pow()
// which is unavoidable for irrational number operations.
//
// For USER-ENTERED financial data (transactions, tax, balances), always use
// the BigInt precision engine in @/lib/finance-math.ts instead.

export type CagrSet = {
  y1: number | null;
  y3: number | null;
  y5: number | null;
};

export type MarketQuote = {
  ok: boolean;
  kind: "stock" | "mf" | "commodity" | "crypto" | "index" | "reit" | "bond";
  id: string; // symbol or scheme code
  name: string;
  extra?: string; // fund house / exchange
  price: number; // latest price or NAV
  prevClose: number;
  change: number;
  changePct: number;
  currency: string;
  cagr: CagrSet;
  asOf: string;
  error?: string;
};

// Compute CAGR given a start value/date and end value/date.
export function cagr(startVal: number, endVal: number, years: number): number | null {
  if (startVal <= 0 || endVal <= 0 || years <= 0) return null;
  return (Math.pow(endVal / startVal, 1 / years) - 1) * 100;
}

// Simple CAGR from invested -> current over a period (in years).
export function simpleCagr(invested: number, current: number, years: number): number | null {
  return cagr(invested, current, years);
}

export function yearsBetween(from: string | Date, to: string | Date = new Date()): number {
  const a = typeof from === "string" ? new Date(from) : from;
  const b = typeof to === "string" ? new Date(to) : to;
  return (b.getTime() - a.getTime()) / (365.25 * 86400000);
}

type PricePoint = { t: number; v: number }; // timestamp ms, value

function cagrFromSeries(points: PricePoint[], latest: number): CagrSet {
  const now = Date.now();
  const yr = 365.25 * 86400000;
  const findClosest = (targetAgoYears: number): number | null => {
    const target = now - targetAgoYears * yr;
    let best: PricePoint | null = null;
    let bestDiff = Infinity;
    for (const p of points) {
      const diff = Math.abs(p.t - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = p;
      }
    }
    // only valid if we actually have data roughly that old (within ~120 days)
    if (!best || bestDiff > 130 * 86400000) return null;
    return best.v;
  };
  const mk = (y: number) => {
    const past = findClosest(y);
    return past ? cagr(past, latest, y) : null;
  };
  return { y1: mk(1), y3: mk(3), y5: mk(5) };
}

// ---- Mutual Funds via mfapi.in ----
export async function fetchMutualFund(schemeCode: string): Promise<MarketQuote> {
  const base: MarketQuote = {
    ok: false,
    kind: "mf",
    id: schemeCode,
    name: `Scheme ${schemeCode}`,
    price: 0,
    prevClose: 0,
    change: 0,
    changePct: 0,
    currency: "INR",
    cagr: { y1: null, y3: null, y5: null },
    asOf: "",
  };
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      meta?: { scheme_name?: string; fund_house?: string; scheme_category?: string };
      data?: { date: string; nav: string }[];
    };
    const data = json.data || [];
    if (!data.length) throw new Error("No NAV data");
    const parseD = (s: string) => {
      const [d, m, y] = s.split("-").map(Number);
      return new Date(y, m - 1, d).getTime();
    };
    const latest = parseFloat(data[0].nav);
    const prev = data[1] ? parseFloat(data[1].nav) : latest;
    const points: PricePoint[] = data.map((p) => ({ t: parseD(p.date), v: parseFloat(p.nav) }));
    return {
      ...base,
      ok: true,
      name: json.meta?.scheme_name || base.name,
      extra: json.meta?.fund_house,
      price: latest,
      prevClose: prev,
      change: latest - prev,
      changePct: prev ? ((latest - prev) / prev) * 100 : 0,
      cagr: cagrFromSeries(points, latest),
      asOf: data[0].date,
    };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "fetch failed" };
  }
}

// ---- Stocks via Yahoo Finance ----
export async function fetchStock(symbol: string): Promise<MarketQuote> {
  const base: MarketQuote = {
    ok: false,
    kind: "stock",
    id: symbol,
    name: symbol,
    price: 0,
    prevClose: 0,
    change: 0,
    changePct: 0,
    currency: "INR",
    cagr: { y1: null, y3: null, y5: null },
    asOf: "",
  };

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    Accept: "application/json",
  };

  try {
    // Important: use a short daily chart for day movement. Do NOT use 5Y weekly
    // chartPreviousClose for day movement — that can point to the range boundary.
    const dayUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?interval=1d&range=5d`;

    const historyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?interval=1wk&range=5y`;

    const [dayRes, historyRes] = await Promise.all([
      fetch(dayUrl, { next: { revalidate: 60 }, headers }),
      fetch(historyUrl, { next: { revalidate: 3600 }, headers }),
    ]);

    if (!dayRes.ok) throw new Error(`Day HTTP ${dayRes.status}`);
    if (!historyRes.ok) throw new Error(`History HTTP ${historyRes.status}`);

    const dayJson = (await dayRes.json()) as {
      chart?: {
        result?: {
          meta?: {
            regularMarketPrice?: number;
            previousClose?: number;
            chartPreviousClose?: number;
            currency?: string;
            shortName?: string;
            longName?: string;
            fullExchangeName?: string;
          };
          timestamp?: number[];
          indicators?: { quote?: { close?: (number | null)[] }[] };
        }[];
        error?: { description?: string } | null;
      };
    };

    const historyJson = (await historyRes.json()) as {
      chart?: {
        result?: {
          meta?: {
            regularMarketPrice?: number;
            currency?: string;
            shortName?: string;
            longName?: string;
            fullExchangeName?: string;
          };
          timestamp?: number[];
          indicators?: { quote?: { close?: (number | null)[] }[] };
        }[];
        error?: { description?: string } | null;
      };
    };

    const dayResult = dayJson.chart?.result?.[0];
    const historyResult = historyJson.chart?.result?.[0];
    if (!dayResult?.meta) throw new Error(dayJson.chart?.error?.description || "No day data");
    if (!historyResult?.meta) throw new Error(historyJson.chart?.error?.description || "No history data");

    const dayMeta = dayResult.meta;
    const historyMeta = historyResult.meta;

    const dayCloses = (dayResult.indicators?.quote?.[0]?.close || []).filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v)
    );

    const price = dayMeta.regularMarketPrice ?? dayCloses[dayCloses.length - 1] ?? 0;

    // Yahoo's previousClose is the real previous trading day's close.
    // If missing, fall back to the second-last daily close. Avoid chartPreviousClose unless necessary.
    const prev =
      dayMeta.previousClose ??
      (dayCloses.length >= 2 ? dayCloses[dayCloses.length - 2] : undefined) ??
      dayMeta.chartPreviousClose ??
      price;

    const ts = historyResult.timestamp || [];
    const closes = historyResult.indicators?.quote?.[0]?.close || [];
    const points: PricePoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (typeof c === "number") points.push({ t: ts[i] * 1000, v: c });
    }

    return {
      ...base,
      ok: true,
      name: dayMeta.longName || dayMeta.shortName || historyMeta.longName || historyMeta.shortName || symbol,
      extra: dayMeta.fullExchangeName || historyMeta.fullExchangeName,
      price,
      prevClose: prev,
      change: price - prev,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
      currency: dayMeta.currency || historyMeta.currency || "INR",
      cagr: cagrFromSeries(points, price),
      asOf: new Date().toLocaleDateString("en-IN"),
    };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "fetch failed" };
  }
}

// ---- Commodities / Crypto / Index / REIT / Bond via Yahoo Finance ----
// These use Yahoo Finance just like stocks but with different symbol conventions:
// Gold: GC=F (USD/oz) or GOLD.NS (Gold ETF INR)
// Silver: SI=F (USD/oz) or SILVER.NS
// Bitcoin: BTC-USD, Ethereum: ETH-USD
// Nifty 50: ^NSEI, Sensex: ^BSESN
// REITs: EMBI.NS etc.

export async function fetchByYahooKind(
  symbol: string,
  kind: "commodity" | "crypto" | "index" | "reit" | "bond",
  displayName?: string,
): Promise<MarketQuote> {
  const base: MarketQuote = {
    ok: false,
    kind,
    id: symbol,
    name: displayName || symbol,
    price: 0,
    prevClose: 0,
    change: 0,
    changePct: 0,
    currency: "INR",
    cagr: { y1: null, y3: null, y5: null },
    asOf: "",
  };

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    Accept: "application/json",
  };

  try {
    const dayUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol,
    )}?interval=1d&range=5d`;

    const historyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol,
    )}?interval=1wk&range=5y`;

    const [dayRes, historyRes] = await Promise.all([
      fetch(dayUrl, { next: { revalidate: 60 }, headers }),
      fetch(historyUrl, { next: { revalidate: 3600 }, headers }),
    ]);

    if (!dayRes.ok) throw new Error(`Day HTTP ${dayRes.status}`);
    if (!historyRes.ok) throw new Error(`History HTTP ${historyRes.status}`);

    const dayJson = (await dayRes.json()) as {
      chart?: {
        result?: {
          meta?: {
            regularMarketPrice?: number;
            previousClose?: number;
            chartPreviousClose?: number;
            currency?: string;
            shortName?: string;
            longName?: string;
            fullExchangeName?: string;
          };
          timestamp?: number[];
          indicators?: { quote?: { close?: (number | null)[] }[] };
        }[];
        error?: { description?: string } | null;
      };
    };

    const historyJson = (await historyRes.json()) as {
      chart?: {
        result?: {
          meta?: {
            regularMarketPrice?: number;
            currency?: string;
            shortName?: string;
            longName?: string;
          };
          timestamp?: number[];
          indicators?: { quote?: { close?: (number | null)[] }[] };
        }[];
        error?: { description?: string } | null;
      };
    };

    const dayResult = dayJson.chart?.result?.[0];
    const historyResult = historyJson.chart?.result?.[0];
    if (!dayResult?.meta) throw new Error(dayJson.chart?.error?.description || "No day data");
    if (!historyResult?.meta) throw new Error(historyJson.chart?.error?.description || "No history data");

    const dayMeta = dayResult.meta;

    const dayCloses = (dayResult.indicators?.quote?.[0]?.close || []).filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v),
    );

    const price = dayMeta.regularMarketPrice ?? dayCloses[dayCloses.length - 1] ?? 0;
    const prev =
      dayMeta.previousClose ??
      (dayCloses.length >= 2 ? dayCloses[dayCloses.length - 2] : undefined) ??
      dayMeta.chartPreviousClose ??
      price;

    const ts = historyResult.timestamp || [];
    const closes = historyResult.indicators?.quote?.[0]?.close || [];
    const points: PricePoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (typeof c === "number") points.push({ t: ts[i] * 1000, v: c });
    }

    const resolvedName =
      dayMeta.longName || dayMeta.shortName ||
      historyResult.meta?.longName || historyResult.meta?.shortName ||
      displayName || symbol;

    return {
      ...base,
      ok: true,
      name: resolvedName,
      extra: dayMeta.fullExchangeName,
      price,
      prevClose: prev,
      change: price - prev,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
      currency: dayMeta.currency || "INR",
      cagr: cagrFromSeries(points, price),
      asOf: new Date().toLocaleDateString("en-IN"),
    };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "fetch failed" };
  }
}

/**
 * Resolve a commodity/crypto/index/bond symbol from an investment type + optional symbol.
 * Returns the Yahoo Finance symbol to use for live price fetching.
 */
export function resolveLiveSymbol(
  type: string,
  symbol: string | null,
): { yahooSymbol: string; kind: MarketQuote["kind"]; displayName: string } | null {
  // If the user has set a custom symbol, use it directly
  if (symbol) {
    // Auto-detect kind from known patterns
    if (symbol.endsWith("-USD") || symbol.endsWith("-INR") || symbol.endsWith("-EUR"))
      return { yahooSymbol: symbol, kind: "crypto", displayName: symbol.replace("-USD", "") };
    if (symbol.startsWith("^")) return { yahooSymbol: symbol, kind: "index", displayName: symbol };
    if (symbol.includes("GOLD") || symbol.includes("GOLDBEES") || symbol.includes("GOLDSHARE"))
      return { yahooSymbol: symbol, kind: "commodity", displayName: "Gold ETF" };
    if (symbol.includes("SILVER") || symbol.includes("SILVERBEES"))
      return { yahooSymbol: symbol, kind: "commodity", displayName: "Silver ETF" };
    // Default: treat as stock
    return { yahooSymbol: symbol, kind: "stock", displayName: symbol };
  }

  // No symbol set — use default tracker based on investment type
  switch (type) {
    case "Gold":
      return { yahooSymbol: "GOLDBEES.NS", kind: "commodity", displayName: "Gold ETF (GoldBees)" };
    case "Silver":
      return { yahooSymbol: "SILVERBEES.NS", kind: "commodity", displayName: "Silver ETF (SilverBees)" };
    case "Crypto":
      return { yahooSymbol: "BTC-USD", kind: "crypto", displayName: "Bitcoin" };
    case "RealEstate":
      return { yahooSymbol: "^CREIT", kind: "reit", displayName: "REIT Index" };
    case "Bonds":
      return { yahooSymbol: "BONDHILDR.NS", kind: "bond", displayName: "Bond ETF" };
    default:
      return null;
  }
}

/**
 * Predefined commodity / crypto / index instruments that users can add
 */
export const PRESET_INSTRUMENTS: {
  category: string;
  items: { symbol: string; kind: MarketQuote["kind"]; name: string; icon: string }[];
}[] = [
  {
    category: "🥇 Commodities",
    items: [
      { symbol: "GOLDBEES.NS", kind: "commodity", name: "Gold ETF (GoldBees)", icon: "🥇" },
      { symbol: "SILVERBEES.NS", kind: "commodity", name: "Silver ETF (SilverBees)", icon: "🥈" },
      { symbol: "GC=F", kind: "commodity", name: "Gold Futures (USD/oz)", icon: "🥇" },
      { symbol: "SI=F", kind: "commodity", name: "Silver Futures (USD/oz)", icon: "🥈" },
    ],
  },
  {
    category: "₿ Cryptocurrency",
    items: [
      { symbol: "BTC-USD", kind: "crypto", name: "Bitcoin (USD)", icon: "₿" },
      { symbol: "ETH-USD", kind: "crypto", name: "Ethereum (USD)", icon: "⟠" },
      { symbol: "BNB-USD", kind: "crypto", name: "BNB (USD)", icon: "🔶" },
      { symbol: "SOL-USD", kind: "crypto", name: "Solana (USD)", icon: "◎" },
      { symbol: "XRP-USD", kind: "crypto", name: "XRP (USD)", icon: "✕" },
      { symbol: "ADA-USD", kind: "crypto", name: "Cardano (USD)", icon: "🔵" },
      { symbol: "DOGE-USD", kind: "crypto", name: "Dogecoin (USD)", icon: "🐕" },
      { symbol: "DOT-USD", kind: "crypto", name: "Polkadot (USD)", icon: "⚫" },
    ],
  },
  {
    category: "📊 Indices",
    items: [
      { symbol: "^NSEI", kind: "index", name: "Nifty 50", icon: "📈" },
      { symbol: "^BSESN", kind: "index", name: "Sensex", icon: "📈" },
      { symbol: "^NSERAIL", kind: "index", name: "Nifty Realty", icon: "🏠" },
      { symbol: "^NSEBANK", kind: "index", name: "Nifty Bank", icon: "🏦" },
      { symbol: "^NSEIT", kind: "index", name: "Nifty IT", icon: "💻" },
    ],
  },
  {
    category: "🏠 REITs",
    items: [
      { symbol: "EMBIREL.NS", kind: "reit", name: "Embassy Office REIT", icon: "🏢" },
      { symbol: "BROOKREIT.NS", kind: "reit", name: "Brookfield REIT", icon: "🏢" },
      { symbol: "MINDREIT.NS", kind: "reit", name: "Mindspace REIT", icon: "🏢" },
    ],
  },
  {
    category: "📜 Bond ETFs",
    items: [
      { symbol: "BONDHILDR.NS", kind: "bond", name: "Bond Hilldr ETF", icon: "📜" },
      { symbol: "LICNETF.NS", kind: "bond", name: "LIC MF Bond ETF", icon: "📜" },
      { symbol: "GILT5YBEES.NS", kind: "bond", name: "Gilt 5Y ETF", icon: "📜" },
      { symbol: "GILT10YBEES.NS", kind: "bond", name: "Gilt 10Y ETF", icon: "📜" },
    ],
  },
];

// ---- MF search ----
type MfScheme = { schemeCode: number; schemeName: string };

let mfSchemeCache: { data: MfScheme[]; loadedAt: number } | null = null;
const MF_CACHE_MS = 24 * 60 * 60 * 1000;

function scoreMfResult(name: string, query: string) {
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  return 3;
}

export async function searchMutualFunds(q: string) {
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];

  try {
    const now = Date.now();
    if (!mfSchemeCache || now - mfSchemeCache.loadedAt > MF_CACHE_MS) {
      // mfapi.in /mf returns the complete public Indian MF scheme list.
      // This is more reliable than the older search endpoint and lets us filter fast server-side.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch("https://api.mfapi.in/mf", {
        next: { revalidate: 86400 },
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return [];
      const json = (await res.json()) as MfScheme[];
      mfSchemeCache = {
        data: Array.isArray(json) ? json : [],
        loadedAt: now,
      };
    }

    const words = query.split(/\s+/).filter(Boolean);
    return mfSchemeCache.data
      .filter((scheme) => {
        const name = scheme.schemeName.toLowerCase();
        return words.every((word) => name.includes(word)) || String(scheme.schemeCode).includes(query);
      })
      .sort((a, b) => scoreMfResult(a.schemeName, query) - scoreMfResult(b.schemeName, query))
      .slice(0, 30);
  } catch {
    return [];
  }
}
