"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { LineChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import type { MarketQuote } from "@/lib/market";
import {
  IconNetWorth, IconInvestments, IconRefresh, IconSavings,
  IconMarkets, IconDebt, IconArrowRight
} from "@/components/ui/Icons";

type Account = { id: number; name: string; type: string; balance: string; memberId: number | null };
type Investment = { id: number; name: string; type: string; invested: string; currentValue: string; symbol: string | null; schemeCode: string | null; units: string | null; memberId: number | null };
type Debt = { id: number; name: string; type: string; outstanding: string };
type Snapshot = { id: number; snapshotDate: string; assets: string; liabilities: string };

type LiveInvestment = Investment & {
  liveCurrentValue: number;
  liveOk: boolean;
  livePrice: number | null;
  liveAsOf: string | null;
};

function sumBy<T>(arr: T[], fn: (x: T) => number) {
  return arr.reduce((sum, item) => sum + fn(item), 0);
}

function keyForInvestment(i: Investment) {
  if (i.symbol) return `stock:${i.symbol}`;
  if (i.schemeCode) return `mf:${i.schemeCode}`;
  return null;
}

export function LiveNetWorthTracker({ 
  accounts, 
  investments, 
  debts, 
  snapshots,
  currentFlow 
}: { 
  accounts: Account[]; 
  investments: Investment[]; 
  debts: Debt[]; 
  snapshots: Snapshot[];
  currentFlow: { income: number; expense: number; savings: number };
}) {
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncBalances = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/manage/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      window.location.reload();
    } catch (err) {
      alert("Failed to sync balances. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const stocks = useMemo(() => [...new Set(investments.map((i) => i.symbol).filter(Boolean) as string[])], [investments]);
  const mfs = useMemo(() => [...new Set(investments.map((i) => i.schemeCode).filter(Boolean) as string[])], [investments]);

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
      if (!res.ok) throw new Error(data.error || "Unable to sync live investment values");
      setQuotes(data.quotes || {});
      setUpdatedAt(new Date().toLocaleTimeString("en-IN"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sync live values");
    } finally {
      setLoading(false);
    }
  }, [stocks, mfs]);

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
      const key = keyForInvestment(i);
      const quote = key ? quotes[key] : undefined;
      const units = num(i.units);
      const liveOk = Boolean(quote?.ok && quote.price > 0 && units > 0);
      return {
        ...i,
        liveCurrentValue: liveOk ? quote!.price * units : num(i.currentValue),
        liveOk,
        livePrice: quote?.ok ? quote.price : null,
        liveAsOf: quote?.ok ? quote.asOf : null,
      };
    });
  }, [investments, quotes]);

  const liquidAssets = sumBy(accounts, (a) => num(a.balance));
  const investmentValue = sumBy(liveInvestments, (i) => i.liveCurrentValue);
  const totalAssets = liquidAssets + investmentValue;
  const liabilities = sumBy(debts, (d) => num(d.outstanding));
  const netWorth = totalAssets - liabilities;
  const liveSynced = liveInvestments.filter((i) => i.liveOk).length;

  const labels = snapshots.map((s) => new Date(s.snapshotDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }));
  const netSeries = snapshots.map((s) => num(s.assets) - num(s.liabilities));
  const assetSeries = snapshots.map((s) => num(s.assets));
  const liabSeries = snapshots.map((s) => num(s.liabilities));
  const currentLabel = "Now";
  const chartLabels = [...labels, currentLabel];
  const chartNet = [...netSeries, netWorth];
  const chartAssets = [...assetSeries, totalAssets];
  const chartLiab = [...liabSeries, liabilities];
  const first = chartNet[0] ?? netWorth;
  const prev = chartNet[chartNet.length - 2] ?? netWorth;
  const growth = netWorth - first;
  const growthPct = first > 0 ? (growth / first) * 100 : 0;
  const monthlyGrowth = netWorth - prev;

  const assetRows = [
    ...accounts.map((a) => ({ name: a.name, type: a.type, value: num(a.balance), status: "Manual Bank/Cash" })),
    ...liveInvestments.map((i) => ({ name: i.name, type: i.type, value: i.liveCurrentValue, status: i.liveOk ? `Live Linked · ${i.liveAsOf || "now"}` : "Manual Valuation" })),
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 shrink-0">
            <IconNetWorth size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Sovereign Net Worth Deck</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20">Valuation v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Real-time consolidated asset vs liability accumulation, live NAV polling & equity valuation metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Asset / Liability</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      {/* Sync Banner */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-2xl border bg-surface-2 no-print shadow-sm" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl grid place-items-center text-sm shadow-sm bg-indigo-500/20 text-indigo-400">
            <IconMarkets size={16} />
          </span>
          <div>
            <p className="text-xs font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>
              {loading ? "Synchronizing real-time Indian NSE/MF quotes..." : updatedAt ? `Real-Time Market Prices Synced at ${updatedAt}` : "Live Net Worth Feed Active"}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              {liveSynced} of {liveInvestments.length} portfolio assets linked with active ticker feeds
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={syncBalances} 
            disabled={syncing}
            className="btn btn-secondary px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <IconRefresh size={13} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing DB..." : "Recompute Balances"}
          </button>
          <button onClick={loadQuotes} disabled={loading} className="btn btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5">
            <IconRefresh size={13} className={loading ? "animate-spin" : ""} /> {loading ? "Polling NSE..." : "Poll Live Market"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl p-3.5 text-xs font-bold border border-red-500/40 bg-red-500/10 text-red-400">{error}</div>}

      {/* Hero Bento Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Live Total Net Worth" value={inr(netWorth, { compact: true })} icon={<IconNetWorth size={18} />} tone="primary" sub={`Assets: ${inr(totalAssets, { compact: true })}`} privacyMode="global" privacyKey="networth-total" />
        <KpiCard label="Total Gross Assets" value={inr(totalAssets, { compact: true })} icon={<IconInvestments size={18} />} tone="success" sub="Liquid + Investments" privacyKey="networth-assets" />
        <KpiCard label="Total Liabilities" value={inr(liabilities, { compact: true })} icon={<IconDebt size={18} />} tone="danger" sub="Active loan balances" privacyKey="networth-liabilities" />
        <KpiCard label="Historical Net Growth" value={inr(growth, { compact: true })} icon={<IconSavings size={18} />} tone="accent" trend={{ dir: growth >= 0 ? "up" : "down", text: `${growthPct.toFixed(0)}%`, good: growth >= 0 }} sub="since first snapshot" privacyKey="networth-growth" />
      </div>

      {/* Bento Tier: Dynamics & Drivers */}
      <div className="bento-grid">
        <div className="bento-col-4 flex flex-col">
          <Card title="Net Worth Balance Sheet" subtitle="Asset vs Liability status" className="flex-1 flex flex-col justify-between">
            <div className="space-y-4 py-2 my-auto">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-400">Total Capital Assets</span>
                <span className="font-mono font-extrabold text-emerald-400 text-base">+{inr(totalAssets, { compact: true })}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-400">Total Debt Liabilities</span>
                <span className="font-mono font-extrabold text-red-400 text-base">−{inr(liabilities, { compact: true })}</span>
              </div>
              <div className="h-px bg-white/[0.08] my-3" />
              <div className="flex justify-between items-center font-extrabold text-lg">
                <span className="text-white">True Net Worth</span>
                <span className="font-mono text-indigo-400">{inr(netWorth, { compact: true })}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="bento-col-4 flex flex-col">
          <Card title="Monthly Cash Flow Engine" subtitle="Current inflow vs outflow" className="flex-1 flex flex-col justify-between">
            <div className="space-y-4 py-2 my-auto">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-400">Current Month Income</span>
                <span className="font-mono font-extrabold text-emerald-400 text-base">+{inr(currentFlow.income, { compact: true })}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-400">Current Month Outflow</span>
                <span className="font-mono font-extrabold text-red-400 text-base">−{inr(currentFlow.expense, { compact: true })}</span>
              </div>
              <div className="h-px bg-white/[0.08] my-3" />
              <div className="flex justify-between items-center font-extrabold text-lg">
                <span className="text-white">Net Capital Addition</span>
                <span className={`font-mono ${currentFlow.savings >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {inr(currentFlow.savings, { compact: true })}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="bento-col-4 flex flex-col">
          <Card title="Net Worth Accumulator" subtitle="Monthly wealth velocity" className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col items-center justify-center py-5 my-auto text-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Capital Added This Month</span>
              <span className={`text-3xl font-black font-mono tabular-nums ${currentFlow.savings >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {currentFlow.savings >= 0 ? "+" : ""}{inr(currentFlow.savings, { compact: true })}
              </span>
              <p className="text-[11px] font-medium text-slate-400 mt-3 px-3 leading-relaxed">
                This exact net cash accumulation directly expands your liquid reserves and accelerates investment compounding.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Chart Card */}
      <Card title="Real-Time Net Worth Trajectory" subtitle={`Latest valuation movement: ${inr(monthlyGrowth, { compact: true })} · current live stock & mutual fund valuations appended dynamically`}>
        <div className="pt-3">
          <LineChart
            labels={chartLabels}
            series={[
              { name: "Net Worth", values: chartNet, color: "#6366f1" },
              { name: "Total Assets", values: chartAssets, color: "#10b981" },
              { name: "Total Liabilities", values: chartLiab, color: "#ef4444" },
            ]}
            height={300}
          />
        </div>
      </Card>

      {/* Asset & Liability breakdown tables */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Asset Breakdown" subtitle={`${inr(totalAssets, { compact: true })} gross valuation`} action={<Link href="/investments" className="btn btn-ghost text-xs px-3 py-1 font-bold flex items-center gap-1">Manage Assets <IconArrowRight size={13} /></Link>}>
          <Table headers={["Asset Name", "Category", "Current Value", "Data Source"]} right={[2]}>
            {assetRows.map((a, i) => (
              <Tr key={`${a.name}-${i}`}>
                <Td strong>{a.name}</Td>
                <Td><Badge tone="success">{a.type}</Badge></Td>
                <Td right strong className="font-mono text-emerald-400">{inr(a.value, { compact: true })}</Td>
                <Td muted className="text-xs font-medium">{a.status}</Td>
              </Tr>
            ))}
          </Table>
        </Card>

        <Card title="Liabilities Breakdown" subtitle={`${inr(liabilities, { compact: true })} outstanding balance`} action={<Link href="/debt" className="btn btn-ghost text-xs px-3 py-1 font-bold flex items-center gap-1">Manage Loans <IconArrowRight size={13} /></Link>}>
          <Table headers={["Liability Name", "Loan Type", "Outstanding Balance"]} right={[2]}>
            {debts.map((l) => (
              <Tr key={l.id}>
                <Td strong>{l.name}</Td>
                <Td><Badge tone="danger">{l.type}</Badge></Td>
                <Td right strong className="font-mono text-red-400">{inr(num(l.outstanding), { compact: true })}</Td>
              </Tr>
            ))}
            {!debts.length && (
              <Tr><Td muted className="py-8 text-center" strong>No debt or loan liabilities recorded!</Td><Td muted>—</Td><Td right muted>—</Td></Tr>
            )}
          </Table>
          <div className="mt-4 pt-4 border-t border-white/[0.08]">
            <div className="flex justify-between items-center text-base font-extrabold">
              <span className="text-white">Calculated True Net Worth</span>
              <span className="font-mono text-indigo-400 text-lg">{inr(netWorth, { compact: true })}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
