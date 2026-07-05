"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import { type MarketQuote } from "@/lib/market";

const TYPE_LABELS: Record<string, string> = {
  MutualFunds: "Mutual Funds",
  RealEstate: "Real Estate",
};

export type Investment = {
  id: number;
  name: string;
  type: string;
  invested: string;
  currentValue: string;
  annualReturn: string | null;
  symbol: string | null;
  schemeCode: string | null;
  units: string | null;
  startDate: string | null;
};

export type LiveInvestment = Investment & {
  liveCurrentValue: number;
  livePrice: number | null;
  liveChangePct: number | null;
  liveAsOf: string | null;
  liveCagr1Y: number | null;
  liveCagr3Y: number | null;
  liveCagr5Y: number | null;
  liveOk: boolean;
  liveError?: string;
};

function sumBy<T>(arr: T[], fn: (x: T) => number) {
  return arr.reduce((sum, item) => sum + fn(item), 0);
}

function instrumentKey(i: Investment) {
  if (i.type === "Stocks" && i.symbol) return `stock:${i.symbol}`;
  if (i.type === "MutualFunds" && i.schemeCode) return `mf:${i.schemeCode}`;
  if (i.symbol) return `stock:${i.symbol}`;
  if (i.schemeCode) return `mf:${i.schemeCode}`;
  return null;
}

function chartUrl(i: Investment) {
  if (i.symbol) return `https://finance.yahoo.com/quote/${encodeURIComponent(i.symbol)}/chart`;
  if (i.schemeCode) return `https://www.mfapi.in/mutual-funds/${encodeURIComponent(i.schemeCode)}`;
  return null;
}

function displayPct(value: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function useLiveInvestments(investments: Investment[]) {
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stocks = useMemo(
    () => [...new Set(investments.map((i) => i.symbol).filter(Boolean) as string[])],
    [investments]
  );
  const mfs = useMemo(
    () => [...new Set(investments.map((i) => i.schemeCode).filter(Boolean) as string[])],
    [investments]
  );

  const loadQuotes = useCallback(async () => {
    if (!stocks.length && !mfs.length) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (stocks.length) params.set("stocks", stocks.join(","));
    if (mfs.length) params.set("mf", mfs.join(","));
    try {
      const res = await fetch(`/api/market/quote?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load live prices");
      setQuotes(data.quotes || {});
      setUpdatedAt(new Date().toLocaleTimeString("en-IN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load live prices");
    } finally {
      setLoading(false);
    }
  }, [stocks, mfs]);

  useEffect(() => {
    const start = setTimeout(() => void loadQuotes(), 0);
    timerRef.current = setInterval(() => void loadQuotes(), 60000);
    return () => {
      clearTimeout(start);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadQuotes]);

  const liveInvestments = useMemo<LiveInvestment[]>(() => {
    return investments.map((i) => {
      const key = instrumentKey(i);
      const q = key ? quotes[key] : undefined;
      const units = num(i.units);
      const hasLiveValue = Boolean(q?.ok && q.price > 0 && units > 0);
      const liveCurrentValue = hasLiveValue ? q!.price * units : num(i.currentValue);
      return {
        ...i,
        liveCurrentValue,
        livePrice: q?.ok ? q.price : null,
        liveChangePct: q?.ok ? q.changePct : null,
        liveAsOf: q?.ok ? q.asOf : null,
        liveCagr1Y: q?.ok ? q.cagr.y1 : null,
        liveCagr3Y: q?.ok ? q.cagr.y3 : null,
        liveCagr5Y: q?.ok ? q.cagr.y5 : null,
        liveOk: Boolean(hasLiveValue),
        liveError: q?.error,
      };
    });
  }, [investments, quotes]);

  return { liveInvestments, loading, updatedAt, error, loadQuotes };
}

export function InvestmentKpis({ 
  liveInvestments, 
  loading, 
  updatedAt, 
  error, 
  loadQuotes 
}: { 
  liveInvestments: LiveInvestment[], 
  loading: boolean, 
  updatedAt: string, 
  error: string, 
  loadQuotes: () => Promise<void> 
}) {
  const invested = sumBy(liveInvestments, (i) => num(i.invested));
  const current = sumBy(liveInvestments, (i) => i.liveCurrentValue);
  const pnl = current - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  const cagrLinked = liveInvestments.filter((i) => i.liveCagr1Y !== null && i.liveCurrentValue > 0);
  const weightedReturn = cagrLinked.length && current > 0
    ? sumBy(cagrLinked, (i) => (i.liveCagr1Y ?? 0) * i.liveCurrentValue) / sumBy(cagrLinked, (i) => i.liveCurrentValue)
    : 0;
  const liveLinked = liveInvestments.filter((i) => i.liveOk).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: loading ? "var(--warning)" : "var(--success)" }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: loading ? "var(--warning)" : "var(--success)" }}
            />
          </span>
          {loading ? "Updating live portfolio..." : updatedAt ? `Auto-updated ${updatedAt}` : "Live sync ready"}
          <span>· Stocks refresh every 60s · MF NAV updates daily</span>
        </div>
        <button
          onClick={loadQuotes}
          disabled={loading}
          className="text-xs font-medium no-print px-3 py-1.5 rounded-lg"
          style={{ background: "var(--surface-3)", color: "var(--text)", opacity: loading ? 0.7 : 1 }}
        >
          🔄 Refresh now
        </button>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <KpiCard label="Live Portfolio" value={inr(current, { compact: true })} icon="📈" tone="primary" sub={`${liveLinked}/${liveInvestments.length} live-linked`} privacyMode="global" privacyKey="investments-total" />
        <KpiCard label="Total Invested" value={inr(invested, { compact: true })} icon="💼" tone="accent" privacyKey="investments-invested" />
        <KpiCard
          label="Live P&L"
          value={inr(pnl, { compact: true })}
          icon={pnl >= 0 ? "🟢" : "🔴"}
          tone={pnl >= 0 ? "success" : "danger"}
          trend={{ dir: pnl >= 0 ? "up" : "down", text: `${pnlPct.toFixed(1)}%`, good: pnl >= 0 }}
          privacyKey="investments-pnl"
        />
        <KpiCard label="Live 1Y CAGR" value={cagrLinked.length ? `${weightedReturn.toFixed(1)}%` : "—"} icon="🎯" tone="warning" sub="weighted from live quotes" privacyKey="investments-return" />
      </div>
    </div>
  );
}

export function InvestmentHoldings({ liveInvestments, onSell }: { liveInvestments: LiveInvestment[]; onSell?: (i: LiveInvestment) => void }) {
  const rows = [...liveInvestments].sort((a, b) => b.liveCurrentValue - a.liveCurrentValue);

  return (
    <Card
      title="Live Holdings"
      subtitle="Stocks/MFs update automatically from live market data when symbol/code + units are present"
      action={
        <Link
          href="/markets"
          className="text-xs font-semibold no-print px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
        >
          🛰️ Live Markets
        </Link>
      }
    >
      <Table headers={["Instrument", "Type", "Units", "Live Price", "Day", "Invested", "Live Current", "Live P&L", "1Y CAGR", "3Y", "5Y", "Chart"]} right={[2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}>
        {rows.map((i) => {
          const inv = num(i.invested);
          const cur = i.liveCurrentValue;
          const p = cur - inv;
          const pp = inv > 0 ? (p / inv) * 100 : 0;
          const chart = chartUrl(i);
          return (
            <Tr key={i.id}>
              <Td strong>
                {i.name}
                <span className="block text-[10px]" style={{ color: i.liveOk ? "var(--success)" : "var(--text-faint)" }}>
                  {i.liveOk ? `Live · ${i.liveAsOf || "now"}` : i.symbol || i.schemeCode ? "Waiting for quote / add units" : "Manual value"}
                </span>
              </Td>
              <Td><Badge>{TYPE_LABELS[i.type] || i.type}</Badge></Td>
              <Td right muted>{i.units || "—"}</Td>
              <Td right>{i.livePrice ? inr(i.livePrice) : "—"}</Td>
              <Td right>
                {i.liveChangePct === null ? (
                  <span style={{ color: "var(--text-faint)" }}>—</span>
                ) : (
                  <span style={{ color: i.liveChangePct >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {displayPct(i.liveChangePct)}
                  </span>
                )}
              </Td>
              <Td right muted>{inr(inv, { compact: true })}</Td>
              <Td right strong>{inr(cur, { compact: true })}</Td>
              <Td right>
                <span style={{ color: p >= 0 ? "var(--success)" : "var(--danger)" }}>
                  {p >= 0 ? "+" : "−"}{inr(Math.abs(p), { compact: true })} ({pp.toFixed(1)}%)
                </span>
              </Td>
              <Td right><span style={{ color: (i.liveCagr1Y ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }}>{displayPct(i.liveCagr1Y)}</span></Td>
              <Td right><span style={{ color: (i.liveCagr3Y ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }}>{displayPct(i.liveCagr3Y)}</span></Td>
              <Td right><span style={{ color: (i.liveCagr5Y ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }}>{displayPct(i.liveCagr5Y)}</span></Td>
              <Td right>
                <div className="flex gap-1 justify-end no-print">
                  {onSell && (i.type === "Stocks" || i.type === "MutualFunds") && Number(i.units) > 0 && (
                    <button onClick={() => onSell(i)} className="btn btn-ghost text-[11px] px-2 py-1" style={{ color: "var(--warning)" }}>📉 Sell</button>
                  )}
                  {chart ? (
                  <a
                    href={chart}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 rounded-lg no-print"
                    style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                  >
                    Chart
                  </a>
                ) : (
                  <span style={{ color: "var(--text-faint)" }}>—</span>
                )}
                </div>
              </Td>
            </Tr>
          );
        })}
      </Table>
    </Card>
  );
}

export function InvestmentAllocation({ liveInvestments }: { liveInvestments: LiveInvestment[] }) {
  const current = sumBy(liveInvestments, (i) => i.liveCurrentValue);
  const byType = new Map<string, number>();
  liveInvestments.forEach((i) => byType.set(i.type, (byType.get(i.type) || 0) + i.liveCurrentValue));
  const allocation = [...byType.entries()]
    .map(([t, v]) => ({ label: TYPE_LABELS[t] || t, value: v }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card title="Asset Allocation" subtitle="By live current value">
      <DonutChart data={allocation} centerLabel="Total" centerValue={inr(current, { compact: true })} />
    </Card>
  );
}

export function InvestmentFooter() {
  return (
    <Card className="!p-4">
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        🔗 <span className="font-semibold" style={{ color: "var(--text)" }}>Auto-sync rule:</span> For stocks and mutual funds, enter symbol/scheme code plus units. Current value is then calculated as live price/NAV × units on the Investments page. FD, PPF, real estate and other assets remain manual because they do not have live exchange prices.
      </p>
    </Card>
  );
}
