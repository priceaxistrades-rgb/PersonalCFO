"use client";

import { useMemo } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart, BarChart } from "@/components/ui/Charts";
import { inr, num } from "@/lib/format";
import type { MarketQuote } from "@/lib/market";
import {
  IconInvestments, IconMarkets, IconTrendingUp, IconTrendingDown,
  IconAlert, IconCheck, IconRefresh, IconArrowRight, IconDashboard
} from "@/components/ui/Icons";

type Holding = {
  id: number; name: string; type: string; invested: string; currentValue: string;
  symbol: string | null; schemeCode: string | null; units: string | null;
  startDate: string | null; memberId?: number | null;
  liveCurrentValue: number; liveOk: boolean; livePrice: number | null;
  liveAsOf: string | null; liveChangePct: number | null;
  liveCagr1Y: number | null; liveCagr3Y: number | null; liveCagr5Y: number | null;
};

const TYPE_LABELS: Record<string, string> = {
  Stocks: "Stocks & Equities", MutualFunds: "Mutual Funds", PPF: "PPF (Public Provident Fund)",
  EPF: "EPF (Employees' PF)", NPS: "NPS (National Pension)", FD: "Fixed Deposits (bank)",
  RD: "Recurring Deposits", Gold: "Gold & SGBs", Silver: "Silver & Metals",
  Bonds: "Bonds & NCDs", Crypto: "Digital Assets", RealEstate: "Real Estate", Other: "Alternative Assets",
};

const TYPE_COLORS: Record<string, string> = {
  "Stocks & Equities": "#6366f1", "Mutual Funds": "#0ea5e9", "PPF (Public Provident Fund)": "#10b981",
  "EPF (Employees' PF)": "#f59e0b", "NPS (National Pension)": "#8b5cf6", "Fixed Deposits (bank)": "#ec4899",
  "Recurring Deposits": "#14b8a6", "Gold & SGBs": "#f97316", "Silver & Metals": "#64748b",
  "Bonds & NCDs": "#84cc16", "Digital Assets": "#a855f7", "Real Estate": "#ef4444", "Alternative Assets": "#06b6d4",
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

function pctStr(v: number | null) {
  if (v === null || Number.isNaN(v)) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export function PortfolioSyncDashboard({
  holdings, quotes, loading, updatedAt, error, loadQuotes, onSell,
}: {
  holdings: Holding[]; quotes: Record<string, MarketQuote>;
  loading: boolean; updatedAt: string; error: string; loadQuotes: () => Promise<void>;
  onSell?: (holding: Holding) => void;
}) {
  const stats = useMemo(() => {
    const totalInvested = holdings.reduce((s, h) => s + num(h.invested), 0);
    const totalCurrent = holdings.reduce((s, h) => s + h.liveCurrentValue, 0);
    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    let dayChange = 0;
    holdings.forEach(h => {
      if (h.liveChangePct !== null && h.liveCurrentValue > 0) {
        dayChange += h.liveCurrentValue * (h.liveChangePct / 100) / (1 + h.liveChangePct / 100);
      }
    });

    const byType = new Map<string, { invested: number; current: number; count: number }>();
    holdings.forEach(h => {
      const t = TYPE_LABELS[h.type] || h.type;
      const prev = byType.get(t) || { invested: 0, current: 0, count: 0 };
      byType.set(t, { invested: prev.invested + num(h.invested), current: prev.current + h.liveCurrentValue, count: prev.count + 1 });
    });

    const byCategory = new Map<string, { invested: number; current: number }>();
    holdings.forEach(h => {
      const cat = TYPE_CATEGORY[h.type] || "Other";
      const prev = byCategory.get(cat) || { invested: 0, current: 0 };
      byCategory.set(cat, { invested: prev.invested + num(h.invested), current: prev.current + h.liveCurrentValue });
    });

    let estAnnualIncome = 0;
    holdings.forEach(h => {
      const yieldPct = EST_YIELD[h.type] || 0;
      if (yieldPct > 0) {
        estAnnualIncome += h.liveCurrentValue * yieldPct / 100;
      } else if (h.liveOk && h.type === "Stocks") {
        estAnnualIncome += h.liveCurrentValue * 1.5 / 100;
      } else if (h.liveOk && h.type === "MutualFunds") {
        estAnnualIncome += h.liveCurrentValue * 1.0 / 100;
      }
    });

    const withPnl = holdings.map(h => {
      const inv = num(h.invested); const cur = h.liveCurrentValue;
      const pnl = cur - inv; const pnlPct = inv > 0 ? (pnl / inv) * 100 : 0;
      return { ...h, pnl, pnlPct, investedNum: inv };
    }).filter(h => h.investedNum > 0);

    const topGainers = [...withPnl].sort((a, b) => b.pnlPct - a.pnlPct).slice(0, 5);
    const topLosers = [...withPnl].sort((a, b) => a.pnlPct - b.pnlPct).slice(0, 5);

    const liveCount = holdings.filter(h => h.liveOk).length;

    const cagrLinked = holdings.filter(h => h.liveCagr1Y !== null && h.liveCurrentValue > 0);
    const weightedCagr = cagrLinked.length && totalCurrent > 0
      ? cagrLinked.reduce((s, h) => s + (h.liveCagr1Y ?? 0) * h.liveCurrentValue, 0) / cagrLinked.reduce((s, h) => s + h.liveCurrentValue, 0)
      : null;

    const totalReturnPct = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;

    let healthScore = 50;
    const divTypes = byType.size;
    if (divTypes >= 5) healthScore += 20; else if (divTypes >= 3) healthScore += 10;
    if (totalPnlPct >= 10) healthScore += 15; else if (totalPnlPct >= 0) healthScore += 5;
    if (liveCount >= holdings.length * 0.5) healthScore += 10;
    const maxTPct = totalCurrent > 0 ? Math.max(...[...byType.values()].map(v => v.current)) / totalCurrent : 0;
    if (maxTPct < 0.4) healthScore += 5;
    healthScore = Math.min(100, healthScore);

    return { totalInvested, totalCurrent, totalPnl, totalPnlPct, dayChange, byType, byCategory, topGainers, topLosers, liveCount, weightedCagr, estAnnualIncome, totalReturnPct, healthScore };
  }, [holdings, quotes]);

  const typeAlloc = useMemo(() =>
    [...stats.byType.entries()].map(([label, v]) => ({ label, value: v.current, color: TYPE_COLORS[label] || TYPE_COLORS["Alternative Assets"] })).sort((a, b) => b.value - a.value),
    [stats.byType]
  );
  const catAlloc = useMemo(() =>
    [...stats.byCategory.entries()].map(([label, v]) => ({ label, value: v.current })).sort((a, b) => b.value - a.value),
    [stats.byCategory]
  );
  const pnlByType = useMemo(() =>
    [...stats.byType.entries()].map(([label, v]) => {
      const p = v.invested > 0 ? ((v.current - v.invested) / v.invested) * 100 : 0;
      return { label: label.split(" ")[0], value: p, color: p >= 0 ? TYPE_COLORS[label] || "#10b981" : "#ef4444" };
    }).sort((a, b) => b.value - a.value),
    [stats.byType]
  );

  const healthTone = stats.healthScore >= 80 ? "success" : stats.healthScore >= 60 ? "primary" : stats.healthScore >= 40 ? "warning" : "danger";

  return (
    <div className="space-y-6 animate-fade-in w-full select-none">
      {/* SYNC STATUS BAR */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-2xl border bg-surface-2 shadow-sm" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 text-xs font-bold" style={{ color: "var(--text-heading)" }}>
          <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 grid place-items-center shrink-0">
            <IconMarkets size={16} />
          </span>
          <div>
            <span className="block">{loading ? "Synchronizing real-time Indian quotes…" : updatedAt ? `Synced at ${updatedAt} · ${stats.liveCount} of ${holdings.length} holdings live-linked` : "Live Ticker Feed Ready"}</span>
            <span className="block text-[11px] font-medium text-slate-400">Automatic polling of NSE stocks & MF NAV daily closing figures</span>
          </div>
        </div>
        <button onClick={loadQuotes} disabled={loading} className="btn btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50">
          <IconRefresh size={13} className={loading ? "animate-spin" : ""} /> <span>{loading ? "Polling NSE…" : "Poll Live Tickers"}</span>
        </button>
      </div>

      {error && <div className="rounded-xl p-3.5 text-xs font-bold border border-red-500/40 bg-red-500/10 text-red-400 flex items-center gap-2"><IconAlert size={16} /> {error}</div>}

      {/* HERO KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard label="Portfolio Value" value={inr(stats.totalCurrent, { compact: true })} icon={<IconInvestments size={18} />} tone="primary" sub={`${stats.liveCount} live linked`} />
        <KpiCard label="Total Capital Invested" value={inr(stats.totalInvested, { compact: true })} icon={<IconDashboard size={18} />} tone="accent" />
        <KpiCard label="Total Unrealized P&L" value={inr(stats.totalPnl, { compact: true })} icon={stats.totalPnl >= 0 ? <IconTrendingUp size={18} /> : <IconTrendingDown size={18} />} tone={stats.totalPnl >= 0 ? "success" : "danger"} trend={{ dir: stats.totalPnl >= 0 ? "up" : "down", text: `${stats.totalPnlPct.toFixed(1)}%`, good: stats.totalPnl >= 0 }} />
        <KpiCard label="24h Valuation Change" value={inr(stats.dayChange, { compact: true })} icon={stats.dayChange >= 0 ? <IconTrendingUp size={18} /> : <IconTrendingDown size={18} />} tone={stats.dayChange >= 0 ? "success" : "danger"} />
        <KpiCard label="Weighted 1Y CAGR" value={stats.weightedCagr !== null ? `${stats.weightedCagr.toFixed(1)}%` : "—"} icon={<IconMarkets size={18} />} tone="warning" sub="annualized yield" />
      </div>

      {/* SECONDARY KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Monitored Holdings" value={`${holdings.length}`} icon={<IconInvestments size={18} />} tone="primary" sub={`${[...stats.byType.keys()].length} asset classes`} />
        <KpiCard label="Est. Annual Yield" value={inr(stats.estAnnualIncome, { compact: true })} icon={<IconTrendingUp size={18} />} tone="success" sub="Dividends + Interest" />
        <KpiCard label="Portfolio Health Index" value={`${stats.healthScore}/100`} icon={<IconCheck size={18} />} tone={healthTone} sub="Diversification score" />
        <KpiCard label="All-Time Yield %" value={`${stats.totalReturnPct.toFixed(1)}%`} icon={stats.totalReturnPct >= 0 ? <IconTrendingUp size={18} /> : <IconTrendingDown size={18} />} tone={stats.totalReturnPct >= 0 ? "success" : "danger"} sub="total portfolio return" />
      </div>

      {/* CHARTS ROW */}
      <div className="bento-grid">
        <div className="bento-col-6 flex flex-col">
          <Card title="Asset Allocation Split" subtitle="Distribution by live current valuation" className="flex-1 flex flex-col justify-center">
            {typeAlloc.length > 0 ? <DonutChart data={typeAlloc} centerLabel="Portfolio" centerValue={inr(stats.totalCurrent, { compact: true })} /> : <div className="py-12 text-center text-slate-400 text-sm">No asset holdings logged</div>}
          </Card>
        </div>
        <div className="bento-col-6 flex flex-col">
          <Card title="Return by Asset Class" subtitle="Unrealized percentage yield across categories" className="flex-1 flex flex-col justify-center">
            {pnlByType.length > 0 ? <BarChart data={pnlByType} format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`} /> : <div className="py-12 text-center text-slate-400 text-sm">No P&L data available</div>}
          </Card>
        </div>
      </div>

      {/* CATEGORY BREAKDOWN */}
      {catAlloc.length > 1 && (
        <Card title="Macro Asset Class Allocation" subtitle="Grouped by market, fixed income, commodity & digital reserves">
          <div className="space-y-4 pt-1">
            {catAlloc.map((c, i) => {
              const pct = stats.totalCurrent > 0 ? (c.value / stats.totalCurrent) * 100 : 0;
              const catInvested = [...stats.byType.entries()]
                .filter(([t]) => (TYPE_CATEGORY[t] || "Other") === c.label)
                .reduce((s, [, v]) => s + v.invested, 0);
              const catPnl = c.value - catInvested;
              const catPnlPct = catInvested > 0 ? (catPnl / catInvested) * 100 : 0;
              const catColors: Record<string, string> = { Market: "#6366f1", "Fixed Income": "#f59e0b", Commodity: "#fbbf24", Pension: "#8b5cf6", Digital: "#a855f7", Property: "#ef4444", Other: "#84cc16" };
              return (
                <div key={c.label} className="p-3.5 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: catColors[c.label] || "#94a3b8" }} />
                      <span className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>{c.label}</span>
                      <span className="text-xs font-mono font-bold text-indigo-400">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono font-bold">
                      <span className="text-slate-300">{inr(c.value, { compact: true })}</span>
                      <span className={catPnl >= 0 ? "text-emerald-400" : "text-red-400"}>{catPnlPct >= 0 ? "+" : ""}{catPnlPct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-surface-3">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: catColors[c.label] || "#94a3b8" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* EVERY TYPE DETAIL CARDS */}
      {[...stats.byType.entries()].sort((a, b) => b[1].current - a[1].current).map(([typeLabel, typeStats]) => {
        const typeHoldings = holdings.filter(h => (TYPE_LABELS[h.type] || h.type) === typeLabel).sort((a, b) => b.liveCurrentValue - a.liveCurrentValue);
        const pnl = typeStats.current - typeStats.invested;
        const pnlPct = typeStats.invested > 0 ? (pnl / typeStats.invested) * 100 : 0;
        const estYield = EST_YIELD[typeHoldings[0]?.type] || 0;
        const estIncome = typeStats.current * estYield / 100;
        const isLive = typeHoldings.some(h => h.liveOk);

        return (
          <Card key={typeLabel} title={typeLabel} subtitle={`${typeStats.count} holding${typeStats.count > 1 ? "s" : ""} · ${isLive ? "Live Ticker Feeds" : "Manual Valuation"}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 pt-1">
              <div className="p-3 rounded-xl border border-white/[0.04] bg-surface-2 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Capital Invested</span>
                <span className="text-base font-mono font-bold text-slate-300 block mt-0.5">{inr(typeStats.invested, { compact: true })}</span>
              </div>
              <div className="p-3 rounded-xl border border-white/[0.04] bg-surface-2 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Valuation</span>
                <span className="text-base font-mono font-extrabold text-white block mt-0.5">{inr(typeStats.current, { compact: true })}</span>
              </div>
              <div className="p-3 rounded-xl border border-white/[0.04] bg-surface-2 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Net P&L</span>
                <span className={`text-base font-mono font-bold block mt-0.5 ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pnl >= 0 ? "+" : ""}{inr(Math.abs(pnl), { compact: true })} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)</span>
              </div>
              {estYield > 0 ? (
                <div className="p-3 rounded-xl border border-white/[0.04] bg-surface-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Yield</span>
                  <span className="text-base font-mono font-bold text-indigo-400 block mt-0.5">{estYield}% ({inr(estIncome, { compact: true })}/yr)</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-white/[0.04] bg-surface-2 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Yield %</span>
                  <span className={`text-base font-mono font-bold block mt-0.5 ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {typeHoldings.map((h) => {
                const inv = num(h.invested); const cur = h.liveCurrentValue;
                const p = cur - inv; const pp = inv > 0 ? (p / inv) * 100 : 0;
                const dayPct = h.liveChangePct;
                const dayAmt = dayPct !== null ? cur * (dayPct / 100) / (1 + dayPct / 100) : null;
                return (
                  <div key={h.id} className="p-4 rounded-2xl border border-white/[0.06] bg-surface-2 hover:border-indigo-500/40 transition-all">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-extrabold text-white truncate">{h.name}</span>
                          {h.liveOk && <Badge tone="success">Live Linked</Badge>}
                          {!h.liveOk && h.symbol && <Badge tone="warning">Polling Quote</Badge>}
                          {!h.liveOk && !h.symbol && !h.schemeCode && <Badge tone="primary">Manual Valuation</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400 font-mono flex-wrap">
                          {h.units && <span>Units: <strong className="text-slate-200">{h.units}</strong></span>}
                          {h.livePrice && <span>Price: <strong className="text-slate-200">{inr(h.livePrice)}</strong></span>}
                          {h.liveCagr1Y !== null && <span className={h.liveCagr1Y >= 0 ? "text-emerald-400" : "text-red-400"}>1Y CAGR: {pctStr(h.liveCagr1Y)}</span>}
                          {h.liveCagr3Y !== null && <span className={h.liveCagr3Y >= 0 ? "text-emerald-400" : "text-red-400"}>3Y: {pctStr(h.liveCagr3Y)}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold font-mono text-white">{inr(cur)}</p>
                        <div className="flex items-center gap-2 justify-end text-xs font-mono font-bold mt-0.5">
                          {dayAmt !== null && <span className={dayAmt >= 0 ? "text-emerald-400" : "text-red-400"}>{dayAmt >= 0 ? "▲" : "▼"} {inr(Math.abs(dayAmt), { compact: true })}</span>}
                          {inv > 0 && <span className={p >= 0 ? "text-emerald-400" : "text-red-400"}>{p >= 0 ? "+" : ""}{pp.toFixed(1)}%</span>}
                        </div>
                      </div>
                    </div>
                    {inv > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/[0.04]">
                        <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                          <span className="text-slate-400">Invested {inr(inv, { compact: true })}</span>
                          <span className={p >= 0 ? "text-emerald-400" : "text-red-400"}>{p >= 0 ? "+" : ""}{inr(Math.abs(p), { compact: true })}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-surface-3">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, inv > 0 ? (cur / Math.max(inv, cur)) * 100 : 0)}%`, background: p >= 0 ? "linear-gradient(90deg, var(--primary), var(--success))" : "linear-gradient(90deg, var(--danger), var(--primary))" }} />
                        </div>
                      </div>
                    )}
                    {onSell && (Number(h.units || 0) > 0 || num(h.invested) > 0 || num(h.currentValue) > 0) && (
                      <div className="mt-3 flex justify-end no-print">
                        <button onClick={() => onSell(h)} className="btn btn-secondary text-xs px-3.5 py-1.5 font-bold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10">Redeem / Sell Asset</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* GAINERS / LOSERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.topGainers.length > 0 && (
          <Card title="Top Performing Assets" subtitle="Best yield percentage holdings">
            <div className="space-y-2.5 pt-1">
              {stats.topGainers.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg grid place-items-center text-emerald-400 bg-emerald-500/20 shrink-0">
                      <IconTrendingUp size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-white">{h.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{TYPE_LABELS[h.type] || h.type} · {h.liveOk ? "Live Ticker" : "Manual"}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2 font-mono font-bold">
                    <p className="text-sm text-emerald-400">+{h.pnlPct.toFixed(1)}%</p>
                    <p className="text-xs text-slate-300">+{inr(Math.abs(h.pnl), { compact: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {stats.topLosers.length > 0 && (
          <Card title="Underperforming Holdings" subtitle="Lowest yield percentage holdings">
            <div className="space-y-2.5 pt-1">
              {stats.topLosers.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3.5 rounded-xl border border-red-500/20 bg-red-500/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg grid place-items-center text-red-400 bg-red-500/20 shrink-0">
                      <IconTrendingDown size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-white">{h.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{TYPE_LABELS[h.type] || h.type}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2 font-mono font-bold">
                    <p className="text-sm text-red-400">{h.pnlPct.toFixed(1)}%</p>
                    <p className="text-xs text-slate-300">{inr(h.pnl, { compact: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* HEALTH */}
      <Card title="Portfolio Diversification Health" subtitle="Allocation spread & concentration risk telemetry">
        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          <div className="relative w-28 h-28 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-3)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={stats.healthScore >= 75 ? "var(--success)" : stats.healthScore >= 50 ? "var(--primary)" : "var(--danger)"} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(stats.healthScore / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <span className="text-xl font-mono font-black text-white">{stats.healthScore}</span>
            </div>
          </div>
          <div className="space-y-2 text-xs font-medium text-slate-300">
            <p className="flex items-center gap-2"><IconCheck size={14} className="text-emerald-400 shrink-0" /> <span>Asset Diversification: <strong>{[...stats.byType.keys()].length} distinct asset classes</strong></span></p>
            <p className="flex items-center gap-2"><IconCheck size={14} className="text-emerald-400 shrink-0" /> <span>Live Ticker Coverage: <strong>{stats.liveCount} of {holdings.length} holdings linked</strong></span></p>
          </div>
        </div>
      </Card>
    </div>
  );
}
