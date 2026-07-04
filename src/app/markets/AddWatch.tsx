"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none border";
type StockResult = { symbol: string; name: string; exchange: string; sector?: string };
type MfResult = { schemeCode: number; schemeName: string };

export function AddWatch() {
  const router = useRouter();
  const [tab, setTab] = useState<"stock" | "mf">("stock");
  const style = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

  const [stockQ, setStockQ] = useState("");
  const [stockResults, setStockResults] = useState<StockResult[]>([]);
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualLabel, setManualLabel] = useState("");

  const [q, setQ] = useState("");
  const [results, setResults] = useState<MfResult[]>([]);
  const [searching, setSearching] = useState(false);

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

  const addInstrument = async (payload: { kind: "stock" | "mf"; symbol?: string; schemeCode?: number | string; label: string }) => {
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) router.refresh();
  };

  const addManualStock = async () => {
    const symbol = manualSymbol.trim().toUpperCase();
    if (!symbol) return;
    await addInstrument({ kind: "stock", symbol, label: manualLabel.trim() || symbol });
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

  return (
    <Card title="➕ Track New Instrument" subtitle="Search Indian stocks and mutual funds, then add them to your live watchlist">
      <div className="flex gap-2 mb-4 no-print">
        {(["stock", "mf"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: tab === t ? "var(--primary)" : "var(--surface-3)", color: tab === t ? "#fff" : "var(--text-muted)" }}
          >
            {t === "stock" ? "Indian Stocks" : "Mutual Funds"}
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
      ) : (
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
      )}
    </Card>
  );
}
