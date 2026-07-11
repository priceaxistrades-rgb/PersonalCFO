"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart, BarChart } from "@/components/ui/Charts";
import { inr, num } from "@/lib/format";
import type { MarketQuote } from "@/lib/market";
import { resolveLiveSymbol } from "@/lib/market";

/* ═══════════════════════════════════════════════════════════════════════
   MARKETS PORTFOLIO SYNC — Shows ALL investments in Live Markets
   Every type: Stocks, MFs, FD, PPF, EPF, NPS, Gold, Real Estate...
   ═══════════════════════════════════════════════════════════════════════ */

type InvItem = {
  id: number; name: string; type: string;
  invested: string; currentValue: string;
  annualReturn: string | null;
  symbol: string | null; schemeCode: string | null;
  units: string | null; startDate: string | null;
};

const TYPE_COLORS: Record<string, string> = {
  Stocks: "#6366f1", MutualFunds: "#0ea5e9", PPF: "#10b981", EPF: "#14b8a6",
  NPS: "#8b5cf6", FD: "#f59e0b", RD: "#f97316", Gold: "#fbbf24",
  Silver: "#94a3b8", Bonds: "#ec4899", Crypto: "#a855f7", RealEstate: "#ef4444",
  Other: "#84cc16",
};
const TYPE_LABELS: Record<string, string> = { MutualFunds: "Mutual Funds", RealEstate: "Real Estate" };
const TYPE_ICONS: Record<string, string> = {
  Stocks: "📈", MutualFunds: "🏦", PPF: "🛡️", EPF: "🏛️", NPS: "🎯",
  FD: "🔒", RD: "📅", Gold: "🥇", Silver: "🥈", Bonds: "📜",
  Crypto: "₿", RealEstate: "🏠", Other: "📦",
};
const EST_YIELD: Record<string, number> = {
  FD: 7.0, RD: 6.5, PPF: 7.1, EPF: 8.5, NPS: 10.0,
  Gold: 9.0, Silver: 8.0, Bonds: 7.5, RealEstate: 8.0, Crypto: 0, Other: 5.0, Stocks: 0, MutualFunds: 0,
};
const TYPE_CATEGORY: Record<string, string> = {
  Stocks: "Market", MutualFunds: "Market", PPF: "Fixed Income", EPF: "Fixed Income",
  NPS: "Pension", FD: "Fixed Income", RD: "Fixed Income", Gold: "Commodity",
  Silver: "Commodity", Bonds: "Fixed Income", Crypto: "Digital", RealEstate: "Property", Other: "Other",
};

export function MarketsPortfolioSync({ investments, onSell }: { investments: InvItem[]; onSell?: (inv: InvItem) => void }) {
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stocks = useMemo(() => [...new Set(investments.filter(i => i.symbol && i.type === "Stocks").map(i => i.symbol!))], [investments]);
  const mfs = useMemo(() => [...new Set(investments.filter(i => i.schemeCode && i.type === "MutualFunds").map(i => i.schemeCode!))], [investments]);
  // Resolve extra symbols for Gold, Silver, Crypto, RealEstate, etc.
  const extraSymbols = useMemo(() => {
    const map: Record<string, string[]> = { commodity: [], crypto: [], index: [], reit: [], bond: [] };
    investments.forEach((inv) => {
      if (inv.type === "Stocks" || inv.type === "MutualFunds") return;
      const resolved = resolveLiveSymbol(inv.type, inv.symbol);
      if (resolved) {
        if (!map[resolved.kind]) map[resolved.kind] = [];
        if (!map[resolved.kind].includes(resolved.yahooSymbol)) {
          map[resolved.kind].push(resolved.yahooSymbol);
        }
      }
    });
    return map;
  }, [investments]);

  const loadQuotes = useCallback(async () => {
    if (!stocks.length && !mfs.length && Object.values(extraSymbols).every(a => !a.length)) { setLoading(false); return; }
    setLoading(true);
    const params = new URLSearchParams();
    if (stocks.length) params.set("stocks", stocks.join(","));
    if (mfs.length) params.set("mf", mfs.join(","));
    if (extraSymbols.commodity?.length) params.set("commodities", extraSymbols.commodity.join(","));
    if (extraSymbols.crypto?.length) params.set("crypto", extraSymbols.crypto.join(","));
    if (extraSymbols.index?.length) params.set("indices", extraSymbols.index.join(","));
    if (extraSymbols.reit?.length) params.set("reits", extraSymbols.reit.join(","));
    if (extraSymbols.bond?.length) params.set("bonds", extraSymbols.bond.join(","));
    try {
      const res = await fetch(`/api/market/quote?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setQuotes(data.quotes || {});
    } catch { /* keep previous */ }
    setLoading(false);
  }, [stocks, mfs, extraSymbols]);

  useEffect(() => {
    const start = setTimeout(() => void loadQuotes(), 0);
    timerRef.current = setInterval(() => void loadQuotes(), 60000);
    return () => { clearTimeout(start); if (timerRef.current) clearInterval(timerRef.current); };
  }, [loadQuotes]);

  const stats = useMemo(() => {
    let totalInvested = 0, totalCurrent = 0, dayChange = 0;
    const byType = new Map<string, { invested: number; current: number; count: number }>();
    const byCategory = new Map<string, { invested: number; current: number }>();

    investments.forEach(inv => {
      const invNum = num(inv.invested), cvNum = num(inv.currentValue), units = num(inv.units);
      // First try explicit stock/MF key
      let key = inv.symbol && inv.type === "Stocks" ? `stock:${inv.symbol}` : inv.schemeCode && inv.type === "MutualFunds" ? `mf:${inv.schemeCode}` : null;
      let q = key ? quotes[key] : undefined;
      // If no direct match, try resolving via type (Gold, Silver, Crypto, etc.)
      if (!q) {
        const resolved = resolveLiveSymbol(inv.type, inv.symbol);
        if (resolved) {
          const resolvedKey = `${resolved.kind}:${resolved.yahooSymbol}`;
          q = quotes[resolvedKey];
          if (q) key = resolvedKey;
        }
      }
      const hasLive = q?.ok && q.price > 0 && units > 0;
      const liveCurrent = hasLive ? q!.price * units : cvNum > 0 ? cvNum : invNum;

      totalInvested += invNum; totalCurrent += liveCurrent;
      if (q?.ok && q.changePct !== null && units > 0) {
        dayChange += liveCurrent * (q.changePct / 100) / (1 + q.changePct / 100);
      }

      const t = TYPE_LABELS[inv.type] || inv.type;
      const prev = byType.get(t) || { invested: 0, current: 0, count: 0 };
      byType.set(t, { invested: prev.invested + invNum, current: prev.current + liveCurrent, count: prev.count + 1 });

      const cat = TYPE_CATEGORY[inv.type] || "Other";
      const prevC = byCategory.get(cat) || { invested: 0, current: 0 };
      byCategory.set(cat, { invested: prevC.invested + invNum, current: prevC.current + liveCurrent });
    });

    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    let estIncome = 0;
    investments.forEach(inv => {
      const y = EST_YIELD[inv.type] || 0;
      const cv = num(inv.currentValue);
      const units = num(inv.units);
      const key = inv.symbol ? `stock:${inv.symbol}` : inv.schemeCode ? `mf:${inv.schemeCode}` : null;
      const q = key ? quotes[key] : undefined;
      const hasLive = q?.ok && q.price > 0 && units > 0;
      const liveCurrent = hasLive ? q!.price * units : cv;
      if (y > 0) estIncome += liveCurrent * y / 100;
      else if (inv.type === "Stocks") estIncome += liveCurrent * 1.5 / 100;
      else if (inv.type === "MutualFunds") estIncome += liveCurrent * 1.0 / 100;
    });

    const typeAlloc = [...byType.entries()].map(([label, v]) => ({ label, value: v.current, color: TYPE_COLORS[label] || TYPE_COLORS.Other })).sort((a, b) => b.value - a.value);
    const catAlloc = [...byCategory.entries()].map(([label, v]) => ({ label, value: v.current })).sort((a, b) => b.value - a.value);
    const pnlByType = [...byType.entries()].map(([label, v]) => {
      const p = v.invested > 0 ? ((v.current - v.invested) / v.invested) * 100 : 0;
      return { label, value: p, color: p >= 0 ? TYPE_COLORS[label] || "#10b981" : "#ef4444" };
    }).sort((a, b) => b.value - a.value);

    return { totalInvested, totalCurrent, totalPnl, totalPnlPct, dayChange, byType, byCategory, estIncome, typeAlloc, catAlloc, pnlByType };
  }, [investments, quotes]);

  if (investments.length === 0) return null;

  const catColors: Record<string, string> = { Market: "#6366f1", "Fixed Income": "#f59e0b", Commodity: "#fbbf24", Pension: "#8b5cf6", Digital: "#a855f7", Property: "#ef4444", Other: "#84cc16" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: loading ? "var(--warning)" : "var(--success)" }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: loading ? "var(--warning)" : "var(--success)" }} />
        </span>
        {loading ? "Syncing…" : "Portfolio synced with live market data"}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 kpi-scroll lg:grid stagger-wide slide-in-up">
        <KpiCard label="Live Portfolio" value={inr(stats.totalCurrent, { compact: true })} icon="📈" tone="primary" />
        <KpiCard label="Invested" value={inr(stats.totalInvested, { compact: true })} icon="💼" tone="accent" />
        <KpiCard label="Live P&L" value={inr(stats.totalPnl, { compact: true })} icon={stats.totalPnl >= 0 ? "🟢" : "🔴"} tone={stats.totalPnl >= 0 ? "success" : "danger"} trend={{ dir: stats.totalPnl >= 0 ? "up" : "down", text: `${stats.totalPnlPct.toFixed(1)}%`, good: stats.totalPnl >= 0 }} />
        <KpiCard label="Day Change" value={inr(stats.dayChange, { compact: true })} icon={stats.dayChange >= 0 ? "⬆️" : "⬇️"} tone={stats.dayChange >= 0 ? "success" : "danger"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.typeAlloc.length > 0 && (
          <Card title="🎯 Allocation" subtitle="All types by live value">
            <DonutChart data={stats.typeAlloc} centerLabel="Total" centerValue={inr(stats.totalCurrent, { compact: true })} />
          </Card>
        )}
        {stats.pnlByType.length > 0 && (
          <Card title="📊 P&L by Type" subtitle="Return % by asset class">
            <BarChart data={stats.pnlByType} format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`} />
          </Card>
        )}
      </div>

      {/* Category bars */}
      {stats.catAlloc.length > 1 && (
        <Card title="📂 Asset Categories" subtitle="Market · Fixed Income · Commodity · Pension · Property">
          <div className="space-y-3">
            {stats.catAlloc.map((c, i) => {
              const pct = stats.totalCurrent > 0 ? (c.value / stats.totalCurrent) * 100 : 0;
              const catPnl = c.value - (stats.byCategory.get(c.label)?.invested || 0);
              const catPnlPct = (stats.byCategory.get(c.label)?.invested || 0) > 0 ? (catPnl / (stats.byCategory.get(c.label)?.invested || 1)) * 100 : 0;
              return (
                <div key={c.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: catColors[c.label] || "#94a3b8" }} />
                      <span className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>{c.label}</span>
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
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

      {/* EVERY TYPE SECTION */}
      {[...stats.byType.entries()].sort((a, b) => b[1].current - a[1].current).map(([typeLabel, typeStats]) => {
        const typeHoldings = investments.filter(i => (TYPE_LABELS[i.type] || i.type) === typeLabel).sort((a, b) => num(b.currentValue) - num(a.currentValue));
        const pnl = typeStats.current - typeStats.invested;
        const pnlPct = typeStats.invested > 0 ? (pnl / typeStats.invested) * 100 : 0;
        const estYield = EST_YIELD[typeHoldings[0]?.type] || 0;
        const icon = TYPE_ICONS[typeHoldings[0]?.type] || "📦";
        const hasLive = typeHoldings.some(i => {
          const key = i.symbol ? `stock:${i.symbol}` : i.schemeCode ? `mf:${i.schemeCode}` : null;
          return key && quotes[key]?.ok;
        });

        return (
          <Card key={typeLabel} title={`${icon} ${typeLabel}`} subtitle={`${typeStats.count} holding${typeStats.count > 1 ? "s" : ""} · ${hasLive ? "Live" : estYield > 0 ? `${estYield}% est. yield` : "Manual"}`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <MStat label="Invested" value={inr(typeStats.invested, { compact: true })} />
              <MStat label="Current" value={inr(typeStats.current, { compact: true })} color="var(--text-heading)" />
              <MStat label="P&L" value={`${pnl >= 0 ? "+" : ""}${inr(Math.abs(pnl), { compact: true })} (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%)`} color={pnl >= 0 ? "var(--success)" : "var(--danger)"} />
              {estYield > 0 ? (
                <MStat label="Est. Yield" value={`${estYield}% → ${inr(typeStats.current * estYield / 100, { compact: true })}/yr`} color="var(--primary)" />
              ) : (
                <MStat label="Return" value={`${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%`} color={pnl >= 0 ? "var(--success)" : "var(--danger)"} />
              )}
            </div>
            <div className="space-y-2">
              {typeHoldings.map(inv => {
                const invNum = num(inv.invested), cvNum = num(inv.currentValue), units = num(inv.units);
                // Resolve live price — try explicit symbol first, then resolve via type
                let key = inv.symbol && inv.type === "Stocks" ? `stock:${inv.symbol}` : inv.schemeCode && inv.type === "MutualFunds" ? `mf:${inv.schemeCode}` : null;
                let q = key ? quotes[key] : undefined;
                if (!q) {
                  const resolved = resolveLiveSymbol(inv.type, inv.symbol);
                  if (resolved) {
                    const resolvedKey = `${resolved.kind}:${resolved.yahooSymbol}`;
                    q = quotes[resolvedKey];
                    if (q) key = resolvedKey;
                  }
                }
                // For non-unit types (FD, PPF, etc.), live value = stored current value (updated manually)
                // For Gold/Silver/Crypto/REITs with units, use live price × units
                const hasLive = q?.ok && q.price > 0 && (units > 0 || !["Stocks", "MutualFunds"].includes(inv.type));
                const liveCurrent = (q?.ok && q.price > 0 && units > 0) ? q!.price * units : cvNum > 0 ? cvNum : invNum;
                const p = liveCurrent - invNum;
                const pp = invNum > 0 ? (p / invNum) * 100 : 0;
                const dayPct = q?.ok ? q.changePct : null;
                const hYield = EST_YIELD[inv.type] || 0;
                return (
                  <div key={inv.id} className="p-3 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-sm font-bold truncate" style={{ color: "var(--text-heading)" }}>{inv.name}</span>
                        {hasLive && <Badge tone="success">● Live</Badge>}
                        {!hasLive && (inv.symbol || inv.schemeCode) && <Badge tone="warning">⏳</Badge>}
                        {!hasLive && !inv.symbol && !inv.schemeCode && <Badge tone="primary">📋</Badge>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>{inr(liveCurrent, { compact: true })}</p>
                        <div className="flex items-center gap-2 justify-end">
                          {dayPct !== null && <span className="text-[11px]" style={{ color: dayPct >= 0 ? "var(--success)" : "var(--danger)" }}>{dayPct >= 0 ? "▲" : "▼"} {Math.abs(dayPct).toFixed(2)}%</span>}
                          <span className="text-[11px] font-bold" style={{ color: p >= 0 ? "var(--success)" : "var(--danger)" }}>{p >= 0 ? "+" : ""}{pp.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] flex-wrap" style={{ color: "var(--text-muted)" }}>
                      {inv.units && <span>Units: {inv.units}</span>}
                      {hasLive && q?.price && <span>Price: {inr(q.price)}</span>}
                      {q?.ok && q.cagr.y1 !== null && <span style={{ color: q.cagr.y1 >= 0 ? "var(--success)" : "var(--danger)" }}>1Y: {q.cagr.y1 >= 0 ? "+" : ""}{q.cagr.y1.toFixed(1)}%</span>}
                      {q?.ok && q.cagr.y3 !== null && <span style={{ color: q.cagr.y3 >= 0 ? "var(--success)" : "var(--danger)" }}>3Y: {q.cagr.y3 >= 0 ? "+" : ""}{q.cagr.y3.toFixed(1)}%</span>}
                      {hYield > 0 && <span>Yield: {hYield}% → {inr(liveCurrent * hYield / 100, { compact: true })}/yr</span>}
                      {inv.startDate && <span>Since: {new Date(inv.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>}
                    </div>
                    {/* Sell / Redeem button */}
                    {onSell && (Number(inv.units || 0) > 0 || num(inv.invested) > 0 || num(inv.currentValue) > 0) && (
                      <div className="mt-2 flex justify-end no-print">
                        <button onClick={() => onSell(inv)} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors" style={{ background: "var(--warning-soft)", color: "var(--warning)", border: "1px solid var(--warning)44" }} aria-label={`Sell ${inv.name}`}>📉 Sell / Redeem</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* Income estimate */}
      {stats.estIncome > 0 && (
        <Card title="💰 Est. Annual Income" subtitle="Dividends + interest from all holdings">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MStat label="Annual" value={inr(stats.estIncome, { compact: true })} color="var(--success)" big />
            <MStat label="Monthly" value={inr(stats.estIncome / 12, { compact: true })} big />
            <MStat label="Yield" value={`${stats.totalCurrent > 0 ? ((stats.estIncome / stats.totalCurrent) * 100).toFixed(1) : "0"}%`} color="var(--primary)" big />
          </div>
          <p className="text-[10px] mt-2 italic" style={{ color: "var(--text-faint)" }}>FD 7% · PPF 7.1% · EPF 8.5% · NPS 10% · Gold 9% · Bonds 7.5% · Stocks ~1.5% div · MF ~1% div</p>
        </Card>
      )}
    </div>
  );
}

function MStat({ label, value, color, big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <div className="p-3 rounded-xl text-center" style={{ background: "var(--surface-2)" }}>
      <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className={`font-extrabold mt-0.5 ${big ? "text-lg" : "text-sm"}`} style={{ color: color || "var(--text-heading)" }}>{value}</p>
    </div>
  );
}
