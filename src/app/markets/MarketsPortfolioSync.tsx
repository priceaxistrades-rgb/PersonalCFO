"use client";

import { useMemo } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart, BarChart } from "@/components/ui/Charts";
import { inr, num } from "@/lib/format";
import type { MarketQuote } from "@/lib/market";
import type { WatchItem } from "./LiveMarkets";
import {
  IconInvestments, IconMarkets, IconTrendingUp, IconTrendingDown,
  IconAlert, IconRefresh, IconCheck
} from "@/components/ui/Icons";

const TYPE_LABELS: Record<string, string> = {
  Stocks: "Equities", MutualFunds: "Mutual Funds", PPF: "PPF", EPF: "EPF",
  NPS: "NPS", FD: "Fixed Deposits", RD: "Recurring Deposits", Gold: "Gold & Metals",
  Silver: "Silver", Bonds: "Bonds & NCDs", Crypto: "Digital Assets", RealEstate: "Real Estate", Other: "Alternative Assets",
};

const TYPE_COLORS: Record<string, string> = {
  Equities: "#6366f1", "Mutual Funds": "#0ea5e9", PPF: "#10b981", EPF: "#f59e0b",
  NPS: "#8b5cf6", "Fixed Deposits": "#ec4899", "Recurring Deposits": "#14b8a6", "Gold & Metals": "#f97316",
  Silver: "#64748b", "Bonds & NCDs": "#84cc16", "Digital Assets": "#a855f7", "Real Estate": "#ef4444", "Alternative Assets": "#06b6d4",
};

const EST_YIELD: Record<string, number> = {
  FD: 7.0, RD: 6.8, PPF: 7.1, EPF: 8.5, NPS: 10.0,
  Gold: 9.0, Silver: 8.0, Bonds: 7.5, RealEstate: 5.0,
  Stocks: 0, MutualFunds: 0,
};

const TYPE_CATEGORY: Record<string, string> = {
  Stocks: "Market", MutualFunds: "Market", PPF: "Fixed Income", EPF: "Fixed Income",
  NPS: "Pension", FD: "Fixed Income", RD: "Fixed Income", Gold: "Commodity",
  Silver: "Commodity", Bonds: "Fixed Income", Crypto: "Digital", RealEstate: "Property", Other: "Other",
};

export function MarketsPortfolioSync({
  investments = [], quotes = {}, loading = false, updatedAt = "", error = "", loadQuotes = async () => {}, onSell,
}: {
  investments: WatchItem[]; quotes?: Record<string, MarketQuote>;
  loading?: boolean; updatedAt?: string; error?: string; loadQuotes?: () => Promise<void>;
  onSell?: (inv: WatchItem) => void;
}) {
  const stats = useMemo(() => {
    const totalInvested = investments.reduce((s, inv) => s + num(inv.invested), 0);
    const totalCurrent = investments.reduce((s, inv) => {
      const key = inv.kind === "stock" ? `stock:${inv.symbol}` : `mf:${inv.symbol}`;
      const q = quotes[key];
      const u = num(inv.units);
      return q?.ok && q.price > 0 && u > 0 ? q.price * u : num(inv.currentValue);
    }, 0);
    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    let dayChange = 0;
    investments.forEach((inv) => {
      const key = inv.kind === "stock" ? `stock:${inv.symbol}` : `mf:${inv.symbol}`;
      const q = quotes[key];
      const u = num(inv.units);
      const cv = q?.ok && q.price > 0 && u > 0 ? q.price * u : num(inv.currentValue);
      if (q?.ok && q.changePct !== null && cv > 0) {
        dayChange += cv * (q.changePct / 100) / (1 + q.changePct / 100);
      }
    });

    const byType = new Map<string, { invested: number; current: number; count: number }>();
    investments.forEach((inv) => {
      const t = TYPE_LABELS[inv.kind] || inv.kind;
      const prev = byType.get(t) || { invested: 0, current: 0, count: 0 };
      const key = inv.kind === "stock" ? `stock:${inv.symbol}` : `mf:${inv.symbol}`;
      const q = quotes[key];
      const u = num(inv.units);
      const cv = q?.ok && q.price > 0 && u > 0 ? q.price * u : num(inv.currentValue);
      byType.set(t, { invested: prev.invested + num(inv.invested), current: prev.current + cv, count: prev.count + 1 });
    });

    const byCategory = new Map<string, { invested: number; current: number }>();
    investments.forEach((inv) => {
      const cat = TYPE_CATEGORY[inv.kind] || "Other";
      const prev = byCategory.get(cat) || { invested: 0, current: 0 };
      const key = inv.kind === "stock" ? `stock:${inv.symbol}` : `mf:${inv.symbol}`;
      const q = quotes[key];
      const u = num(inv.units);
      const cv = q?.ok && q.price > 0 && u > 0 ? q.price * u : num(inv.currentValue);
      byCategory.set(cat, { invested: prev.invested + num(inv.invested), current: prev.current + cv });
    });

    return { totalInvested, totalCurrent, totalPnl, totalPnlPct, dayChange, byType, byCategory };
  }, [investments, quotes]);

  const typeAlloc = useMemo(() =>
    [...stats.byType.entries()].map(([label, v]) => ({ label, value: v.current, color: TYPE_COLORS[label] || TYPE_COLORS["Alternative Assets"] })).sort((a, b) => b.value - a.value),
    [stats.byType]
  );
  const catAlloc = useMemo(() =>
    [...stats.byCategory.entries()].map(([label, v]) => ({ label, value: v.current })).sort((a, b) => b.value - a.value),
    [stats.byCategory]
  );

  return (
    <div className="space-y-6 animate-fade-in w-full select-none">
      <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-2xl border border-white/[0.06] bg-surface-2 shadow-sm">
        <div className="flex items-center gap-3 text-xs text-white font-bold">
          <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 grid place-items-center shrink-0">
            <IconMarkets size={16} />
          </span>
          <div>
            <span className="block">{loading ? "Synchronizing real-time portfolio tickers…" : updatedAt ? `Portfolio Tickers Synced at ${updatedAt}` : "Live Market Feed Polling Active"}</span>
            <span className="block text-[11px] font-medium text-slate-400">All linked equity and mutual fund tickers updated with latest closing telemetry</span>
          </div>
        </div>
        <button onClick={loadQuotes} disabled={loading} className="btn btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50">
          <IconRefresh size={13} className={loading ? "animate-spin" : ""} /> <span>{loading ? "Polling…" : "Poll Tickers"}</span>
        </button>
      </div>

      {error && <div className="rounded-xl p-3.5 text-xs font-bold border border-red-500/40 bg-red-500/10 text-red-400 flex items-center gap-2"><IconAlert size={16} /> {error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Market Portfolio" value={inr(stats.totalCurrent, { compact: true })} icon={<IconMarkets size={18} />} tone="primary" />
        <KpiCard label="Total Invested" value={inr(stats.totalInvested, { compact: true })} icon={<IconInvestments size={18} />} tone="accent" />
        <KpiCard label="Total Unrealized P&L" value={inr(stats.totalPnl, { compact: true })} icon={stats.totalPnl >= 0 ? <IconTrendingUp size={18} /> : <IconTrendingDown size={18} />} tone={stats.totalPnl >= 0 ? "success" : "danger"} trend={{ dir: stats.totalPnl >= 0 ? "up" : "down", text: `${stats.totalPnlPct.toFixed(1)}%`, good: stats.totalPnl >= 0 }} />
        <KpiCard label="24h Valuation Change" value={inr(stats.dayChange, { compact: true })} icon={stats.dayChange >= 0 ? <IconTrendingUp size={18} /> : <IconTrendingDown size={18} />} tone={stats.dayChange >= 0 ? "success" : "danger"} />
      </div>

      <div className="bento-grid">
        <div className="bento-col-6 flex flex-col">
          <Card title="Market Allocation Split" subtitle="Portfolio valuation by asset class" className="flex-1 flex flex-col justify-center">
            {typeAlloc.length > 0 ? <DonutChart data={typeAlloc} centerLabel="Total" centerValue={inr(stats.totalCurrent, { compact: true })} /> : <div className="py-12 text-center text-slate-400 text-sm">No linked holdings</div>}
          </Card>
        </div>
        <div className="bento-col-6 flex flex-col">
          <Card title="Macro Asset Categories" subtitle="Grouped by market vs fixed income vs property" className="flex-1 flex flex-col justify-center">
            {catAlloc.length > 0 ? <DonutChart data={catAlloc} centerLabel="Categories" centerValue={inr(stats.totalCurrent, { compact: true })} /> : <div className="py-12 text-center text-slate-400 text-sm">No linked categories</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
