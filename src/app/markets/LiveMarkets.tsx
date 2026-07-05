"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import type { MarketQuote } from "@/lib/market";

type WatchItem = {
  id: number;
  kind: string;
  symbol: string | null;
  schemeCode: string | null;
  label: string;
  source?: "watchlist" | "investment";
  units?: string | null;
  invested?: string | null;
};

type ChartPoint = { date: string; value: number; open?: number; high?: number; low?: number; close?: number };
type ChartRange = "1m" | "3m" | "6m" | "1y" | "3y" | "5y";
type ChartType = "line" | "candle";
const CHART_RANGES: { id: ChartRange; label: string }[] = [
  { id: "1m", label: "1M" },
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
  { id: "1y", label: "1Y" },
  { id: "3y", label: "3Y" },
  { id: "5y", label: "5Y" },
];
type ChartTarget = { kind: "stock" | "mf"; id: string; label: string };

function fmtNum(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function Cagr({ v }: { v: number | null }) {
  if (v === null || v === undefined) return <span style={{ color: "var(--text-faint)" }}>—</span>;
  return <span style={{ color: v >= 0 ? "var(--success)" : "var(--danger)" }}>{v >= 0 ? "+" : ""}{v.toFixed(1)}%</span>;
}

function MiniChart({ points, chartType, supportsCandles }: { points: ChartPoint[]; chartType: ChartType; supportsCandles: boolean }) {
  if (points.length < 2) {
    return <p className="text-sm py-8 text-center" style={{ color: "var(--text-faint)" }}>Not enough chart data.</p>;
  }
  const width = 760;
  const height = 280;
  const pad = { l: 46, r: 16, t: 16, b: 30 };
  const values = points.flatMap((p) => [p.high ?? p.value, p.low ?? p.value, p.value]).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (i / Math.max(points.length - 1, 1)) * innerW;
  const y = (v: number) => pad.t + innerH - ((v - min) / range) * innerH;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const change = first ? ((last - first) / first) * 100 : 0;
  const color = change >= 0 ? "var(--success)" : "var(--danger)";
  const candleWidth = Math.max(3, Math.min(10, innerW / points.length / 1.8));
  const renderCandles = chartType === "candle" && supportsCandles;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{points[0].date}</span>
        <span style={{ color }}>{change >= 0 ? "+" : ""}{change.toFixed(2)}% over chart range</span>
        <span>{points[points.length - 1].date}</span>
      </div>
      {!supportsCandles && chartType === "candle" && (
        <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
          Candle chart is available for stocks. Mutual funds publish daily NAV, so NAV line chart is shown.
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={pad.l} x2={width - pad.r} y1={pad.t + innerH * g} y2={pad.t + innerH * g} stroke="var(--border)" />
        ))}
        {renderCandles ? (
          points.map((p, i) => {
            const open = p.open ?? p.value;
            const close = p.close ?? p.value;
            const high = p.high ?? Math.max(open, close);
            const low = p.low ?? Math.min(open, close);
            const up = close >= open;
            const c = up ? "var(--success)" : "var(--danger)";
            const cx = x(i);
            const top = y(Math.max(open, close));
            const bottom = y(Math.min(open, close));
            return (
              <g key={`${p.date}-${i}`}>
                <line x1={cx} x2={cx} y1={y(high)} y2={y(low)} stroke={c} strokeWidth="1.3" />
                <rect
                  x={cx - candleWidth / 2}
                  y={top}
                  width={candleWidth}
                  height={Math.max(1, bottom - top)}
                  fill={up ? "transparent" : c}
                  stroke={c}
                  strokeWidth="1.2"
                  rx="1"
                />
              </g>
            );
          })
        ) : (
          <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        )}
        <text x={8} y={y(max) + 4} fontSize="11" fill="var(--text-muted)">{max.toFixed(2)}</text>
        <text x={8} y={y(min) + 4} fontSize="11" fill="var(--text-muted)">{min.toFixed(2)}</text>
      </svg>
    </div>
  );
}

export function LiveMarkets({ 
  items, 
  onAddToPortfolio 
}: { 
  items: WatchItem[], 
  onAddToPortfolio: (item: WatchItem) => void 
}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<string>("");
  const [chartTarget, setChartTarget] = useState<ChartTarget | null>(null);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>("1y");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [supportsCandles, setSupportsCandles] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stocks = useMemo(() => items.filter((i) => i.kind === "stock" && i.symbol).map((i) => i.symbol!), [items]);
  const mfs = useMemo(() => items.filter((i) => i.kind === "mf" && i.schemeCode).map((i) => i.schemeCode!), [items]);

  const load = useCallback(async () => {
    if (!items.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (stocks.length) params.set("stocks", stocks.join(","));
    if (mfs.length) params.set("mf", mfs.join(","));
    try {
      const res = await fetch(`/api/market/quote?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      setQuotes(json.quotes || {});
      setUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch {
      // Keep previous prices on transient API errors.
    }
    setLoading(false);
  }, [items.length, stocks, mfs]);

  useEffect(() => {
    const start = setTimeout(() => void load(), 0);
    timer.current = setInterval(() => void load(), 30000);
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
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  const stockItems = items.filter((i) => i.kind === "stock");
  const mfItems = items.filter((i) => i.kind === "mf");

  const renderRows = (list: WatchItem[]) =>
    list.map((it) => {
      const key = it.kind === "stock" ? `stock:${it.symbol}` : `mf:${it.schemeCode}`;
      const q = quotes[key];
      const target = it.kind === "stock" && it.symbol
        ? { kind: "stock" as const, id: it.symbol, label: it.label }
        : it.kind === "mf" && it.schemeCode
          ? { kind: "mf" as const, id: it.schemeCode, label: it.label }
          : null;
      return (
        <Tr key={`${it.source || "watchlist"}-${it.id}-${key}`}>
          <Td strong>
            {it.label}
            <span className="block text-[10px]" style={{ color: "var(--text-faint)" }}>
              {q?.extra || (it.source === "investment" ? "Synced from investments" : "Watchlist")}
            </span>
          </Td>
          <Td right strong>{q?.ok ? fmtNum(q.price, q.currency) : q ? "—" : "…"}</Td>
          <Td right>
            {q?.ok ? (
              <span style={{ color: q.change >= 0 ? "var(--success)" : "var(--danger)" }}>
                {q.change >= 0 ? "▲" : "▼"} {q.changePct.toFixed(2)}%
              </span>
            ) : (
              <span style={{ color: "var(--text-faint)" }}>{q?.error ? "err" : "…"}</span>
            )}
          </Td>
          <Td right><Cagr v={q?.cagr.y1 ?? null} /></Td>
          <Td right><Cagr v={q?.cagr.y3 ?? null} /></Td>
          <Td right><Cagr v={q?.cagr.y5 ?? null} /></Td>
          <Td right>
            <div className="flex justify-end gap-1 no-print">
              {target && (
                <button
                  onClick={() => onAddToPortfolio(it)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                >
                  + Add
                </button>
              )}
              {it.source !== "investment" ? (
                <button
                  onClick={() => remove(it.id, it.source)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
                >
                  ✕
                </button>
              ) : (
                <Badge tone="primary">Linked</Badge>
              )}
            </div>
          </Td>
        </Tr>
      );
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: loading ? "var(--warning)" : "var(--success)" }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: loading ? "var(--warning)" : "var(--success)" }} />
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {loading ? "Fetching live prices…" : `Live · updated ${updated}`}
          </span>
        </div>
        <button onClick={load} className="text-xs font-medium no-print px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5" style={{ background: "var(--surface-3)", color: "var(--text)" }}>
          🔄 Refresh
        </button>
      </div>

      {chartTarget && (
        <Card
          title={`📊 ${chartTarget.label} Chart`}
          subtitle={chartTarget.kind === "mf" ? "Mutual fund NAV history from mfapi.in" : "Stock price history from Yahoo Finance"}
          action={
            <button onClick={() => setChartTarget(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "var(--surface-3)", color: "var(--text)" }}>
              Close
            </button>
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 no-print">
            <div className="flex flex-wrap gap-1.5">
              {CHART_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() => changeRange(range.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: chartRange === range.id ? "var(--primary)" : "var(--surface-3)",
                    color: chartRange === range.id ? "#fff" : "var(--text)",
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(["line", "candle"] as ChartType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  disabled={type === "candle" && !supportsCandles}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
                  style={{
                    background: chartType === type ? "var(--primary)" : "var(--surface-3)",
                    color: chartType === type ? "#fff" : "var(--text)",
                    opacity: type === "candle" && !supportsCandles ? 0.45 : 1,
                  }}
                  title={type === "candle" && !supportsCandles ? "Candles available for stocks only" : `${type} chart`}
                >
                  {type === "line" ? "Line" : "Candle"}
                </button>
              ))}
            </div>
          </div>

          {chartLoading ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>Loading chart...</p>
          ) : chartError ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--danger)" }}>{chartError}</p>
          ) : (
            <MiniChart points={chartPoints} chartType={chartType} supportsCandles={supportsCandles} />
          )}
        </Card>
      )}

      <Card title="📈 Live Stocks (NSE/BSE)" subtitle="Prices via Yahoo Finance · auto-refresh 30s">
        {stockItems.length ? (
          <Table headers={["Stock", "Price", "Day", "1Y CAGR", "3Y CAGR", "5Y CAGR", "Actions"]} right={[1, 2, 3, 4, 5, 6]}>
            {renderRows(stockItems)}
          </Table>
        ) : (
          <p className="text-sm py-6 text-center" style={{ color: "var(--text-faint)" }}>No stocks tracked. Add one below or add stock investments.</p>
        )}
      </Card>

      <Card title="🏦 Live Mutual Funds" subtitle="NAV via AMFI / mfapi.in · updates daily">
        {mfItems.length ? (
          <Table headers={["Fund", "NAV", "Day", "1Y CAGR", "3Y CAGR", "5Y CAGR", "Actions"]} right={[1, 2, 3, 4, 5, 6]}>
            {renderRows(mfItems)}
          </Table>
        ) : (
          <p className="text-sm py-6 text-center" style={{ color: "var(--text-faint)" }}>No mutual funds tracked. Search & add one below or add MF investments.</p>
        )}
      </Card>
    </div>
  );
}
