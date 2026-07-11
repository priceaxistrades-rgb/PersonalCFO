import { catchErr } from "@/lib/catch";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type ChartPoint = {
  date: string;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
};

const RANGE_MAP: Record<string, { yahooRange: string; interval: string; mfDays: number; max: number }> = {
  "1m": { yahooRange: "1mo", interval: "1d", mfDays: 31, max: 80 },
  "3m": { yahooRange: "3mo", interval: "1d", mfDays: 93, max: 120 },
  "6m": { yahooRange: "6mo", interval: "1d", mfDays: 186, max: 160 },
  "1y": { yahooRange: "1y", interval: "1d", mfDays: 366, max: 220 },
  "3y": { yahooRange: "3y", interval: "1wk", mfDays: 1100, max: 220 },
  "5y": { yahooRange: "5y", interval: "1wk", mfDays: 1830, max: 260 },
};

function getRange(input: string | null) {
  return RANGE_MAP[input || "1y"] || RANGE_MAP["1y"];
}

function downsample<T>(points: T[], max = 260) {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  return points.filter((_, index) => index % step === 0).slice(-max);
}

async function stockHistory(symbol: string, rangeKey: string): Promise<ChartPoint[]> {
  const range = getRange(rangeKey);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${range.interval}&range=${range.yahooRange}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 PersonalCFO/1.0",
    },
  });
  if (!res.ok) throw new Error(`Yahoo chart HTTP ${res.status}`);
  const json = (await res.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ open?: Array<number | null>; high?: Array<number | null>; low?: Array<number | null>; close?: Array<number | null> }> };
      }>;
      error?: { description?: string } | null;
    };
  };
  const r = json.chart?.result?.[0];
  if (!r) throw new Error(json.chart?.error?.description || "No stock chart data");
  const timestamps = r.timestamp || [];
  const quote = r.indicators?.quote?.[0] || {};
  const opens = quote.open || [];
  const highs = quote.high || [];
  const lows = quote.low || [];
  const closes = quote.close || [];
  const points: ChartPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (typeof close === "number" && Number.isFinite(close)) {
      const open = typeof opens[i] === "number" ? opens[i]! : close;
      const high = typeof highs[i] === "number" ? highs[i]! : Math.max(open, close);
      const low = typeof lows[i] === "number" ? lows[i]! : Math.min(open, close);
      points.push({
        date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
        value: close,
        open,
        high,
        low,
        close,
      });
    }
  }
  return downsample(points, range.max);
}

async function mutualFundHistory(schemeCode: string, rangeKey: string): Promise<ChartPoint[]> {
  const range = getRange(rangeKey);
  const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`MF chart HTTP ${res.status}`);
  const json = (await res.json()) as { data?: Array<{ date: string; nav: string }> };
  const data = json.data || [];
  const cutoff = Date.now() - range.mfDays * 86400000;
  const points = data
    .map((p) => {
      const [d, m, y] = p.date.split("-");
      const date = `${y}-${m}-${d}`;
      return { date, value: Number(p.nav), close: Number(p.nav) };
    })
    .filter((p) => Number.isFinite(p.value) && new Date(p.date).getTime() >= cutoff)
    .reverse();
  return downsample(points, range.max);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id") || "";
  const range = searchParams.get("range") || "1y";

  if (!id || !["stock", "mf", "commodity", "crypto", "index", "reit", "bond"].includes(kind || "")) {
    return Response.json({ error: "kind=stock|mf|commodity|crypto|index|reit|bond and id are required" }, { status: 400 });
  }

  try {
    let points: ChartPoint[];
    let supportsCandles: boolean;

    if (kind === "mf") {
      points = await mutualFundHistory(id, range);
      supportsCandles = false;
    } else {
      // Stocks, commodities, crypto, indices, REITs, bonds — all via Yahoo Finance
      points = await stockHistory(id, range);
      supportsCandles = true;
    }

    return Response.json({ ok: true, kind, id, range, supportsCandles, points });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load chart" },
      { status: 500 }
    );
  }
}
