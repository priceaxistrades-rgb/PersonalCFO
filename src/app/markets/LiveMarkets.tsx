"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
};

function fmtNum(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function Cagr({ v }: { v: number | null }) {
  if (v === null || v === undefined)
    return <span style={{ color: "var(--text-faint)" }}>—</span>;
  return (
    <span style={{ color: v >= 0 ? "var(--success)" : "var(--danger)" }}>
      {v >= 0 ? "+" : ""}
      {v.toFixed(1)}%
    </span>
  );
}

export function LiveMarkets({ items }: { items: WatchItem[] }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<string>("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stocks = items.filter((i) => i.kind === "stock" && i.symbol).map((i) => i.symbol!);
  const mfs = items.filter((i) => i.kind === "mf" && i.schemeCode).map((i) => i.schemeCode!);

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
      const res = await fetch(`/api/market/quote?${params.toString()}`);
      const json = await res.json();
      setQuotes(json.quotes || {});
      setUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch {
      /* ignore */
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, stocks.join(","), mfs.join(",")]);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 60000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  const remove = async (id: number) => {
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
      return (
        <Tr key={it.id}>
          <Td strong>
            {it.label}
            {q?.extra && (
              <span className="block text-[10px]" style={{ color: "var(--text-faint)" }}>
                {q.extra}
              </span>
            )}
          </Td>
          <Td right strong>
            {q?.ok ? fmtNum(q.price, q.currency) : q ? "—" : "…"}
          </Td>
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
            <button
              onClick={() => remove(it.id)}
              className="text-xs no-print px-2 py-1 rounded-lg"
              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
            >
              ✕
            </button>
          </Td>
        </Tr>
      );
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
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
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {loading ? "Fetching live prices…" : `Live · updated ${updated}`}
          </span>
        </div>
        <button
          onClick={load}
          className="text-xs font-medium no-print px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
          style={{ background: "var(--surface-3)", color: "var(--text)" }}
        >
          🔄 Refresh
        </button>
      </div>

      <Card title="📈 Live Stocks (NSE)" subtitle="Prices via Yahoo Finance · auto-refresh 60s">
        {stockItems.length ? (
          <Table
            headers={["Stock", "Price", "Day", "1Y CAGR", "3Y CAGR", "5Y CAGR", ""]}
            right={[1, 2, 3, 4, 5, 6]}
          >
            {renderRows(stockItems)}
          </Table>
        ) : (
          <p className="text-sm py-6 text-center" style={{ color: "var(--text-faint)" }}>
            No stocks tracked. Add one below (e.g. RELIANCE.NS, TCS.NS).
          </p>
        )}
      </Card>

      <Card title="🏦 Live Mutual Funds" subtitle="NAV via AMFI / mfapi.in · daily">
        {mfItems.length ? (
          <Table
            headers={["Fund", "NAV", "Day", "1Y CAGR", "3Y CAGR", "5Y CAGR", ""]}
            right={[1, 2, 3, 4, 5, 6]}
          >
            {renderRows(mfItems)}
          </Table>
        ) : (
          <p className="text-sm py-6 text-center" style={{ color: "var(--text-faint)" }}>
            No mutual funds tracked. Search & add one below.
          </p>
        )}
      </Card>
    </div>
  );
}
