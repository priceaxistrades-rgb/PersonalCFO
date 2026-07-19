"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr } from "@/lib/format";
import type { MarketQuote } from "@/lib/market";
import {
  IconRefresh, IconMarkets, IconInvestments, IconDashboard,
  IconArrowRight, IconSparkles, IconAlert, IconCheck, IconTarget
} from "@/components/ui/Icons";

export type WatchItem = {
  id: number;
  symbol?: string;
  schemeCode?: string | null;
  name: string;
  kind: string;
  currency?: string;
  source?: string;
  invested?: number | string;
  currentValue?: number | string;
  units?: number | string;
};

function sumBy<T>(arr: T[], fn: (x: T) => number) {
  return arr.reduce((sum, item) => sum + fn(item), 0);
}

type ChartRange = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y";
type ChartType = "line" | "candle";
type ChartTarget = { id: string; label: string; kind: "stock" | "mf" };

const CHART_RANGES: { id: ChartRange; label: string }[] = [
  { id: "1d", label: "1D" },
  { id: "5d", label: "5D" },
  { id: "1mo", label: "1M" },
  { id: "6mo", label: "6M" },
  { id: "1y", label: "1Y" },
  { id: "5y", label: "5Y" },
];

function compactINR(value: number) {
  return inr(value, { compact: true });
}

function fmtNum(n: number | null | undefined, curr = "INR") {
  if (n === null || n === undefined) return "—";
  if (curr === "USD") return `$${n.toFixed(2)}`;
  return inr(n);
}

function Cagr({ v }: { v: number | null }) {
  if (v === null || Number.isNaN(v)) return <span style={{ color: "var(--text-faint)" }}>—</span>;
  return (
    <span className="font-mono font-bold" style={{ color: v >= 0 ? "var(--success)" : "var(--danger)" }}>
      {v >= 0 ? "+" : ""}{v.toFixed(1)}%
    </span>
  );
}

function HoldingsBadge({ item, livePrice }: { item: WatchItem; livePrice: number | null }) {
  if (item.source !== "investment") return null;
  const invested = Number(item.invested || 0);
  const units = Number(item.units || 0);
  const manualValue = Number(item.currentValue || 0);
  const liveVal = livePrice && units > 0 ? livePrice * units : manualValue;
  const pnl = liveVal - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
      {units > 0 && <Badge tone="primary" className="font-mono">{units} units held</Badge>}
      {invested > 0 && (
        <span className={`font-mono font-bold text-[11px] ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {pnl >= 0 ? "+" : ""}{compactINR(pnl)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
        </span>
      )}
    </div>
  );
}

function MiniChart({ points, chartType, supportsCandles }: { points: Array<{ time: string; price: number; open?: number; high?: number; low?: number; close?: number }>; chartType: ChartType; supportsCandles: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!points.length) return <p className="text-sm py-10 text-center text-slate-400">No history available for this range</p>;

  const width = 640;
  const height = 240;
  const pad = { l: 12, r: 12, t: 16, b: 24 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const prices = points.map((p) => p.close ?? p.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const rng = max - min || 1;
  const x = (i: number) => pad.l + (i / Math.max(points.length - 1, 1)) * innerW;
  const y = (v: number) => pad.t + innerH - ((v - min) / rng) * innerH;

  const pts = points.map((p, i) => `${x(i)},${y(p.close ?? p.price)}`).join(" ");
  const area = `${pts} ${x(points.length - 1)},${pad.t + innerH} ${x(0)},${pad.t + innerH}`;
  const first = prices[0];
  const last = prices[prices.length - 1];
  const color = last >= first ? "#10b981" : "#f43f5e";

  return (
    <div className="w-full select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" style={{ height }} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((g, i) => (
          <line key={i} x1={pad.l} x2={width - pad.r} y1={pad.t + innerH * g} y2={pad.t + innerH * g} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
        ))}

        <polygon points={area} fill="url(#chartGrad)" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((_, i) => (
          <rect key={i} x={x(i) - innerW / (2 * Math.max(points.length - 1, 1))} y={0} width={innerW / Math.max(points.length - 1, 1)} height={height} fill="transparent" onMouseEnter={() => setHover(i)} className="cursor-pointer" />
        ))}

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + innerH} stroke="var(--text-faint)" strokeWidth="1.5" strokeDasharray="4 4" />
        )}
      </svg>
      {hover !== null && (
        <div className="flex justify-between items-center text-xs font-mono font-bold mt-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-surface-2">
          <span className="text-slate-400">{points[hover].time}</span>
          <span style={{ color }}>{inr(points[hover].close ?? points[hover].price)}</span>
        </div>
      )}
    </div>
  );
}

export function LiveMarkets({
  items,
  onAddToPortfolio,
  onSell,
}: {
  items: WatchItem[];
  onAddToPortfolio?: (item: WatchItem & { currentPrice?: number }) => void;
  onSell?: (item: WatchItem) => void;
}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [chartTarget, setChartTarget] = useState<ChartTarget | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>("1mo");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [chartPoints, setChartPoints] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");
  const [supportsCandles, setSupportsCandles] = useState(false);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLoadTime = useRef<Date>(new Date());

  const stocks = useMemo(() => items.filter((i) => i.kind === "stock" && i.symbol).map((i) => i.symbol!), [items]);
  const mfs = useMemo(() => items.filter((i) => i.kind === "mf" && i.schemeCode).map((i) => i.schemeCode!), [items]);
  const commodities = useMemo(() => items.filter((i) => i.kind === "commodity" && i.symbol).map((i) => i.symbol!), [items]);
  const cryptos = useMemo(() => items.filter((i) => i.kind === "crypto" && i.symbol).map((i) => i.symbol!), [items]);
  const indices = useMemo(() => items.filter((i) => i.kind === "index" && i.symbol).map((i) => i.symbol!), [items]);
  const reits = useMemo(() => items.filter((i) => i.kind === "reit" && i.symbol).map((i) => i.symbol!), [items]);
  const bonds = useMemo(() => items.filter((i) => i.kind === "bond" && i.symbol).map((i) => i.symbol!), [items]);

  const [secondsAgo, setSecondsAgo] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - lastLoadTime.current.getTime()) / 1000);
      setSecondsAgo(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    if (!items.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setQuoteError("");
    const params = new URLSearchParams();
    if (stocks.length) params.set("stocks", stocks.join(","));
    if (mfs.length) params.set("mf", mfs.join(","));
    if (commodities.length) params.set("commodities", commodities.join(","));
    if (cryptos.length) params.set("crypto", cryptos.join(","));
    if (indices.length) params.set("indices", indices.join(","));
    if (reits.length) params.set("reits", reits.join(","));
    if (bonds.length) params.set("bonds", bonds.join(","));
    try {
      const res = await fetch(`/api/market/quote?${params.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Quote service unavailable (HTTP ${res.status})`);
      setQuotes(json?.quotes || {});
      lastLoadTime.current = new Date();
      setUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch (error) {
      setQuoteError(error instanceof Error ? error.message : "Unable to refresh live market quotes");
    } finally { setLoading(false); }
  }, [items.length, stocks, mfs, commodities, cryptos, indices, reits, bonds]);

  useEffect(() => {
    const start = setTimeout(() => void load(), 0);
    timer.current = setInterval(() => void load(), 5000);
    return () => {
      clearTimeout(start);
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  const loadChart = useCallback(async (target: ChartTarget, range: ChartRange) => {
    setChartLoading(true);
    setChartError("");
    setChartPoints([]);
    try {
      const res = await fetch(`/api/market/history?kind=${target.kind}&id=${encodeURIComponent(target.id)}&range=${range}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load chart");
      setChartPoints(data.points || []);
      setSupportsCandles(Boolean(data.supportsCandles));
      if (!data.supportsCandles && chartType === "candle") setChartType("line");
    } catch (error) {
      setChartError(error instanceof Error ? error.message : "Unable to load chart");
    } finally {
      setChartLoading(false);
    }
  }, [chartType]);

  const openChart = async (target: ChartTarget) => {
    setChartTarget(target);
    await loadChart(target, chartRange);
  };

  const changeRange = (range: ChartRange) => {
    setChartRange(range);
    if (chartTarget) void loadChart(chartTarget, range);
  };

  const remove = async (id: number, source?: string) => {
    if (source === "investment") return;
    if (!confirm("Remove this instrument from your watchlist?")) return;
    try {
      const res = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) router.refresh();
    } catch {}
  };

  const marketStatus = updated ? `Updated ${updated} · Yahoo Finance / AMFI MFAPI` : loading ? "Loading live quotes…" : "Live quotes ready";

  const renderRows = (list: WatchItem[]) =>
    list.map((it) => {
      const instrumentId = it.kind === "mf" ? (it.schemeCode || it.symbol || "") : (it.symbol || it.schemeCode || "");
      const displayName = it.name || instrumentId || "Unnamed instrument";
      const key = it.kind === "stock" || it.kind === "commodity" || it.kind === "crypto" || it.kind === "index" || it.kind === "reit" || it.kind === "bond"
        ? `stock:${instrumentId}`
        : `mf:${instrumentId}`;
      const q = quotes[key];
      const target: ChartTarget | null = instrumentId ? (it.kind === "stock" || it.kind === "commodity" || it.kind === "crypto" || it.kind === "index" || it.kind === "reit" || it.kind === "bond"
        ? { id: instrumentId, label: displayName, kind: "stock" }
        : { id: instrumentId, label: displayName, kind: "mf" }) : null;

      const isHeld = it.source === "investment";
      const livePrice = q?.ok ? q.price : null;

      return (
        <Tr key={`${it.kind}-${it.id}`} className={isHeld ? "bg-indigo-500/[0.03]" : ""}>
          <Td strong>
            <div className="flex items-start justify-between gap-2">
              <div
                className="cursor-pointer group flex-1"
                onClick={() => target && openChart(target)}
              >
                <div className="flex items-center gap-2">
                  <span className="market-instrument-name group-hover:text-indigo-400 transition-colors text-white font-bold">{displayName}</span>
                  {isHeld && <Badge tone="primary" className="font-mono text-[9px]">HELD IN PORTFOLIO</Badge>}
                </div>
                <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                  {q?.extra || (isHeld ? "Synced from portfolio" : "Watchlist")}
                </span>
              </div>
            </div>
            <HoldingsBadge item={it} livePrice={livePrice} />
          </Td>
          <Td right strong className="font-mono font-bold text-white">{q?.ok ? fmtNum(q.price, q.currency) : q ? "—" : "…"}</Td>
          <Td right className="font-mono font-bold">
            {q?.ok ? (
              <span style={{ color: q.change >= 0 ? "var(--success)" : "var(--danger)" }}>
                {q.change >= 0 ? "+" : ""}{q.changePct.toFixed(2)}%
              </span>
            ) : (
              <span style={{ color: "var(--text-faint)" }}>{q?.error ? "err" : "…"}</span>
            )}
          </Td>
          <Td right><Cagr v={q?.cagr.y1 ?? null} /></Td>
          <Td right><Cagr v={q?.cagr.y3 ?? null} /></Td>
          <Td right><Cagr v={q?.cagr.y5 ?? null} /></Td>
          <Td right>
            <div className="flex justify-end gap-1.5 no-print">
              {onSell && isHeld && (
                <button
                  onClick={() => onSell(it)}
                  className="btn btn-secondary text-xs px-2.5 py-1 font-bold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                >
                  Sell
                </button>
              )}
              {target && (
                <button
                  onClick={() => openChart(target)}
                  className="btn btn-ghost text-xs px-2.5 py-1 font-bold border border-white/[0.08]"
                >
                  Chart
                </button>
              )}
              {!isHeld && (
                <button
                  onClick={() => remove(it.id, it.source)}
                  className="btn btn-ghost text-xs px-2.5 py-1 font-bold text-red-400 hover:bg-red-500/10"
                >
                  ✕
                </button>
              )}
            </div>
          </Td>
        </Tr>
      );
    });

  const stockItems = items.filter((i) => i.kind === "stock");
  const mfItems = items.filter((i) => i.kind === "mf");
  const commodityItems = items.filter((i) => i.kind === "commodity");
  const cryptoItems = items.filter((i) => i.kind === "crypto");
  const indexItems = items.filter((i) => i.kind === "index");
  const reitItems = items.filter((i) => i.kind === "reit");
  const bondItems = items.filter((i) => i.kind === "bond");

  const investedItems = items.filter((i) => i.source === "investment");
  const totalInvested = sumBy(investedItems, (i) => Number(i.invested || 0));
  const totalCurrent = sumBy(investedItems, (i) => {
    const instrumentId = i.kind === "mf" ? (i.schemeCode || i.symbol || "") : (i.symbol || i.schemeCode || "");
    const key = i.kind === "stock" ? `stock:${instrumentId}` : `mf:${instrumentId}`;
    const q = quotes[key];
    const units = Number(i.units || 0);
    const manualVal = Number(i.currentValue || 0);
    return q?.ok && q.price > 0 && units > 0 ? q.price * units : manualVal;
  });
  const totalPnl = totalCurrent - totalInvested;

  return (
    <div className="space-y-6 animate-fade-in w-full select-none">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
            <IconMarkets size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Live Market Tickers & Watchlist</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Tickers v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Real-time polling of NSE stocks, AMFI mutual fund schemes, commodities, and crypto assets</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center", { detail: { type: "investment" } }))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Track Market Instrument</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-2xl border bg-surface-2 shadow-sm" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 text-xs font-bold" style={{ color: "var(--text-heading)" }}>
          <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 grid place-items-center shrink-0">
            <IconMarkets size={16} />
          </span>
          <div>
            <span className="block">{loading ? "Fetching live market prices…" : updated ? `Live Ticker Feed Polled at ${updated} · (${secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`})` : "Live Market Sync Ready"}</span>
            <span className="block text-[11px] font-medium text-slate-400">NSE Equities refresh every 30s · AMFI NAV closing rates updated daily</span>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="btn btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50">
          <IconRefresh size={13} className={loading ? "animate-spin" : ""} /> <span>{loading ? "Polling…" : "Poll Live Tickers"}</span>
        </button>
      </div>

      {investedItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 animate-fade-in">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Watchlist Invested Capital</p>
            <p className="text-lg font-mono font-black text-white mt-0.5">{compactINR(totalInvested)}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Live Current Valuation</p>
            <p className="text-lg font-mono font-black text-emerald-400 mt-0.5">{compactINR(totalCurrent)}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Total Unrealized P&L</p>
            <p className={`text-lg font-mono font-black mt-0.5 ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalPnl >= 0 ? "+" : ""}{compactINR(totalPnl)} ({totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(1) : "0"}%)
            </p>
          </div>
        </div>
      )}

      {chartTarget && (
        <Card
          title={`${chartTarget.label} Ticker Telemetry`}
          subtitle={chartTarget.kind === "mf" ? "Mutual fund NAV trajectory from mfapi.in" : "Exchange order book trajectory from Yahoo Finance"}
          action={
            <button onClick={() => setChartTarget(null)} className="btn btn-ghost text-xs px-3 py-1.5 font-bold font-mono">
              ✕ Close Chart
            </button>
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 no-print pt-1">
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-surface-2 border border-white/[0.06]">
              {CHART_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() => changeRange(range.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    chartRange === range.id ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 p-1 rounded-xl bg-surface-2 border border-white/[0.06]">
              {(["line", "candle"] as ChartType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  disabled={type === "candle" && !supportsCandles}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                    chartType === type ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-white"
                  } ${type === "candle" && !supportsCandles ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {type === "line" ? "Spline Area" : "Candlestick"}
                </button>
              ))}
            </div>
          </div>

          {chartLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">Polling historical order book telemetry…</div>
          ) : chartError ? (
            <div className="py-12 text-center text-red-400 text-sm font-bold">{chartError}</div>
          ) : (
            <MiniChart points={chartPoints} chartType={chartType} supportsCandles={supportsCandles} />
          )}
        </Card>
      )}

      <Card title="Live Indian Equities (NSE / BSE)" subtitle="Real-time share prices polled via Yahoo Finance API · auto-refresh 30s">
        {stockItems.length ? (
          <Table headers={["Instrument / Company", "Live Price", "Day %", "1Y CAGR", "3Y CAGR", "5Y CAGR", "Actions"]} right={[1, 2, 3, 4, 5, 6]}>
            {renderRows(stockItems)}
          </Table>
        ) : (
          <div className="py-10 text-center text-slate-400 text-sm font-medium">No equities tracked yet. Add ticker symbols below or link your portfolio stocks.</div>
        )}
      </Card>

      <Card title="Live Mutual Funds & ETFs" subtitle="AMFI scheme NAV rates polled daily via mfapi.in">
        {mfItems.length ? (
          <Table headers={["Fund / Scheme Name", "NAV Price", "Day %", "1Y CAGR", "3Y CAGR", "5Y CAGR", "Actions"]} right={[1, 2, 3, 4, 5, 6]}>
            {renderRows(mfItems)}
          </Table>
        ) : (
          <div className="py-10 text-center text-slate-400 text-sm font-medium">No mutual funds tracked yet. Search & link AMFI scheme codes below.</div>
        )}
      </Card>

      {commodityItems.length > 0 && (
        <Card title="Live Commodities (Gold & Silver)" subtitle="Precious metals & commodity contracts polled via Yahoo Finance">
          <Table headers={["Commodity", "Live Price", "Day %", "1Y CAGR", "3Y CAGR", "5Y CAGR", "Actions"]} right={[1, 2, 3, 4, 5, 6]}>
            {renderRows(commodityItems)}
          </Table>
        </Card>
      )}
      {cryptoItems.length > 0 && (
        <Card title="Live Digital Assets (Crypto)" subtitle="Bitcoin, Ethereum & digital currencies polled via Yahoo Finance">
          <Table headers={["Crypto Asset", "Live Price", "Day %", "1Y CAGR", "3Y CAGR", "5Y CAGR", "Actions"]} right={[1, 2, 3, 4, 5, 6]}>
            {renderRows(cryptoItems)}
          </Table>
        </Card>
      )}
      {indexItems.length > 0 && (
        <Card title="Live Market Indices" subtitle="Nifty 50, Sensex & macro indices polled via Yahoo Finance">
          <Table headers={["Index Name", "Value", "Day %", "1Y CAGR", "3Y CAGR", "5Y CAGR", "Actions"]} right={[1, 2, 3, 4, 5, 6]}>
            {renderRows(indexItems)}
          </Table>
        </Card>
      )}
      {reitItems.length > 0 && (
        <Card title="Real Estate Investment Trusts (REITs)" subtitle="Listed Indian REITs polled via Yahoo Finance">
          <Table headers={["REIT Name", "Price", "Day %", "1Y CAGR", "3Y CAGR", "5Y CAGR", "Actions"]} right={[1, 2, 3, 4, 5, 6]}>
            {renderRows(reitItems)}
          </Table>
        </Card>
      )}
      {bondItems.length > 0 && (
        <Card title="Government & Corporate Bond ETFs" subtitle="Listed bond ETFs & NCDs polled via Yahoo Finance">
          <Table headers={["Bond Instrument", "Price", "Day %", "1Y CAGR", "3Y CAGR", "5Y CAGR", "Actions"]} right={[1, 2, 3, 4, 5, 6]}>
            {renderRows(bondItems)}
          </Table>
        </Card>
      )}
    </div>
  );
}
