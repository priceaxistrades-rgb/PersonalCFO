"use client";

import { useMemo } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart, BarChart } from "@/components/ui/Charts";
import { inr, num } from "@/lib/format";
import type { MarketQuote } from "@/lib/market";
import { resolveLiveSymbol } from "@/lib/market";

/* ═══════════════════════════════════════════════════════════════════════
   PORTFOLIO SYNC DASHBOARD — Complete Investment Dashboard
   Shows EVERY holding: Stocks, MFs, FD, PPF, EPF, NPS, Gold,
   Real Estate, Bonds, Crypto, etc. All synced, all the time.
   ═══════════════════════════════════════════════════════════════════════ */

type Holding = {
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

const TYPE_COLORS: Record<string, string> = {
  Stocks: "#6366f1", MutualFunds: "#0ea5e9", PPF: "#10b981", EPF: "#14b8a6",
  NPS: "#8b5cf6", FD: "#f59e0b", RD: "#f97316", Gold: "#fbbf24",
  Silver: "#94a3b8", Bonds: "#ec4899", Crypto: "#a855f7", RealEstate: "#ef4444",
  Other: "#84cc16",
};

const TYPE_LABELS: Record<string, string> = {
  MutualFunds: "Mutual Funds", RealEstate: "Real Estate",
};

const TYPE_ICONS: Record<string, string> = {
  Stocks: "📈", MutualFunds: "🏦", PPF: "🛡️", EPF: "🏛️", NPS: "🎯",
  FD: "🔒", RD: "📅", Gold: "🥇", Silver: "🥈", Bonds: "📜",
  Crypto: "₿", RealEstate: "🏠", Other: "📦",
};

// Estimated annual yield for non-market instruments
const EST_YIELD: Record<string, number> = {
  FD: 7.0, RD: 6.5, PPF: 7.1, EPF: 8.5, NPS: 10.0,
  Gold: 9.0, Silver: 8.0, Bonds: 7.5, RealEstate: 8.0, Crypto: 0, Other: 5.0,
  Stocks: 0, MutualFunds: 0,
};

const TYPE_CATEGORY: Record<string, string> = {
  Stocks: "Market", MutualFunds: "Market", PPF: "Fixed Income", EPF: "Fixed Income",
  NPS: "Pension", FD: "Fixed Income", RD: "Fixed Income", Gold: "Commodity",
  Silver: "Commodity", Bonds: "Fixed Income", Crypto: "Digital", RealEstate: "Property", Other: "Other",
};

function inferSector(name: string, type: string): string {
  if (TYPE_CATEGORY[type]) return TYPE_CATEGORY[type];
  const n = name.toLowerCase();
  if (n.includes("bank") || n.includes("hdfc") || n.includes("sbi") || n.includes("icici") || n.includes("kotak")) return "Banking";
  if (n.includes("tech") || n.includes("tcs") || n.includes("infosys") || n.includes("wipro")) return "IT";
  if (n.includes("pharma") || n.includes("dr reddy") || n.includes("sun pharma")) return "Pharma";
  if (n.includes("auto") || n.includes("maruti") || n.includes("tata motor")) return "Auto";
  if (n.includes("oil") || n.includes("gas") || n.includes("reliance") || n.includes("ongc")) return "Energy";
  if (n.includes("infra") || n.includes("cement") || n.includes("ltr")) return "Infra";
  if (n.includes("fmcg") || n.includes("itc") || n.includes("nestle")) return "FMCG";
  if (n.includes("nifty") || n.includes("sensex")) return "Index";
  if (n.includes("debt") || n.includes("liquid")) return "Debt";
  if (n.includes("elss") || n.includes("tax")) return "Tax Saving";
  if (type === "MutualFunds") return "Diversified";
  return "Other";
}

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

    // By type
    const byType = new Map<string, { invested: number; current: number; count: number }>();
    holdings.forEach(h => {
      const t = TYPE_LABELS[h.type] || h.type;
      const prev = byType.get(t) || { invested: 0, current: 0, count: 0 };
      byType.set(t, { invested: prev.invested + num(h.invested), current: prev.current + h.liveCurrentValue, count: prev.count + 1 });
    });

    // By category (Market / Fixed Income / Commodity / etc.)
    const byCategory = new Map<string, { invested: number; current: number }>();
    holdings.forEach(h => {
      const cat = TYPE_CATEGORY[h.type] || "Other";
      const prev = byCategory.get(cat) || { invested: 0, current: 0 };
      byCategory.set(cat, { invested: prev.invested + num(h.invested), current: prev.current + h.liveCurrentValue });
    });

    // Estimated annual income from non-market instruments
    let estAnnualIncome = 0;
    holdings.forEach(h => {
      const yieldPct = EST_YIELD[h.type] || 0;
      if (yieldPct > 0) {
        estAnnualIncome += h.liveCurrentValue * yieldPct / 100;
      } else if (h.liveOk && h.type === "Stocks") {
        // Stock dividend estimate ~1.5%
        estAnnualIncome += h.liveCurrentValue * 1.5 / 100;
      } else if (h.liveOk && h.type === "MutualFunds") {
        estAnnualIncome += h.liveCurrentValue * 1.0 / 100;
      }
    });

    // Top gainers / losers
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

    // Portfolio XIRR approximation (weighted return)
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
    [...stats.byType.entries()].map(([label, v]) => ({ label, value: v.current, color: TYPE_COLORS[label] || TYPE_COLORS.Other })).sort((a, b) => b.value - a.value),
    [stats.byType]
  );
  const catAlloc = useMemo(() =>
    [...stats.byCategory.entries()].map(([label, v]) => ({ label, value: v.current })).sort((a, b) => b.value - a.value),
    [stats.byCategory]
  );
  const pnlByType = useMemo(() =>
    [...stats.byType.entries()].map(([label, v]) => {
      const p = v.invested > 0 ? ((v.current - v.invested) / v.invested) * 100 : 0;
      return { label, value: p, color: p >= 0 ? TYPE_COLORS[label] || "#10b981" : "#ef4444" };
    }).sort((a, b) => b.value - a.value),
    [stats.byType]
  );

  const healthTone = stats.healthScore >= 80 ? "success" : stats.healthScore >= 60 ? "primary" : stats.healthScore >= 40 ? "warning" : "danger";
  const healthEmoji = stats.healthScore >= 80 ? "🎉" : stats.healthScore >= 60 ? "💪" : stats.healthScore >= 40 ? "⚠️" : "🔴";
  const maxTPct = () => { const vals = [...stats.byType.values()].map(v => v.current); return stats.totalCurrent > 0 ? Math.max(...vals) / stats.totalCurrent : 0; };

  return (
    <div className="space-y-4">
      {/* SYNC BAR */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: loading ? "var(--warning)" : error ? "var(--danger)" : "var(--success)" }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: loading ? "var(--warning)" : error ? "var(--danger)" : "var(--success)" }} />
          </span>
          {loading ? "Syncing…" : updatedAt ? `Synced ${updatedAt} · ${stats.liveCount}/${holdings.length} live` : "Ready"}
        </div>
        <button onClick={loadQuotes} disabled={loading} className="text-xs font-medium no-print px-3 py-1.5 rounded-lg" style={{ background: "var(--surface-3)", color: "var(--text)", opacity: loading ? 0.7 : 1 }}>🔄 Refresh</button>
      </div>
      {error && <div className="rounded-lg p-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>⚠️ {error}</div>}

      {/* HERO KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 kpi-scroll lg:grid stagger-wide slide-in-up">
        <KpiCard label="Portfolio Value" value={inr(stats.totalCurrent, { compact: true })} icon="📈" tone="primary" sub={`${stats.liveCount} live`} />
        <KpiCard label="Total Invested" value={inr(stats.totalInvested, { compact: true })} icon="💼" tone="accent" />
        <KpiCard label="Total P&L" value={inr(stats.totalPnl, { compact: true })} icon={stats.totalPnl >= 0 ? "🟢" : "🔴"} tone={stats.totalPnl >= 0 ? "success" : "danger"} trend={{ dir: stats.totalPnl >= 0 ? "up" : "down", text: `${stats.totalPnlPct.toFixed(1)}%`, good: stats.totalPnl >= 0 }} />
        <KpiCard label="Day Change" value={inr(stats.dayChange, { compact: true })} icon={stats.dayChange >= 0 ? "⬆️" : "⬇️"} tone={stats.dayChange >= 0 ? "success" : "danger"} />
        <KpiCard label="1Y CAGR" value={stats.weightedCagr !== null ? `${stats.weightedCagr.toFixed(1)}%` : "—"} icon="🎯" tone="warning" sub="Weighted" />
      </div>

      {/* SECONDARY KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 kpi-scroll lg:grid">
        <KpiCard label="Holdings" value={`${holdings.length}`} icon="📊" tone="primary" sub={`${[...stats.byType.keys()].length} types`} />
        <KpiCard label="Est. Annual Income" value={inr(stats.estAnnualIncome, { compact: true })} icon="💰" tone="success" sub="Div + Interest" />
        <KpiCard label="Health Score" value={`${stats.healthScore}/100`} icon={healthEmoji} tone={healthTone} />
        <KpiCard label="Total Return" value={`${stats.totalReturnPct.toFixed(1)}%`} icon="📊" tone={stats.totalReturnPct >= 0 ? "success" : "danger"} sub="All time" />
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="🎯 Asset Allocation" subtitle="By live current value — all types">
          {typeAlloc.length > 0 ? <DonutChart data={typeAlloc} centerLabel="Total" centerValue={inr(stats.totalCurrent, { compact: true })} /> : <EmptyChart />}
        </Card>
        <Card title="📊 P&L by Type" subtitle="Return percentage by asset type">
          {pnlByType.length > 0 ? <BarChart data={pnlByType} format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`} /> : <EmptyChart />}
        </Card>
      </div>

      {/* CATEGORY BREAKDOWN — Market / Fixed Income / Commodity / Pension / etc. */}
      {catAlloc.length > 1 && (
        <Card title="📂 Asset Category" subtitle="Grouped by instrument category">
          <div className="space-y-3">
            {catAlloc.map((c, i) => {
              const pct = stats.totalCurrent > 0 ? (c.value / stats.totalCurrent) * 100 : 0;
              const catInvested = [...stats.byType.entries()]
                .filter(([t]) => (TYPE_CATEGORY[t] || "Other") === c.label)
                .reduce((s, [, v]) => s + v.invested, 0);
              const catPnl = c.value - catInvested;
              const catPnlPct = catInvested > 0 ? (catPnl / catInvested) * 100 : 0;
              const catColors: Record<string, string> = { Market: "#6366f1", "Fixed Income": "#f59e0b", Commodity: "#fbbf24", Pension: "#8b5cf6", Digital: "#a855f7", Property: "#ef4444", Other: "#84cc16" };
              return (
                <div key={c.label} className="slide-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: catColors[c.label] || "#94a3b8" }} />
                      <span className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>{c.label}</span>
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span style={{ color: "var(--text-muted)" }}>{inr(c.value, { compact: true })}</span>
                      <span style={{ color: catPnl >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>{catPnlPct >= 0 ? "+" : ""}{catPnlPct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: catColors[c.label] || "#94a3b8" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* EVERY TYPE DETAIL CARDS — FD, PPF, EPF, Gold etc. each get their own section */}
      {[...stats.byType.entries()].sort((a, b) => b[1].current - a[1].current).map(([typeLabel, typeStats]) => {
        const typeHoldings = holdings.filter(h => (TYPE_LABELS[h.type] || h.type) === typeLabel).sort((a, b) => b.liveCurrentValue - a.liveCurrentValue);
        const pnl = typeStats.current - typeStats.invested;
        const pnlPct = typeStats.invested > 0 ? (pnl / typeStats.invested) * 100 : 0;
        const estYield = EST_YIELD[typeHoldings[0]?.type] || 0;
        const estIncome = typeStats.current * estYield / 100;
        const icon = TYPE_ICONS[typeHoldings[0]?.type] || "📦";
        const isLive = typeHoldings.some(h => h.liveOk);

        return (
          <Card key={typeLabel} title={`${icon} ${typeLabel}`} subtitle={`${typeStats.count} holding${typeStats.count > 1 ? "s" : ""} · ${isLive ? "Live" : "Manual"}`}>
            {/* Type-level KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <MiniStat label="Invested" value={inr(typeStats.invested, { compact: true })} />
              <MiniStat label="Current" value={inr(typeStats.current, { compact: true })} color="var(--text-heading)" />
              <MiniStat label="P&L" value={`${pnl >= 0 ? "+" : ""}${inr(Math.abs(pnl), { compact: true })} (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%)`} color={pnl >= 0 ? "var(--success)" : "var(--danger)"} />
              {estYield > 0 && <MiniStat label="Est. Yield" value={`${estYield}% → ${inr(estIncome, { compact: true })}/yr`} color="var(--primary)" />}
              {estYield === 0 && <MiniStat label="Return" value={pnlPct >= 0 ? `+${pnlPct.toFixed(1)}%` : `${pnlPct.toFixed(1)}%`} color={pnl >= 0 ? "var(--success)" : "var(--danger)"} />}
            </div>

            {/* Individual holdings within this type */}
            <div className="space-y-2">
              {typeHoldings.map((h, idx) => {
                const inv = num(h.invested); const cur = h.liveCurrentValue;
                const p = cur - inv; const pp = inv > 0 ? (p / inv) * 100 : 0;
                const dayPct = h.liveChangePct;
                const dayAmt = dayPct !== null ? cur * (dayPct / 100) / (1 + dayPct / 100) : null;
                const hYield = EST_YIELD[h.type] || 0;
                const hEstIncome = cur * hYield / 100;
                return (
                  <div key={h.id} className="p-3 rounded-xl slide-in-up" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", animationDelay: `${idx * 40}ms` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold truncate" style={{ color: "var(--text-heading)" }}>{h.name}</span>
                          {h.liveOk && <Badge tone="success">● Live</Badge>}
                          {!h.liveOk && h.symbol && <Badge tone="warning">⏳ Syncing</Badge>}
                          {!h.liveOk && !h.symbol && !h.schemeCode && <Badge tone="primary">📋 Manual</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] flex-wrap" style={{ color: "var(--text-muted)" }}>
                          {h.units && <span>Units: {h.units}</span>}
                          {h.livePrice && <span>Price: {inr(h.livePrice)}</span>}
                          {h.liveAsOf && <span>As of: {h.liveAsOf}</span>}
                          {h.startDate && <span>Since: {new Date(h.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>}
                          {hYield > 0 && <span>Yield: {hYield}% → {inr(hEstIncome, { compact: true })}/yr</span>}
                          {h.liveCagr1Y !== null && <span style={{ color: h.liveCagr1Y >= 0 ? "var(--success)" : "var(--danger)" }}>1Y: {pctStr(h.liveCagr1Y)}</span>}
                          {h.liveCagr3Y !== null && <span style={{ color: h.liveCagr3Y >= 0 ? "var(--success)" : "var(--danger)" }}>3Y: {pctStr(h.liveCagr3Y)}</span>}
                          {h.liveCagr5Y !== null && <span style={{ color: h.liveCagr5Y >= 0 ? "var(--success)" : "var(--danger)" }}>5Y: {pctStr(h.liveCagr5Y)}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-extrabold" style={{ color: "var(--text-heading)" }}>{inr(cur, { compact: true })}</p>
                        <div className="flex items-center gap-2 justify-end mt-0.5">
                          {dayAmt !== null && <span className="text-[11px]" style={{ color: dayAmt >= 0 ? "var(--success)" : "var(--danger)" }}>{dayAmt >= 0 ? "▲" : "▼"} {inr(Math.abs(dayAmt), { compact: true })}</span>}
                          {inv > 0 && <span className="text-[11px] font-bold" style={{ color: p >= 0 ? "var(--success)" : "var(--danger)" }}>{p >= 0 ? "+" : ""}{pp.toFixed(1)}%</span>}
                        </div>
                      </div>
                    </div>
                    {inv > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider mb-1">
                          <span style={{ color: "var(--text-faint)" }}>Invested {inr(inv, { compact: true })}</span>
                          <span style={{ color: p >= 0 ? "var(--success)" : "var(--danger)" }}>{p >= 0 ? "+" : ""}{inr(Math.abs(p), { compact: true })}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, inv > 0 ? (cur / Math.max(inv, cur)) * 100 : 0)}%`, background: p >= 0 ? "linear-gradient(90deg, var(--primary), var(--success))" : "linear-gradient(90deg, var(--danger), var(--primary))" }} />
                        </div>
                      </div>
                    )}
                    {/* Sell / Redeem button */}
                    {onSell && (Number(h.units || 0) > 0 || num(h.invested) > 0 || num(h.currentValue) > 0) && (
                      <div className="mt-2 flex justify-end no-print">
                        <button onClick={() => onSell(h)} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors" style={{ background: "var(--warning-soft)", color: "var(--warning)", border: "1px solid var(--warning)44" }} aria-label={`Sell ${h.name}`}>📉 Sell / Redeem</button>
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
          <Card title="🟢 Top Gainers" subtitle="Best performing holdings">
            <div className="space-y-2">
              {stats.topGainers.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--success-soft)", border: "1px solid var(--success)22" }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg grid place-items-center text-sm" style={{ background: "var(--success-soft)", color: "var(--success)" }}>📈</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text-heading)" }}>{h.name}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{TYPE_LABELS[h.type] || h.type} · {TYPE_ICONS[h.type]}{h.liveOk ? " Live" : " Manual"}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-extrabold" style={{ color: "var(--success)" }}>+{h.pnlPct.toFixed(1)}%</p>
                    <p className="text-[10px]" style={{ color: "var(--success)" }}>+{inr(Math.abs(h.pnl), { compact: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {stats.topLosers.length > 0 && (
          <Card title="🔴 Top Losers" subtitle="Underperforming holdings">
            <div className="space-y-2">
              {stats.topLosers.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)22" }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg grid place-items-center text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>📉</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text-heading)" }}>{h.name}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{TYPE_LABELS[h.type] || h.type} · {TYPE_ICONS[h.type]}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-extrabold" style={{ color: "var(--danger)" }}>{h.pnlPct.toFixed(1)}%</p>
                    <p className="text-[10px]" style={{ color: "var(--danger)" }}>{inr(h.pnl, { compact: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* INCOME ESTIMATE */}
      {stats.estAnnualIncome > 0 && (
        <Card title="💰 Estimated Annual Income" subtitle="Dividends + interest from all holdings">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label="Annual Est." value={inr(stats.estAnnualIncome, { compact: true })} color="var(--success)" big />
            <MiniStat label="Monthly" value={inr(stats.estAnnualIncome / 12, { compact: true })} color="var(--text-heading)" big />
            <MiniStat label="Yield %" value={`${stats.totalCurrent > 0 ? ((stats.estAnnualIncome / stats.totalCurrent) * 100).toFixed(1) : "0"}%`} color="var(--primary)" big />
            <MiniStat label="Sources" value={`${[...new Set(holdings.map(h => TYPE_CATEGORY[h.type] || "Other"))].length} categories`} color="var(--text-muted)" big />
          </div>
          <p className="text-[10px] mt-3 italic" style={{ color: "var(--text-faint)" }}>⚠️ Estimates based on typical yields: FD 7%, PPF 7.1%, EPF 8.5%, NPS 10%, Gold 9%, Bonds 7.5%. Actual may vary.</p>
        </Card>
      )}

      {/* HEALTH */}
      <Card title={`${healthEmoji} Portfolio Health`} subtitle="Diversification & performance">
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-3)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={`var(--${healthTone})`} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(stats.healthScore / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 grid place-items-center"><span className="text-xl font-black" style={{ color: `var(--${healthTone})` }}>{stats.healthScore}</span></div>
          </div>
          <div className="flex-1 space-y-2">
            <HRow label="Diversification" ok={[...stats.byType.keys()].length >= 3} detail={`${[...stats.byType.keys()].length} types`} />
            <HRow label="Concentration" ok={maxTPct() < 0.5} detail={`${(maxTPct() * 100).toFixed(0)}% max`} />
            <HRow label="Performance" ok={stats.totalPnl >= 0} detail={stats.totalPnlPct >= 0 ? `+${stats.totalPnlPct.toFixed(1)}%` : `${stats.totalPnlPct.toFixed(1)}%`} />
            <HRow label="Live Tracking" ok={stats.liveCount >= holdings.length * 0.5} detail={`${stats.liveCount}/${holdings.length}`} />
          </div>
        </div>
      </Card>

      {/* SYNC NOTE */}
      <Card className="!p-4" style={{ border: "1px solid var(--border-accent)" }}>
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">🔗</span>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Live Sync Status</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}><strong style={{ color: "var(--success)" }}>📈 Stocks & 🏦 MFs:</strong> Live price × units, auto-refresh every 60s.</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}><strong style={{ color: "var(--primary)" }}>🔒 FD · 🛡️ PPF · 🏛️ EPF · 🎯 NPS:</strong> Fixed returns. Current value shows invested + accrued. Update maturity values manually.</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}><strong style={{ color: "var(--warning)" }}>🥇 Gold · 🥈 Silver · 🏠 Real Estate:</strong> No live exchange price. Update when market rates change.</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}><strong style={{ color: "var(--accent)" }}>📜 Bonds · ₿ Crypto:</strong> Bonds sync via MF NAV if linked. Crypto needs manual update.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ label, value, color, big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <div className="p-3 rounded-xl text-center" style={{ background: "var(--surface-2)" }}>
      <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className={`font-extrabold mt-0.5 ${big ? "text-lg" : "text-sm"}`} style={{ color: color || "var(--text-heading)" }}>{value}</p>
    </div>
  );
}

function HRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="flex items-center gap-2">
        <span style={{ color: ok ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>{detail}</span>
        <span>{ok ? "✅" : "⚠️"}</span>
      </div>
    </div>
  );
}

function EmptyChart() {
  return <p className="text-sm py-8 text-center" style={{ color: "var(--text-faint)" }}>Add investments to see charts</p>;
}
