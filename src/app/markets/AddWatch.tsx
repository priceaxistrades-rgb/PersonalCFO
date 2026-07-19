"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr } from "@/lib/format";
import { INDIAN_STOCKS } from "@/lib/indian-stocks";
import {
  IconPlus, IconMarkets, IconInvestments, IconSparkles, IconCheck
} from "@/components/ui/Icons";

const TABS = [
  { id: "stock", label: "Equities (NSE)", icon: IconMarkets },
  { id: "mf", label: "Mutual Funds", icon: IconInvestments },
  { id: "commodity", label: "Commodities & Crypto", icon: IconSparkles },
];

export function AddWatch() {
  const router = useRouter();
  const [tab, setTab] = useState("stock");
  const [query, setQuery] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customName, setCustomName] = useState("");
  const [customKind, setCustomKind] = useState("stock");
  const [busy, setBusy] = useState(false);
  const [mfResults, setMfResults] = useState<{ schemeCode: number; schemeName: string }[]>([]);
  const [mfSearching, setMfSearching] = useState(false);
  const [mfError, setMfError] = useState("");

  const searchFunds = useCallback(async (value: string) => {
    const term = value.trim();
    if (term.length < 2) { setMfResults([]); setMfError(""); return; }
    setMfSearching(true); setMfError("");
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(term)}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Search unavailable (HTTP ${res.status})`);
      const results = data?.results;
      if (!Array.isArray(results)) throw new Error("The fund-search service returned an invalid response.");
      setMfResults(results);
    } catch (error) {
      setMfResults([]);
      setMfError(error instanceof Error ? error.message : "Unable to search mutual funds. Please try again.");
    } finally { setMfSearching(false); }
  }, []);

  useEffect(() => {
    if (tab !== "mf") return;
    const timer = window.setTimeout(() => void searchFunds(query), 250);
    return () => window.clearTimeout(timer);
  }, [query, tab, searchFunds]);

  const add = async (symbol: string, name: string, kind: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, schemeCode: kind === "mf" ? symbol : null, label: name, name, kind }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Could not track item: ${typeof err.error === "string" ? err.error : JSON.stringify(err.error) || "Validation failed"}`);
        return;
      }
    } catch (e) {
      alert("Network error communicating with database server. Please check your connection.");
    } finally {
      setBusy(false);
      setQuery("");
      setCustomSymbol("");
      setCustomName("");
      router.refresh();
    }
  };

  const filteredStocks = INDIAN_STOCKS.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.symbol.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  return (
    <Card title="Track New Market Instrument" subtitle="Polled via Yahoo Finance API (Equities, Gold, Silver, Crypto, Indices, REITs) & AMFI mfapi.in (Mutual Funds)">
      <div className="flex gap-2 mb-4 p-1 rounded-2xl bg-surface-2 border border-white/[0.06] w-fit">
        {TABS.map((t) => {
          const IconComp = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                tab === t.id ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <IconComp size={15} /> <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "stock" && (
        <div className="space-y-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search NSE/BSE equities… E.g., Reliance, TCS, HDFC Bank, Infosys"
            className="input font-medium"
          />
          <div className="grid sm:grid-cols-2 gap-2.5">
            {filteredStocks.map((s) => (
              <div key={s.symbol} className="p-3 rounded-xl border border-white/[0.04] bg-surface-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{s.name}</p>
                  <p className="text-[10px] font-mono text-indigo-400 mt-0.5">{s.symbol} · {s.sector}</p>
                </div>
                <button
                  onClick={() => add(s.symbol, s.name, "stock")}
                  disabled={busy}
                  className="btn btn-primary px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 flex items-center gap-1"
                >
                  <IconPlus size={13} /> <span>Track</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "mf" && (
        <div className="space-y-4">
          <input
            value={query}
            onChange={(e) => { const value = e.target.value; setQuery(value); void searchFunds(value); }}
            placeholder="Search mutual funds by name… e.g. Parag, HDFC, SBI"
            className="input font-medium"
          />
          <div className="rounded-xl border border-white/[0.06] bg-surface-2 overflow-hidden">
            {mfSearching && <p className="p-4 text-center text-xs text-slate-400">Searching AMFI mutual funds…</p>}
            {mfError && <p className="p-4 text-center text-xs text-red-400">Fund search error: {mfError}</p>}
            {!mfSearching && !mfError && query.trim().length >= 2 && mfResults.length === 0 && <p className="p-4 text-center text-xs text-slate-400">No matching fund found. Try a different name or use the 6-digit AMFI scheme code.</p>}
            {mfResults.map((fund) => (
              <div key={fund.schemeCode} className="p-3 border-b border-white/[0.06] last:border-0 flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="text-xs font-bold text-white truncate">{fund.schemeName}</p><p className="text-[10px] font-mono text-indigo-400 mt-0.5">AMFI Scheme Code: {fund.schemeCode}</p></div>
                <button onClick={() => add(String(fund.schemeCode), fund.schemeName, "mf")} disabled={busy} className="btn btn-primary px-3 py-1.5 text-xs font-bold rounded-lg shrink-0"><IconPlus size={13} /> Track</button>
              </div>
            ))}
            {query.trim().length < 2 && <p className="p-4 text-center text-xs text-slate-400">Type at least two letters, such as “Parag”, “HDFC”, or “SBI”, to search AMFI fund names.</p>}
          </div>
          {/^\d{6}$/.test(query.trim()) && (
            <button onClick={() => add(query.trim(), `Mutual Fund (${query.trim()})`, "mf")} disabled={busy} className="btn btn-secondary px-4 py-2 text-xs font-bold rounded-xl">Track scheme code {query.trim()}</button>
          )}
        </div>
      )}

      {tab === "commodity" && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { symbol: "GC=F", name: "Gold Futures", kind: "commodity" },
              { symbol: "SI=F", name: "Silver Futures", kind: "commodity" },
              { symbol: "BTC-USD", name: "Bitcoin (BTC)", kind: "crypto" },
              { symbol: "ETH-USD", name: "Ethereum (ETH)", kind: "crypto" },
              { symbol: "^NSEI", name: "Nifty 50 Index", kind: "index" },
              { symbol: "^BSESN", name: "BSE Sensex", kind: "index" },
            ].map((c) => (
              <div key={c.symbol} className="p-3.5 rounded-xl border border-white/[0.04] bg-surface-2 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{c.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{c.symbol}</p>
                </div>
                <button
                  onClick={() => add(c.symbol, c.name, c.kind)}
                  disabled={busy}
                  className="btn btn-secondary px-3 py-1.5 text-xs font-bold rounded-lg mt-3 w-full border border-white/[0.08]"
                >
                  + Add to Watchlist
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-white/[0.08] space-y-3">
        <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-indigo-400">Custom Ticker Input</h4>
        <div className="grid sm:grid-cols-4 gap-3">
          <input
            value={customSymbol}
            onChange={(e) => setCustomSymbol(e.target.value)}
            placeholder="Ticker (e.g. INFY.NS)"
            className="input font-mono text-xs"
          />
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Instrument label"
            className="input font-medium text-xs"
          />
          <select value={customKind} onChange={(e) => setCustomKind(e.target.value)} className="input font-medium text-xs">
            <option value="stock">Equity Stock</option>
            <option value="mf">Mutual Fund</option>
            <option value="commodity">Commodity</option>
            <option value="crypto">Crypto Asset</option>
            <option value="index">Market Index</option>
            <option value="reit">REIT</option>
            <option value="bond">Bond ETF</option>
          </select>
          <button
            onClick={() => customSymbol.trim() && customName.trim() && add(customSymbol.trim(), customName.trim(), customKind)}
            disabled={busy || !customSymbol.trim() || !customName.trim()}
            className="btn btn-primary px-4 py-2 text-xs font-bold rounded-xl"
          >
            + Register Ticker
          </button>
        </div>
      </div>
    </Card>
  );
}
