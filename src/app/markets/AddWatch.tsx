"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { PRESET_INSTRUMENTS, type MarketQuote } from "@/lib/market";

const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none border";
type StockResult = { symbol: string; name: string; exchange: string; sector?: string };
type MfResult = { schemeCode: number; schemeName: string };

export function AddWatch() {
  const router = useRouter();
  const [tab, setTab] = useState<"stock" | "mf" | "presets">("stock");
  const style = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

  const [stockQ, setStockQ] = useState("");
  const [stockResults, setStockResults] = useState<StockResult[]>([]);
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualLabel, setManualLabel] = useState("");
  const [manualKind, setManualKind] = useState<MarketQuote["kind"]>("commodity");

  const [q, setQ] = useState("");
  const [results, setResults] = useState<MfResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [presetPrices, setPresetPrices] = useState<Record<string, MarketQuote>>({});
  const [presetLoading, setPresetLoading] = useState(false);

  // Load live prices for preset instruments
  useEffect(() => {
    if (tab !== "presets") return;
    let active = true;
    const allSymbols = PRESET_INSTRUMENTS.flatMap((cat) => cat.items);
    const loadPrices = async () => {
      setPresetLoading(true);
      const params = new URLSearchParams();
      const commodities = allSymbols.filter((s) => s.kind === "commodity").map((s) => s.symbol);
      const cryptos = allSymbols.filter((s) => s.kind === "crypto").map((s) => s.symbol);
      const indices = allSymbols.filter((s) => s.kind === "index").map((s) => s.symbol);
      const reits = allSymbols.filter((s) => s.kind === "reit").map((s) => s.symbol);
      const bonds = allSymbols.filter((s) => s.kind === "bond").map((s) => s.symbol);
      if (commodities.length) params.set("commodities", commodities.join(","));
      if (cryptos.length) params.set("crypto", cryptos.join(","));
      if (indices.length) params.set("indices", indices.join(","));
      if (reits.length) params.set("reits", reits.join(","));
      if (bonds.length) params.set("bonds", bonds.join(","));
      try {
        const res = await fetch(`/api/market/quote?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (active && data.quotes) setPresetPrices(data.quotes);
      } catch {
        // Keep empty
      }
      setPresetLoading(false);
    };
    void loadPrices();
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      void fetch(`/api/market/stock-search?q=${encodeURIComponent(stockQ)}`)
        .then((r) => r.json())
        .then((json) => active && setStockResults(json.results || []))
        .catch(() => active && setStockResults([]));
    }, 180);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [stockQ]);

  const addInstrument = async (payload: { kind: string; symbol?: string; schemeCode?: number | string; label: string }) => {
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Error adding instrument: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      alert("Failed to connect to server. Please check your internet.");
    }
  };

  const addManualStock = async () => {
    const symbol = manualSymbol.trim().toUpperCase();
    if (!symbol) return;
    await addInstrument({ kind: manualKind, symbol, label: manualLabel.trim() || symbol });
    setManualSymbol("");
    setManualLabel("");
  };

  const searchMf = async (val: string) => {
    setQ(val);
    if (val.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(val)}`);
      const json = await res.json();
      setResults(json.results || []);
    } catch {
      setResults([]);
    }
    setSearching(false);
  };

  const addMf = async (code: number, name: string) => {
    await addInstrument({ kind: "mf", schemeCode: code, label: name });
    setQ("");
    setResults([]);
  };

  function fmtPrice(price: number, currency?: string) {
    if (currency === "USD") return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    return `₹${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }

  return (
    <Card title="➕ Track New Instrument" subtitle="Search stocks, mutual funds, commodities, crypto, indices, REITs & bonds">
      <div className="flex gap-2 mb-4 no-print flex-wrap">
        {(["stock", "mf", "presets"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: tab === t ? "var(--primary)" : "var(--surface-3)", color: tab === t ? "#fff" : "var(--text-muted)" }}
          >
            {t === "stock" ? "📈 Stocks" : t === "mf" ? "🏦 MFs" : "🌍 Gold · Crypto · More"}
          </button>
        ))}
      </div>

      {tab === "stock" ? (
        <div className="space-y-4 no-print">
          <label className="text-xs font-medium block" style={{ color: "var(--text-muted)" }}>
            Search NSE / Indian stock dropdown
            <input
              className={`${inputCls} mt-1`}
              style={style}
              value={stockQ}
              onChange={(e) => setStockQ(e.target.value)}
              placeholder="Search Reliance, TCS, HDFC, Nifty, banking, auto..."
            />
          </label>
          <div className="max-h-72 overflow-y-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
            {stockResults.map((s) => (
              <button
                key={s.symbol}
                onClick={() => addInstrument({ kind: "stock", symbol: s.symbol, label: s.name })}
                className="w-full text-left px-3 py-2 text-sm border-b hover:opacity-80 flex items-center justify-between gap-3"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                <span className="min-w-0">
                  <span className="font-medium block truncate">{s.name}</span>
                  <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{s.symbol} · {s.exchange}{s.sector ? ` · ${s.sector}` : ""}</span>
                </span>
                <span className="text-xs shrink-0" style={{ color: "var(--primary)" }}>+ Add</span>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 items-end pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Manual Yahoo Symbol
              <input className={inputCls} style={style} value={manualSymbol} onChange={(e) => setManualSymbol(e.target.value)} placeholder="RELIANCE.NS or 500325.BO" />
            </label>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Display Name
              <input className={inputCls} style={style} value={manualLabel} onChange={(e) => setManualLabel(e.target.value)} placeholder="Optional" />
            </label>
            <button onClick={addManualStock} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>
              + Add Manual
            </button>
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
            Dropdown includes major Indian stocks/indices. For any other NSE/BSE symbol, use manual entry with Yahoo suffix: .NS for NSE and .BO for BSE.
          </p>
        </div>
      ) : tab === "mf" ? (
        <div className="no-print">
          <input className={inputCls} style={style} value={q} onChange={(e) => searchMf(e.target.value)} placeholder="Search funds… e.g. Parag Parikh, Nifty index, SBI bluechip" />
          {searching && <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>Searching…</p>}
          {results.length > 0 && (
            <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
              {results.map((r) => (
                <button key={r.schemeCode} onClick={() => addMf(r.schemeCode, r.schemeName)} className="w-full text-left px-3 py-2 text-sm border-b hover:opacity-80 flex items-center justify-between gap-3" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  <span className="min-w-0 truncate">{r.schemeName}</span>
                  <span className="text-xs shrink-0" style={{ color: "var(--primary)" }}>+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── PRESET INSTRUMENTS TAB ─── */
        <div className="space-y-6 no-print">
          {presetLoading && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading live prices…</p>
          )}

          {PRESET_INSTRUMENTS.map((cat) => (
            <div key={cat.category}>
              <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-heading)" }}>{cat.category}</h4>
              <div className="grid gap-2">
                {cat.items.map((item) => {
                  const quoteKey = `${item.kind}:${item.symbol}`;
                  const quote = presetPrices[quoteKey];
                  const price = quote?.ok ? fmtPrice(quote.price, quote.currency) : "—";
                  const change = quote?.ok ? quote.changePct : null;
                  return (
                    <button
                      key={item.symbol}
                      onClick={() => addInstrument({ kind: item.kind, symbol: item.symbol, label: item.name })}
                      className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:opacity-80 transition-opacity"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg">{item.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: "var(--text-heading)" }}>{item.name}</p>
                          <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{item.symbol} · {item.kind}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {quote?.ok ? (
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>{price}</p>
                            {change !== null && (
                              <p className="text-[11px] font-semibold" style={{ color: change >= 0 ? "var(--success)" : "var(--danger)" }}>
                                {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                              </p>
                            )}
                          </div>
                        ) : quote ? (
                          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>⏳</span>
                        ) : null}
                        <span className="text-xs font-semibold shrink-0" style={{ color: "var(--primary)" }}>+ Add</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Manual add for any Yahoo Finance symbol */}
          <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <h4 className="text-sm font-bold mb-2" style={{ color: "var(--text-heading)" }}>🔧 Add Custom Symbol</h4>
            <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>
              Enter any Yahoo Finance symbol. Examples: GC=F (Gold), BTC-USD (Bitcoin), ^NSEI (Nifty), EMBIREL.NS (REIT)
            </p>
            <div className="grid sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Type</label>
                <select
                  value={manualKind}
                  onChange={(e) => setManualKind(e.target.value as MarketQuote["kind"])}
                  className={inputCls}
                  style={style}
                >
                  <option value="commodity">🥇 Commodity</option>
                  <option value="crypto">₿ Crypto</option>
                  <option value="index">📊 Index</option>
                  <option value="reit">🏠 REIT</option>
                  <option value="bond">📜 Bond ETF</option>
                  <option value="stock">📈 Stock</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Symbol</label>
                <input className={inputCls} style={style} value={manualSymbol} onChange={(e) => setManualSymbol(e.target.value)} placeholder="BTC-USD or GOLDBEES.NS" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Display Name</label>
                <input className={inputCls} style={style} value={manualLabel} onChange={(e) => setManualLabel(e.target.value)} placeholder="Optional" />
              </div>
              <button onClick={addManualStock} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>
                + Add
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
