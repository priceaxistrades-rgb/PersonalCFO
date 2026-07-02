// Live market data helpers — Indian mutual funds (mfapi.in) & NSE stocks (Yahoo Finance).
// All fetches are server-side to avoid CORS and keep it key-free.

export type CagrSet = {
  y1: number | null;
  y3: number | null;
  y5: number | null;
};

export type MarketQuote = {
  ok: boolean;
  kind: "stock" | "mf";
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
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?interval=1wk&range=5y`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      chart?: {
        result?: {
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            previousClose?: number;
            currency?: string;
            symbol?: string;
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
    const r = json.chart?.result?.[0];
    if (!r || !r.meta) throw new Error(json.chart?.error?.description || "No data");
    const meta = r.meta;
    const price = meta.regularMarketPrice ?? 0;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const ts = r.timestamp || [];
    const closes = r.indicators?.quote?.[0]?.close || [];
    const points: PricePoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (typeof c === "number") points.push({ t: ts[i] * 1000, v: c });
    }
    return {
      ...base,
      ok: true,
      name: meta.longName || meta.shortName || symbol,
      extra: meta.fullExchangeName,
      price,
      prevClose: prev,
      change: price - prev,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
      currency: meta.currency || "INR",
      cagr: cagrFromSeries(points, price),
      asOf: new Date().toLocaleDateString("en-IN"),
    };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "fetch failed" };
  }
}

// ---- MF search ----
export async function searchMutualFunds(q: string) {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { schemeCode: number; schemeName: string }[];
    return json.slice(0, 15);
  } catch {
    return [];
  }
}
