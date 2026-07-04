"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { LineChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import type { MarketQuote } from "@/lib/market";

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    ...accounts.map((a) => ({ name: a.name, type: a.type, value: num(a.balance), status: "Manual" })),
    ...liveInvestments.map((i) => ({ name: i.name, type: i.type, value: i.liveCurrentValue, status: i.liveOk ? `Live · ${i.liveAsOf || "now"}` : "Manual fallback" })),
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {loading ? "Syncing live investment values..." : updatedAt ? `Live net worth synced ${updatedAt}` : "Live net worth sync ready"} · {liveSynced}/{liveInvestments.length} investments live-linked
        </p>
        <button onClick={loadQuotes} disabled={loading} className="px-3 py-1.5 rounded-lg text-xs font-medium no-print" style={{ background: "var(--surface-3)", color: "var(--text)", opacity: loading ? 0.7 : 1 }}>
          🔄 Refresh sync
        </button>
      </div>

      {error && <div className="rounded-lg p-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Live Net Worth" value={inr(netWorth, { compact: true })} icon="💎" tone="primary" privacyMode="global" privacyKey="networth-total" />
        <KpiCard label="Live Assets" value={inr(totalAssets, { compact: true })} icon="📦" tone="success" privacyKey="networth-assets" />
        <KpiCard label="Liabilities" value={inr(liabilities, { compact: true })} icon="📉" tone="danger" privacyKey="networth-liabilities" />
        <KpiCard label="Growth" value={inr(growth, { compact: true })} icon="🚀" tone="accent" trend={{ dir: growth >= 0 ? "up" : "down", text: `${growthPct.toFixed(0)}%`, good: growth >= 0 }} privacyKey="networth-growth" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Monthly Income" value={inr(currentFlow.income, { compact: true })} icon="💰" tone="success" sub="Current month" />
        <KpiCard label="Monthly Expense" value={inr(currentFlow.expense, { compact: true })} icon="💸" tone="danger" sub="Current month" />
        <KpiCard 
          label="Monthly Savings" 
          value={inr(currentFlow.savings, { compact: true })} 
          icon="🏦" 
          tone={currentFlow.savings >= 0 ? "success" : "danger"} 
          sub="Income - Expense" 
        />
      </div>

      <Card title="Live Net Worth Trend" subtitle={`Latest movement: ${inr(monthlyGrowth, { compact: true })} · current live point appended`}>
        <LineChart
          labels={chartLabels}
          series={[
            { name: "Net Worth", values: chartNet, color: "#6366f1" },
            { name: "Assets", values: chartAssets, color: "#10b981" },
            { name: "Liabilities", values: chartLiab, color: "#ef4444" },
          ]}
          height={280}
        />
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Assets" subtitle={`${inr(totalAssets, { compact: true })} live total`} action={<Link href="/investments" className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Investments</Link>}>
          <Table headers={["Asset", "Type", "Value", "Status"]} right={[2]}>
            {assetRows.map((a, i) => (
              <Tr key={`${a.name}-${i}`}>
                <Td strong>{a.name}</Td>
                <Td><Badge tone="success">{a.type}</Badge></Td>
                <Td right strong>{inr(a.value, { compact: true })}</Td>
                <Td muted>{a.status}</Td>
              </Tr>
            ))}
          </Table>
        </Card>

        <Card title="Liabilities" subtitle={`${inr(liabilities, { compact: true })} total`} action={<Link href="/debt" className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>Loans</Link>}>
          <Table headers={["Liability", "Type", "Balance"]} right={[2]}>
            {debts.map((l) => (
              <Tr key={l.id}>
                <Td strong>{l.name}</Td>
                <Td><Badge tone="danger">{l.type}</Badge></Td>
                <Td right strong>{inr(num(l.outstanding), { compact: true })}</Td>
              </Tr>
            ))}
          </Table>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-between text-sm font-bold">
              <span style={{ color: "var(--text)" }}>Live Net Worth</span>
              <span style={{ color: "var(--primary)" }}>{inr(netWorth, { compact: true })}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
