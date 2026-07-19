"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import { type MarketQuote, resolveLiveSymbol } from "@/lib/market";
import {
  IconInvestments, IconDashboard, IconTrendingUp, IconTrendingDown,
  IconMarkets, IconRefresh, IconArrowRight, IconSparkles, IconAlert
} from "@/components/ui/Icons";

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
  memberId?: number | null;
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
  if (i.type === "MutualFunds" && i.schemeCode) return `mf:${i.schemeCode}`;
  const resolved = resolveLiveSymbol(i.type, i.symbol);
  return resolved ? `${resolved.kind}:${resolved.yahooSymbol}` : null;
}

function chartUrl(i: Investment) {
  if (i.symbol) return `https://finance.yahoo.com/quote/${encodeURIComponent(i.symbol)}/chart`;
  if (i.schemeCode) return `https://www.mfapi.in/mutual-funds/${encodeURIComponent(i.schemeCode)}`;
  return null;
}

function displayPct(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function useLiveInvestments(investments: Investment[]) {
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const liveInstruments = useMemo(() => investments.map((investment) => resolveLiveSymbol(investment.type, investment.symbol)).filter(Boolean) as NonNullable<ReturnType<typeof resolveLiveSymbol>>[], [investments]);
  const mfs = useMemo(() => [...new Set(investments.filter((i) => i.type === "MutualFunds").map((i) => i.schemeCode).filter(Boolean) as string[])], [investments]);

  const loadQuotes = useCallback(async () => {
    if (!liveInstruments.length && !mfs.length) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    const byKind = (kind: string) => [...new Set(liveInstruments.filter((item) => item.kind === kind).map((item) => item.yahooSymbol))];
    const add = (key: string, kind: string) => { const values = byKind(kind); if (values.length) params.set(key, values.join(",")); };
    add("stocks", "stock"); add("commodities", "commodity"); add("crypto", "crypto"); add("indices", "index"); add("reits", "reit"); add("bonds", "bond");
    if (mfs.length) params.set("mf", mfs.join(","));
    try {
      const res = await fetch(`/api/market/quote?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to sync live investment values");
      setQuotes(data.quotes || {});
      setUpdatedAt(new Date().toLocaleTimeString("en-IN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sync live values");
    } finally {
      setLoading(false);
    }
  }, [liveInstruments, mfs]);

  useEffect(() => {
    const start = setTimeout(() => void loadQuotes(), 0);
    timerRef.current = setInterval(() => void loadQuotes(), 60_000);
    return () => {
      clearTimeout(start);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadQuotes]);

  const liveInvestments = useMemo<LiveInvestment[]>(() => {
    return investments.map((i) => {
      const key = instrumentKey(i);
      const quote = key ? quotes[key] : undefined;
      const units = num(i.units);
      const manualCur = num(i.currentValue);
      const livePrice = quote?.ok ? quote.price : null;
      const liveCurrentValue = quote?.ok && quote.price > 0 && units > 0
        ? quote.price * units
        : manualCur;

      return {
        ...i,
        liveCurrentValue,
        livePrice,
        liveChangePct: quote?.ok ? (quote.changePct ?? null) : null,
        liveAsOf: quote?.ok ? quote.asOf : null,
        liveCagr1Y: quote?.ok ? (quote.cagr?.y1 ?? null) : null,
        liveCagr3Y: quote?.ok ? (quote.cagr?.y3 ?? null) : null,
        liveCagr5Y: quote?.ok ? (quote.cagr?.y5 ?? null) : null,
        liveOk: Boolean(quote?.ok && quote.price > 0 && units > 0),
        liveError: quote?.error,
      };
    });
  }, [investments, quotes]);

  return { liveInvestments, loading, updatedAt, error, loadQuotes, quotes };
}

export function LiveInvestmentsDashboard({
  investments,
  quotes,
  loading,
  updatedAt,
  error,
  loadQuotes,
  onSell,
}: {
  investments: Investment[];
  quotes: Record<string, MarketQuote>;
  loading: boolean;
  updatedAt: string;
  error: string;
  loadQuotes: () => Promise<void>;
  onSell?: (i: LiveInvestment) => void;
}) {
  const liveInvestments = useMemo<LiveInvestment[]>(() => {
    return investments.map((i) => {
      const key = instrumentKey(i);
      const quote = key ? quotes[key] : undefined;
      const units = num(i.units);
      const manualCur = num(i.currentValue);
      const livePrice = quote?.ok ? quote.price : null;
      const liveCurrentValue = quote?.ok && quote.price > 0 && units > 0
        ? quote.price * units
        : manualCur;

      return {
        ...i,
        liveCurrentValue,
        livePrice,
        liveChangePct: quote?.ok ? (quote.changePct ?? null) : null,
        liveAsOf: quote?.ok ? quote.asOf : null,
        liveCagr1Y: quote?.ok ? (quote.cagr?.y1 ?? null) : null,
        liveCagr3Y: quote?.ok ? (quote.cagr?.y3 ?? null) : null,
        liveCagr5Y: quote?.ok ? (quote.cagr?.y5 ?? null) : null,
        liveOk: Boolean(quote?.ok && quote.price > 0 && units > 0),
        liveError: quote?.error,
      };
    });
  }, [investments, quotes]);

  const invested = sumBy(liveInvestments, (i) => num(i.invested));
  const current = sumBy(liveInvestments, (i) => i.liveCurrentValue);
  const pnl = current - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  const liveLinked = liveInvestments.filter((i) => i.liveOk).length;

  const cagrLinked = liveInvestments.filter((i) => i.liveCagr1Y !== null && i.liveCurrentValue > 0);
  const weightedReturn = cagrLinked.length && current > 0
    ? cagrLinked.reduce((s, i) => s + (i.liveCagr1Y ?? 0) * i.liveCurrentValue, 0) / cagrLinked.reduce((s, i) => s + i.liveCurrentValue, 0)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in w-full select-none">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
            <IconInvestments size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Portfolio Assets & Holdings</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Portfolio v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Equities, mutual funds, real estate holdings, and capital allocations with live market price synchronization</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center", { detail: { type: "investment" } }))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Investment Asset</span>
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
            <span className="block">{loading ? "Synchronizing real-time Indian quotes…" : updatedAt ? `Synced at ${updatedAt} · ${liveLinked} of ${liveInvestments.length} holdings live-linked` : "Live Ticker Feed Ready"}</span>
            <span className="block text-[11px] font-medium text-slate-400">Automatic polling of NSE stocks & MF NAV daily closing figures</span>
          </div>
        </div>
        <button onClick={loadQuotes} disabled={loading} className="btn btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50">
          <IconRefresh size={13} className={loading ? "animate-spin" : ""} /> <span>{loading ? "Polling NSE…" : "Poll Live Tickers"}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl p-3.5 text-xs font-bold border border-red-500/40 bg-red-500/10 text-red-400 flex items-center gap-2">
          <IconAlert size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Live Portfolio" value={inr(current, { compact: true })} icon={<IconInvestments size={18} />} tone="primary" sub={`${liveLinked}/${liveInvestments.length} live-linked`} privacyMode="global" privacyKey="investments-total" />
        <KpiCard label="Total Capital Invested" value={inr(invested, { compact: true })} icon={<IconDashboard size={18} />} tone="accent" privacyKey="investments-invested" />
        <KpiCard
          label="Unrealized P&L"
          value={inr(pnl, { compact: true })}
          icon={pnl >= 0 ? <IconTrendingUp size={18} /> : <IconTrendingDown size={18} />}
          tone={pnl >= 0 ? "success" : "danger"}
          trend={{ dir: pnl >= 0 ? "up" : "down", text: `${pnlPct.toFixed(1)}%`, good: pnl >= 0 }}
          privacyKey="investments-pnl"
        />
        <KpiCard label="Weighted 1Y CAGR" value={cagrLinked.length ? `${weightedReturn.toFixed(1)}%` : "—"} icon={<IconMarkets size={18} />} tone="warning" sub="weighted from live quotes" privacyKey="investments-return" />
      </div>

      <div className="bento-grid">
        <div className="bento-col-8 flex flex-col">
          <InvestmentHoldings liveInvestments={liveInvestments} onSell={onSell} />
        </div>
        <div className="bento-col-4 flex flex-col">
          <InvestmentAllocation liveInvestments={liveInvestments} />
        </div>
      </div>

      <InvestmentFooter />
    </div>
  );
}

export function InvestmentHoldings({ liveInvestments, onSell }: { liveInvestments: LiveInvestment[]; onSell?: (i: LiveInvestment) => void }) {
  const activeRows = liveInvestments.filter(i => {
    const inv = num(i.invested);
    const cv = i.liveCurrentValue;
    const u = num(i.units);
    return inv > 0 || cv > 0 || u > 0;
  });
  const rows = [...activeRows].sort((a, b) => b.liveCurrentValue - a.liveCurrentValue);

  return (
    <Card
      title="Live Holdings Archive"
      subtitle="Equities & mutual funds synchronize dynamically via NSE tickers and AMFI scheme codes"
      className="flex-1 flex flex-col justify-between"
      action={
        <Link
          href="/markets"
          className="btn btn-ghost text-xs px-3 py-1.5 font-bold flex items-center gap-1 border"
          style={{ borderColor: "var(--border)" }}
        >
          <span>Market Tickers</span> <IconArrowRight size={13} />
        </Link>
      }
    >
      <div className="pt-2">
        {rows.length ? (
          <Table headers={["Instrument", "Type", "Units", "Live Price", "Day %", "Invested", "Live Current", "P&L / Yield", "1Y CAGR", "Actions"]} right={[2, 3, 4, 5, 6, 7, 8]}>
            {rows.map((i) => {
              const inv = num(i.invested);
              const cur = i.liveCurrentValue;
              const p = cur - inv;
              const pp = inv > 0 ? (p / inv) * 100 : 0;
              const chart = chartUrl(i);
              return (
                <Tr key={i.id}>
                  <Td strong>
                    <span className="block font-bold" style={{ color: "var(--text-heading)" }}>{i.name}</span>
                    <span className="block text-[10px] font-mono mt-0.5" style={{ color: i.liveOk ? "var(--success)" : "var(--text-faint)" }}>
                      {i.liveOk ? `Live · ${i.liveAsOf || "now"}` : i.symbol || i.schemeCode ? "Polling quote…" : "Manual valuation"}
                    </span>
                  </Td>
                  <Td><Badge tone="primary">{TYPE_LABELS[i.type] || i.type}</Badge></Td>
                  <Td right muted className="font-mono">{i.units || "—"}</Td>
                  <Td right className="font-mono font-bold text-slate-200">{i.livePrice ? inr(i.livePrice) : "—"}</Td>
                  <Td right className="font-mono font-bold">
                    {i.liveChangePct === null ? (
                      <span style={{ color: "var(--text-faint)" }}>—</span>
                    ) : (
                      <span style={{ color: i.liveChangePct >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {displayPct(i.liveChangePct)}
                      </span>
                    )}
                  </Td>
                  <Td right muted className="font-mono">{inv > 0 ? inr(inv, { compact: true }) : "—"}</Td>
                  <Td right strong className="font-mono font-extrabold">{inr(cur, { compact: true })}</Td>
                  <Td right className="font-mono font-bold">
                    {inv > 0 ? (
                      <span style={{ color: p >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {p >= 0 ? "+" : "−"}{inr(Math.abs(p), { compact: true })} ({pp.toFixed(1)}%)
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-faint)" }}>Set buy price</span>
                    )}
                  </Td>
                  <Td right className="font-mono font-bold"><span style={{ color: (i.liveCagr1Y ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }}>{displayPct(i.liveCagr1Y)}</span></Td>
                  <Td right>
                    <div className="flex gap-1.5 justify-end no-print">
                      {onSell && (Number(i.units || 0) > 0 || Number(i.invested || 0) > 0 || Number(i.currentValue || 0) > 0) && (
                        <button onClick={() => onSell(i)} className="btn btn-secondary text-[11px] px-2.5 py-1 font-bold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10">Redeem</button>
                      )}
                      {chart ? (
                        <a
                          href={chart}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost text-[11px] px-2.5 py-1 font-bold border"
                          style={{ borderColor: "var(--border)" }}
                        >
                          Chart ↗
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
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm font-medium">Zero portfolio holdings recorded</div>
        )}
      </div>
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
    <Card title="Asset Allocation Split" subtitle="Distribution by live current valuation" className="flex-1 flex flex-col justify-center">
      {allocation.length ? (
        <DonutChart data={allocation} centerLabel="Total Value" centerValue={inr(current, { compact: true })} />
      ) : (
        <div className="py-12 text-center text-slate-400 text-sm font-medium">No asset holdings logged</div>
      )}
    </Card>
  );
}

export function InvestmentFooter() {
  return (
    <Card className="!p-4 border-indigo-500/30 bg-surface-2/60">
      <div className="flex items-start gap-3.5">
        <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 grid place-items-center shrink-0 mt-0.5">
          <IconSparkles size={16} />
        </span>
        <div className="space-y-1 text-xs">
          <p className="font-extrabold" style={{ color: "var(--text-heading)" }}>Sovereign Synchronization Engine Protocol</p>
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-emerald-400 font-mono font-bold">Equities & Mutual Funds:</strong> Inputting a valid NSE stock ticker (`RELIANCE.NS`) or AMFI mutual fund scheme code + units + average buy price enables dynamic valuation updates (`NAV × units`) polled every 60 seconds.
          </p>
          <p className="text-slate-400 leading-relaxed">
            <strong className="text-indigo-400 font-mono font-bold">Fixed Income & Real Estate:</strong> Fixed Deposits (`FD`), PPF, EPF, and physical real estate do not have live exchange order books. Input invested and current valuations manually.
          </p>
        </div>
      </div>
    </Card>
  );
}
