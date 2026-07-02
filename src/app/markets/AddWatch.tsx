"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none border";

export function AddWatch() {
  const router = useRouter();
  const [tab, setTab] = useState<"stock" | "mf">("stock");
  const style = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

  // stock state
  const [symbol, setSymbol] = useState("");
  const [stockLabel, setStockLabel] = useState("");

  // mf search state
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ schemeCode: number; schemeName: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const addStock = async () => {
    if (!symbol.trim()) return;
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "stock",
        symbol: symbol.trim().toUpperCase(),
        label: stockLabel.trim() || symbol.trim().toUpperCase(),
      }),
    });
    setSymbol("");
    setStockLabel("");
    router.refresh();
  };

  const search = async (val: string) => {
    setQ(val);
    if (val.length < 3) {
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
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "mf", schemeCode: code, label: name }),
    });
    setQ("");
    setResults([]);
    router.refresh();
  };

  return (
    <Card title="➕ Track New Instrument" subtitle="Add live stocks or mutual funds to your watchlist">
      <div className="flex gap-2 mb-4 no-print">
        {(["stock", "mf"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: tab === t ? "var(--primary)" : "var(--surface-3)",
              color: tab === t ? "#fff" : "var(--text-muted)",
            }}
          >
            {t === "stock" ? "NSE Stock" : "Mutual Fund"}
          </button>
        ))}
      </div>

      {tab === "stock" ? (
        <div className="grid sm:grid-cols-3 gap-3 items-end no-print">
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Yahoo Symbol
            <input
              className={inputCls}
              style={style}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="RELIANCE.NS"
            />
          </label>
          <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Display Name
            <input
              className={inputCls}
              style={style}
              value={stockLabel}
              onChange={(e) => setStockLabel(e.target.value)}
              placeholder="Reliance Industries"
            />
          </label>
          <button
            onClick={addStock}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--success)" }}
          >
            + Add Stock
          </button>
          <p className="sm:col-span-3 text-[11px]" style={{ color: "var(--text-faint)" }}>
            Tip: NSE stocks end with <code>.NS</code> (RELIANCE.NS, TCS.NS, INFY.NS). BSE uses <code>.BO</code>.
            Indices: <code>^NSEI</code> (Nifty 50), <code>^BSESN</code> (Sensex).
          </p>
        </div>
      ) : (
        <div className="no-print">
          <input
            className={inputCls}
            style={style}
            value={q}
            onChange={(e) => search(e.target.value)}
            placeholder="Search funds… e.g. Parag Parikh, Nifty index, SBI bluechip"
          />
          {searching && (
            <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>Searching…</p>
          )}
          {results.length > 0 && (
            <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
              {results.map((r) => (
                <button
                  key={r.schemeCode}
                  onClick={() => addMf(r.schemeCode, r.schemeName)}
                  className="w-full text-left px-3 py-2 text-sm border-b hover:opacity-80 flex items-center justify-between gap-3"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
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
