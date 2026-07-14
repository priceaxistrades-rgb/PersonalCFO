"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { AccessibleModal } from "@/components/AccessibleModal";
import { inr } from "@/lib/format";
import type { InvestmentRow, AccountOption, SellFormState, InvestmentFormData, InvestmentInitialData } from "@/lib/types";
import { resolveLiveSymbol, type MarketQuote } from "@/lib/market";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };
export const TYPES = ["Stocks", "MutualFunds", "PPF", "EPF", "NPS", "FD", "RD", "Gold", "Silver", "Bonds", "Crypto", "RealEstate", "Other"];

/**
 * Build a clean API payload from the form state.
 * Strips extra fields (avgPrice, kind, price) that Zod strict mode would reject.
 * Uses toFixed() for monetary values to avoid floating-point string artifacts.
 */
function buildPayload(form: InvestmentFormData): Record<string, unknown> {
  const invested = Number(form.invested) || 0;
  const currentValue = Number(form.currentValue) || 0;
  const annualReturn = Number(form.annualReturn) || 0;
  const units = form.units ? Number(form.units) : null;

  return {
    name: form.name,
    type: form.type,
    invested: invested.toFixed(2),
    currentValue: currentValue.toFixed(2),
    annualReturn: annualReturn.toFixed(2),
    symbol: form.symbol || null,
    schemeCode: form.schemeCode || null,
    units: units !== null ? units.toString() : null,
    startDate: form.startDate || null,
    memberId: form.memberId ?? null,
  };
}

export function InvestmentForm({
  editingInvestment,
  initialData,
  onSave,
  onCancel,
  existingInvestments,
}: {
  editingInvestment: InvestmentRow | null;
  initialData?: InvestmentInitialData;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  /** Pass the full investment list so the "Add More" flow can find existing holdings */
  existingInvestments?: InvestmentRow[];
}) {
  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState<{ symbol: string; name: string; exchange: string; sector?: string }[]>([]);
  const [mfQuery, setMfQuery] = useState("");
  const [mfResults, setMfResults] = useState<{ schemeCode: number; schemeName: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState<InvestmentFormData>({
    name: "",
    type: "Stocks",
    avgPrice: 0,
    invested: 0,
    currentValue: 0,
    annualReturn: 0,
    symbol: "",
    schemeCode: "",
    units: "",
    startDate: "",
  });

  const livePrice = initialData?.price || 0;

  // ─── Price Mode: "live" (use today's price) vs "manual" (enter avg price) ───
  const [priceMode, setPriceMode] = useState<"live" | "manual">(livePrice > 0 ? "live" : "manual");
  const [fetchedLivePrice, setFetchedLivePrice] = useState<number>(livePrice);
  const [livePriceLoading, setLivePriceLoading] = useState(false);

  // Auto-fetch live price when symbol or type changes (for new investments)
  useEffect(() => {
    if (editingInvestment) return; // editing mode uses existing data
    const symbol = form.symbol;
    const type = form.type;
    if (!symbol && !["Gold", "Silver", "Crypto", "RealEstate", "Bonds"].includes(type)) {
      const clearTimer = window.setTimeout(() => setFetchedLivePrice(0), 0);
      return () => window.clearTimeout(clearTimer);
    }
    let active = true;
    const fetchPrice = async () => {
      setLivePriceLoading(true);
      try {
        const params = new URLSearchParams();
        if (symbol && type === "Stocks") params.set("stocks", symbol);
        else if (type === "MutualFunds" && form.schemeCode) params.set("mf", form.schemeCode);
        else {
          const resolved = resolveLiveSymbol(type, symbol || null);
          if (resolved) {
            if (resolved.kind === "commodity") params.set("commodities", resolved.yahooSymbol);
            else if (resolved.kind === "crypto") params.set("crypto", resolved.yahooSymbol);
            else if (resolved.kind === "index") params.set("indices", resolved.yahooSymbol);
            else if (resolved.kind === "reit") params.set("reits", resolved.yahooSymbol);
            else if (resolved.kind === "bond") params.set("bonds", resolved.yahooSymbol);
            else params.set("stocks", resolved.yahooSymbol);
          }
        }
        if (!params.toString()) {
          window.setTimeout(() => setLivePriceLoading(false), 0);
          return;
        }
        const res = await fetch(`/api/market/quote?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (active && data.quotes) {
          const quote: MarketQuote | undefined = Object.values(data.quotes)[0] as MarketQuote | undefined;
          if (quote?.ok) setFetchedLivePrice(quote.price);
        }
      } catch { /* keep previous */ }
      if (active) setLivePriceLoading(false);
    };
    const timer = setTimeout(() => void fetchPrice(), 300);
    return () => { active = false; clearTimeout(timer); };
  }, [form.symbol, form.type, form.schemeCode, editingInvestment]);

  // Effective live price — either from initialData or auto-fetched
  const effectiveLivePrice = fetchedLivePrice > 0 ? fetchedLivePrice : livePrice;

  // When priceMode changes to "live", auto-fill avgPrice with live price
  useEffect(() => {
    if (priceMode !== "live" || effectiveLivePrice <= 0 || editingInvestment) return;
    const timer = window.setTimeout(() => {
      setForm((prev) => {
        const invested = Number((Number(prev.units || 0) * effectiveLivePrice).toFixed(2));
        const currentValue = invested; // at buy time, invested ≈ current
        return { ...prev, avgPrice: effectiveLivePrice, invested, currentValue };
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [priceMode, effectiveLivePrice, editingInvestment]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (editingInvestment) {
        const units = Number(editingInvestment.units) || 0;
        const invested = Number(editingInvestment.invested) || 0;
        const avgPrice = units > 0 ? invested / units : 0;
        setForm({
          name: editingInvestment.name,
          type: editingInvestment.type,
          avgPrice: Math.round(avgPrice * 100) / 100,
          invested,
          currentValue: Number(editingInvestment.currentValue),
          annualReturn: Number(editingInvestment.annualReturn),
          symbol: editingInvestment.symbol || "",
          schemeCode: editingInvestment.schemeCode || "",
          units: editingInvestment.units || "",
          startDate: editingInvestment.startDate || "",
        });
        setStockQuery(editingInvestment.symbol || "");
        setMfQuery(editingInvestment.schemeCode || "");
      } else if (initialData) {
        const iType = initialData.type || (initialData.schemeCode ? "MutualFunds" : "Stocks");
        setForm({
          name: initialData.name || "",
          type: iType,
          avgPrice: 0,
          invested: 0,
          currentValue: 0,
          annualReturn: 0,
          symbol: initialData.symbol || "",
          schemeCode: initialData.schemeCode || "",
          units: "",
          startDate: "",
        });
        setStockQuery(initialData.symbol || "");
        setMfQuery(initialData.schemeCode || "");
      } else {
        setForm({ name: "", type: "Stocks", avgPrice: 0, invested: 0, currentValue: 0, annualReturn: 0, symbol: "", schemeCode: "", units: "", startDate: "" });
        setStockQuery("");
        setMfQuery("");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [editingInvestment, initialData]);

  const recalcFromUnits = (units: string, avgPrice: number) => {
    const u = Number(units) || 0;
    const effectiveAvg = priceMode === "live" && effectiveLivePrice > 0 ? effectiveLivePrice : avgPrice;
    const invested = Number((u * effectiveAvg).toFixed(2));
    const currentValue = effectiveLivePrice > 0 ? Number((u * effectiveLivePrice).toFixed(2)) : invested;
    return { invested, currentValue };
  };

  const handleUnitsChange = (units: string) => {
    const { invested, currentValue } = recalcFromUnits(units, form.avgPrice);
    setForm((prev) => ({ ...prev, units, invested, currentValue }));
  };

  const handleAvgPriceChange = (avgPrice: number) => {
    const { invested, currentValue } = recalcFromUnits(form.units, avgPrice);
    setForm((prev) => ({ ...prev, avgPrice, invested, currentValue }));
  };

  useEffect(() => {
    if (form.type !== "Stocks") return;
    const q = stockQuery.trim();
    if (!q) {
      const clearTimer = window.setTimeout(() => setStockResults([]), 0);
      return () => window.clearTimeout(clearTimer);
    }
    let active = true;
    const timer = setTimeout(() => {
      setSearching(true);
      void fetch(`/api/market/stock-search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => { if (active) setStockResults(data.results || []); })
        .catch(() => { if (active) setStockResults([]); })
        .finally(() => { if (active) setSearching(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [stockQuery, form.type]);

  useEffect(() => {
    if (form.type !== "MutualFunds") return;
    const q = mfQuery.trim();
    if (q.length < 2) {
      const clearTimer = window.setTimeout(() => setMfResults([]), 0);
      return () => window.clearTimeout(clearTimer);
    }
    let active = true;
    const timer = setTimeout(() => {
      setSearching(true);
      void fetch(`/api/market/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => { if (active) setMfResults(data.results || []); })
        .catch(() => { if (active) setMfResults([]); })
        .finally(() => { if (active) setSearching(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [mfQuery, form.type]);

  const chooseStock = (stock: { symbol: string; name: string; exchange: string; sector?: string }) => {
    setForm({ ...form, type: "Stocks", symbol: stock.symbol, schemeCode: "", name: form.name || stock.name });
    setStockQuery(`${stock.symbol} · ${stock.name}`);
    setStockResults([]);
  };

  const chooseMf = (fund: { schemeCode: number; schemeName: string }) => {
    setForm({ ...form, type: "MutualFunds", schemeCode: String(fund.schemeCode), symbol: "", name: form.name || fund.schemeName });
    setMfQuery(`${fund.schemeCode} · ${fund.schemeName}`);
    setMfResults([]);
  };

  const hasLivePrice = effectiveLivePrice > 0;

  const handleSave = () => {
    const finalForm = { ...form };
    const u = Number(finalForm.units) || 0;

    // In "live" mode, force avgPrice to the live price
    if (priceMode === "live" && effectiveLivePrice > 0) {
      finalForm.avgPrice = effectiveLivePrice;
      if (u > 0) {
        finalForm.invested = Number((u * effectiveLivePrice).toFixed(2));
        finalForm.currentValue = Number((u * effectiveLivePrice).toFixed(2));
      }
    }

    if (u > 0 && Number(finalForm.invested) <= 0) {
      const effectiveAvgPrice = finalForm.avgPrice > 0 ? finalForm.avgPrice : effectiveLivePrice;
      if (effectiveAvgPrice > 0) {
        finalForm.invested = Number((u * effectiveAvgPrice).toFixed(2));
        finalForm.currentValue = effectiveLivePrice > 0 ? Number((u * effectiveLivePrice).toFixed(2)) : finalForm.invested;
      }
    }

    // ─── Add More Units flow: merge with existing holding ───
    if (!editingInvestment && existingInvestments && u > 0) {
      const existing = existingInvestments.find((inv) => {
        if (finalForm.symbol && inv.symbol === finalForm.symbol) return true;
        if (finalForm.schemeCode && inv.schemeCode === finalForm.schemeCode) return true;
        if (finalForm.name && inv.name === finalForm.name && inv.type === finalForm.type) return true;
        return false;
      });
      if (existing) {
        const existingUnits = Number(existing.units) || 0;
        const existingInvested = Number(existing.invested) || 0;
        const newUnitsTotal = existingUnits + u;
        const newInvestedTotal = existingInvested + Number(finalForm.invested);
        const newAvgPrice = newUnitsTotal > 0 ? newInvestedTotal / newUnitsTotal : 0;
        const newCurrentValue = effectiveLivePrice > 0 && newUnitsTotal > 0
          ? Number((effectiveLivePrice * newUnitsTotal).toFixed(2))
          : newInvestedTotal;

        const payload = buildPayload({
          ...finalForm,
          units: String(newUnitsTotal),
          avgPrice: Number(newAvgPrice.toFixed(4)),
          invested: Number(newInvestedTotal.toFixed(2)),
          currentValue: newCurrentValue,
        });
        (payload as any).id = existing.id;
        // Also preserve existing symbol/schemeCode
        if (existing.symbol) payload.symbol = existing.symbol;
        if (existing.schemeCode) payload.schemeCode = existing.schemeCode;
        if (existing.name) payload.name = existing.name;
        void onSave(payload);
        return;
      }
    }

    const payload = buildPayload(finalForm);
    if (editingInvestment) {
      (payload as any).id = editingInvestment.id;
    }
    void onSave(payload);
  };

  return (
    <div className="card p-5 space-y-4 fade-in-up" role="form" aria-label="Investment form">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-name">Holding Name</label>
          <input id="inv-name" placeholder="e.g. Reliance Industries" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-type">Category</label>
          <select id="inv-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, symbol: "", schemeCode: "" })} className="input">
            {TYPES.map((t) => (<option key={t}>{t}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-units">Units / Quantity</label>
          <input id="inv-units" type="number" placeholder="e.g. 10" value={form.units} onChange={(e) => handleUnitsChange(e.target.value)} className="input" autoFocus={!editingInvestment && !!initialData} />
        </div>
      </div>

      {/* ═══ Price Mode Toggle: Today's Live Price vs Manual ═══ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Buy Price</span>
          {(effectiveLivePrice > 0 || livePriceLoading) && (
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <button
                onClick={() => setPriceMode("live")}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: priceMode === "live" ? "var(--success)" : "var(--surface-3)",
                  color: priceMode === "live" ? "#fff" : "var(--text-muted)",
                }}
              >
                📡 Today&apos;s Price
              </button>
              <button
                onClick={() => setPriceMode("manual")}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: priceMode === "manual" ? "var(--primary)" : "var(--surface-3)",
                  color: priceMode === "manual" ? "#fff" : "var(--text-muted)",
                }}
              >
                ✏️ Manual
              </button>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Left: Price input (changes based on mode) */}
          <div>
            {priceMode === "live" && effectiveLivePrice > 0 ? (
              <>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--success)" }} htmlFor="inv-live-price">
                  Today&apos;s Price (₹ per unit)
                </label>
                <div className="input flex items-center gap-2" style={{ background: "var(--success-soft)", color: "var(--success)", fontWeight: 700 }}>
                  ₹{effectiveLivePrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })} per unit
                  {livePriceLoading && <span className="animate-pulse">⏳</span>}
                  <span className="text-[9px] font-normal opacity-70">AUTO</span>
                </div>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                  Invested = today&apos;s price × units
                  {form.units ? ` = ₹${(Number(form.units) * effectiveLivePrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : ""}
                </p>
              </>
            ) : (
              <>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-avg-price">Average Buy Price (₹ per unit)</label>
                <input id="inv-avg-price" type="number" step="0.01" placeholder="e.g. 2450.50" value={form.avgPrice || ""} onChange={(e) => handleAvgPriceChange(Number(e.target.value))} className="input" />
                <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                  Invested = avg price × units
                  {form.units && form.avgPrice ? ` = ₹${(Number(form.units) * form.avgPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : ""}
                </p>
              </>
            )}
          </div>

          {/* Right: Live price reference */}
          {effectiveLivePrice > 0 && priceMode === "manual" && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Live Price (reference)</label>
              <div className="input" style={{ background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 700 }}>
                ₹{effectiveLivePrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })} per unit
                {livePriceLoading && <span className="animate-pulse ml-1">⏳</span>}
              </div>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                Current value = live price × units
                {form.units ? ` = ₹${(Number(form.units) * effectiveLivePrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : ""}
              </p>
            </div>
          )}
          {effectiveLivePrice > 0 && priceMode === "live" && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Current Value</label>
              <div className="input" style={{ background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 700 }}>
                {form.units ? `₹${(Number(form.units) * effectiveLivePrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "Enter units to calculate"}
              </div>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                Auto-calculated from today&apos;s live price
              </p>
            </div>
          )}
        </div>

        {Number(form.units) > 0 && form.avgPrice <= 0 && priceMode === "manual" && (
          <div className="p-2.5 rounded-lg text-xs font-medium" style={{ background: "var(--warning-soft)", color: "var(--warning)", border: "1px solid var(--warning)" }} role="alert">
            ⚠️ Enter average buy price to track invested amount & P&L. Or switch to &quot;📡 Today&apos;s Price&quot; to auto-fill from live market data.
          </div>
        )}
      </div>

      {/* Stock / MF search */}
      {form.type === "Stocks" && (
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-stock-search">Link to Stock</label>
          <input id="inv-stock-search" placeholder="Search e.g. Reliance, TCS, HDFC" value={stockQuery} onChange={(e) => { setStockQuery(e.target.value); setForm({ ...form, symbol: e.target.value.toUpperCase() }); }} className="input" aria-describedby="stock-results-desc" />
          <span id="stock-results-desc" className="sr-only">{stockResults.length > 0 ? `${stockResults.length} results found` : "No results"}</span>
          {stockResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }} role="listbox" aria-label="Stock search results">
              {stockResults.map((s) => (
                <button key={s.symbol} onClick={() => chooseStock(s)} className="w-full text-left px-3 py-2.5 border-b text-sm hover:opacity-80 transition-opacity" style={{ borderColor: "var(--border)", color: "var(--text)" }} role="option" aria-selected="false" aria-label={`${s.name} (${s.symbol})`}>
                  <span className="font-medium">{s.name}</span>
                  <span className="block text-[11px]" style={{ color: "var(--text-faint)" }}>{s.symbol} · {s.exchange}{s.sector ? ` · ${s.sector}` : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {form.type === "MutualFunds" && (
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-mf-search">Link to Mutual Fund</label>
          <input id="inv-mf-search" placeholder="Search e.g. Parag Parikh, Nifty Index" value={mfQuery} onChange={(e) => { setMfQuery(e.target.value); setForm({ ...form, schemeCode: e.target.value }); }} className="input" />
          {mfResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }} role="listbox" aria-label="Mutual fund search results">
              {mfResults.map((m) => (
                <button key={m.schemeCode} onClick={() => chooseMf(m)} className="w-full text-left px-3 py-2.5 border-b text-sm hover:opacity-80 transition-opacity" style={{ borderColor: "var(--border)", color: "var(--text)" }} role="option" aria-selected="false" aria-label={m.schemeName}>
                  <span className="font-medium">{m.schemeName}</span>
                  <span className="block text-[11px]" style={{ color: "var(--text-faint)" }}>Scheme Code: {m.schemeCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {searching && <p className="text-xs" style={{ color: "var(--text-muted)" }} aria-live="polite">Searching live instruments...</p>}

      {/* Live tracker info for Gold, Silver, Crypto, RealEstate, Bonds */}
      {["Gold", "Silver", "Crypto", "RealEstate", "Bonds"].includes(form.type) && (
        <div className="p-3 rounded-lg" style={{ background: "var(--primary-soft)", border: "1px solid var(--border-accent)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
            📡 Live Price Tracking Available
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
            {form.type === "Gold" && "Gold ETF (GOLDBEES.NS) price will auto-sync. Enter units to track live P&L. Or enter a custom symbol like GC=F for Gold Futures (USD)."}
            {form.type === "Silver" && "Silver ETF (SILVERBEES.NS) price will auto-sync. Enter units to track live P&L. Or enter a custom symbol like SI=F for Silver Futures (USD)."}
            {form.type === "Crypto" && "Enter the crypto symbol (e.g. BTC-USD for Bitcoin, ETH-USD for Ethereum) in the Stock Symbol field to get live prices. Enter units to track live P&L."}
            {form.type === "RealEstate" && "REIT prices will auto-sync. Enter units to track live P&L. You can also enter a custom REIT symbol like EMBIREL.NS."}
            {form.type === "Bonds" && "Bond ETF prices will auto-sync. Enter units to track live P&L. You can also enter a custom symbol like GILT10YBEES.NS."}
          </p>
          <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--warning)" }}>
            💡 Enter units + invested amount for accurate live P&L tracking across all dashboards.
          </p>
        </div>
      )}

      {/* Computed values preview */}
      {(form.units && (form.avgPrice || hasLivePrice)) && (
        <div className="grid sm:grid-cols-3 gap-3 p-3 rounded-lg" style={{ background: "var(--surface-2)" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Invested</p>
            <p className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>₹{form.invested.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Current Value</p>
            <p className="text-sm font-bold" style={{ color: "var(--success)" }}>₹{form.currentValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>P&L</p>
            <p className="text-sm font-bold" style={{ color: form.currentValue >= form.invested ? "var(--success)" : "var(--danger)" }}>
              {form.invested > 0 ? `${(((form.currentValue - form.invested) / form.invested) * 100).toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Manual overrides (collapsed) */}
      <details className="group">
        <summary className="text-[11px] font-semibold cursor-pointer" style={{ color: "var(--text-faint)" }}>⚙️ Advanced: Override values & set dates</summary>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-override-invested">Override Invested (₹)</label>
            <input id="inv-override-invested" type="number" value={form.invested} onChange={(e) => setForm({ ...form, invested: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-override-current">Override Current Value (₹)</label>
            <input id="inv-override-current" type="number" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-return">Annual Return %</label>
            <input id="inv-return" type="number" step="0.01" value={form.annualReturn} onChange={(e) => setForm({ ...form, annualReturn: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-date">Purchase Date</label>
            <input id="inv-date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-symbol">Stock Symbol</label>
            <input id="inv-symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="inv-scheme">MF Scheme Code</label>
            <input id="inv-scheme" value={form.schemeCode} onChange={(e) => setForm({ ...form, schemeCode: e.target.value })} className="input" />
          </div>
        </div>
      </details>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} className="btn btn-success px-5 py-2.5">Save Investment</button>
        <button onClick={onCancel} className="btn btn-secondary px-5 py-2.5">Cancel</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADD MORE UNITS MODAL — Quick top-up for existing holdings
   Fetches live price, auto-averages with existing holding
   ═══════════════════════════════════════════════════════════════ */

export function AddMoreUnitsModal({
  investment,
  livePrice,
  onClose,
  onAdded,
}: {
  investment: InvestmentRow;
  livePrice: number | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceMode, setPriceMode] = useState<"live" | "manual">(livePrice && livePrice > 0 ? "live" : "manual");
  const [newUnits, setNewUnits] = useState("");
  const [buyPrice, setBuyPrice] = useState(livePrice || 0);

  const existingUnits = Number(investment.units) || 0;
  const existingInvested = Number(investment.invested) || 0;
  const existingAvg = existingUnits > 0 ? existingInvested / existingUnits : 0;
  const effectiveBuyPrice = priceMode === "live" && livePrice ? livePrice : buyPrice;
  const newInvested = Number(newUnits || 0) * effectiveBuyPrice;
  const totalUnits = existingUnits + Number(newUnits || 0);
  const totalInvested = existingInvested + newInvested;
  const newAvg = totalUnits > 0 ? totalInvested / totalUnits : 0;
  const newCurrentValue = livePrice && livePrice > 0 && totalUnits > 0
    ? livePrice * totalUnits
    : totalInvested;

  const handleAdd = async () => {
    const units = Number(newUnits);
    if (!units || units <= 0) { setError("Enter units to add"); return; }
    if (effectiveBuyPrice <= 0) { setError("Enter buy price"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/manage/investments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: investment.id,
          units: totalUnits.toFixed(4),
          invested: totalInvested.toFixed(2),
          currentValue: newCurrentValue.toFixed(2),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to update investment");
      }
      onAdded();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add units");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessibleModal isOpen={true} onClose={onClose} title="Add More Units" size="md">
      <div className="flex justify-between items-center mb-5">
        <h3 id="modal-title" className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-heading)" }}>
          <span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: "linear-gradient(135deg, var(--primary), var(--success))" }} aria-hidden="true">📈</span>
          Add More Units
        </h3>
        <button onClick={onClose} className="btn btn-ghost w-8 h-8 rounded-full text-xs" aria-label="Close">✕</button>
      </div>

      {/* Existing holding info */}
      <div className="p-3 rounded-lg mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <p className="font-semibold" style={{ color: "var(--text-heading)" }}>{investment.name}</p>
        <div className="flex gap-3 mt-1 flex-wrap text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span>📊 {existingUnits} units held</span>
          <span>💰 Avg ₹{existingAvg.toFixed(2)}/unit</span>
          <span>💼 Invested ₹{existingInvested.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }} role="alert">{error}</div>}

      <div className="space-y-4">
        {/* Units input */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="add-more-units">New Units to Add</label>
          <input id="add-more-units" type="number" step="0.0001" placeholder="e.g. 5" value={newUnits} onChange={(e) => setNewUnits(e.target.value)} className="input" autoFocus />
        </div>

        {/* Price mode toggle */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Buy Price</span>
            {livePrice && livePrice > 0 && (
              <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <button onClick={() => setPriceMode("live")} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: priceMode === "live" ? "var(--success)" : "var(--surface-3)", color: priceMode === "live" ? "#fff" : "var(--text-muted)" }}>
                  📡 Today&apos;s Price
                </button>
                <button onClick={() => setPriceMode("manual")} className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: priceMode === "manual" ? "var(--primary)" : "var(--surface-3)", color: priceMode === "manual" ? "#fff" : "var(--text-muted)" }}>
                  ✏️ Manual
                </button>
              </div>
            )}
          </div>

          {priceMode === "live" && livePrice ? (
            <div className="input" style={{ background: "var(--success-soft)", color: "var(--success)", fontWeight: 700 }}>
              ₹{livePrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })} per unit <span className="text-[9px] font-normal opacity-70">LIVE</span>
            </div>
          ) : (
            <div>
              <input type="number" step="0.01" placeholder="Enter buy price per unit" value={buyPrice || ""} onChange={(e) => setBuyPrice(Number(e.target.value))} className="input" />
            </div>
          )}
        </div>

        {/* Auto-averaged summary */}
        {Number(newUnits) > 0 && effectiveBuyPrice > 0 && (
          <div className="p-3 rounded-lg" style={{ background: "var(--primary-soft)", border: "1px solid var(--border-accent)" }} role="status">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>New Investment</p>
                <p className="font-bold" style={{ color: "var(--text-heading)" }}>₹{newInvested.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{newUnits} units × ₹{effectiveBuyPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>New Average</p>
                <p className="font-bold" style={{ color: "var(--primary)" }}>₹{newAvg.toFixed(2)}/unit</p>
                <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{existingAvg.toFixed(2)} → {newAvg.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>Total Units</p>
                <p className="font-bold" style={{ color: "var(--text-heading)" }}>{totalUnits}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>Total Invested</p>
                <p className="font-bold" style={{ color: "var(--text-heading)" }}>₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={handleAdd} disabled={loading || !Number(newUnits) || effectiveBuyPrice <= 0} className="btn btn-success flex-1 py-3 disabled:opacity-50">
            {loading ? "Adding..." : `📈 Add ${newUnits || "0"} Units`}
          </button>
          <button onClick={onClose} className="btn btn-secondary px-5 py-3">Cancel</button>
        </div>
      </div>
    </AccessibleModal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SELL / REDEEM MODAL — Accessible with focus trap
   ═══════════════════════════════════════════════════════════════ */

export function SellInvestmentModal({
  investment,
  livePrice,
  accounts,
  onClose,
  onSold,
}: {
  investment: InvestmentRow;
  livePrice: number | null;
  accounts: AccountOption[];
  onClose: () => void;
  onSold: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentUnits = Number(investment.units) || 0;
  const hasUnits = currentUnits > 0;
  const currentInvested = Number(investment.invested) || 0;
  const currentValue = Number(investment.currentValue) || 0;
  const effectiveValue = currentValue > 0 ? currentValue : currentInvested;
  const [form, setForm] = useState<SellFormState>({
    sellUnits: currentUnits,
    sellPrice: livePrice || (hasUnits ? effectiveValue / currentUnits : 0),
    sellAmount: effectiveValue,
    accountId: accounts[0]?.id ? String(accounts[0].id) : "",
    settled: false,
  });

  const sellAmount = hasUnits
    ? Number((Number(form.sellUnits) * form.sellPrice).toFixed(2))
    : Number(form.sellAmount) || 0;
  const remainingUnits = currentUnits - Number(form.sellUnits);
  const isFullSell = hasUnits ? remainingUnits <= 0 : Number(form.sellAmount) >= effectiveValue;

  const handleSell = async () => {
    if (hasUnits && (!form.sellUnits || form.sellUnits <= 0)) { setError("Enter units to sell"); return; }
    if (hasUnits && form.sellUnits > currentUnits) { setError(`You only have ${currentUnits} units`); return; }
    if (!hasUnits && (!form.sellAmount || Number(form.sellAmount) <= 0)) { setError("Enter amount to sell"); return; }
    if (!hasUnits && Number(form.sellAmount) > effectiveValue) { setError(`Current value is only ₹${effectiveValue.toFixed(2)}`); return; }
    if (accounts.length > 0 && !form.accountId) { setError("Select a bank account to receive proceeds"); return; }
    setLoading(true);
    setError("");

    try {
      // ─── ATOMIC SELL: Single API call handles DELETE/UPDATE + transaction recording ───
      const sellPayload: Record<string, unknown> = {
        investmentId: investment.id,
        accountId: form.accountId ? Number(form.accountId) : null,
      };

      if (hasUnits) {
        sellPayload.sellUnits = Number(form.sellUnits);
        sellPayload.sellPrice = form.sellPrice;
      } else {
        sellPayload.sellAmount = Number(form.sellAmount);
      }

      const sellRes = await fetch("/api/manage/investments/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sellPayload),
      });

      if (!sellRes.ok) {
        const d = await sellRes.json().catch(() => ({}));
        const detail = d.details ? ` (${Object.entries(d.details).map(([k, v]) => `${k}: ${v}`).join("; ")})` : "";
        throw new Error((d.error || "Failed to process sale") + detail);
      }

      onSold();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessibleModal isOpen={true} onClose={onClose} title="Sell / Redeem" size="md">
      <div className="flex justify-between items-center mb-5">
        <h3 id="modal-title" className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-heading)" }}>
          <span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: "linear-gradient(135deg, var(--warning), var(--danger))" }} aria-hidden="true">📉</span>
          Sell / Redeem
        </h3>
        <button onClick={onClose} className="btn btn-ghost w-8 h-8 rounded-full text-xs" aria-label="Close sell modal">✕</button>
      </div>

      <div className="p-3 rounded-lg mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <p className="font-semibold" style={{ color: "var(--text-heading)" }}>{investment.name}</p>
        <div className="flex gap-2 mt-1 flex-wrap">
          <span className="badge badge-neutral">{investment.type}</span>
          {hasUnits ? (
            <span className="badge badge-primary">{currentUnits} units held</span>
          ) : (
            <span className="badge badge-primary">₹{effectiveValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })} current value</span>
          )}
          {livePrice ? <span className="badge badge-success">Live: ₹{livePrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span> : null}
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }} role="alert">{error}</div>}

      <div className="space-y-4">
        {hasUnits ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="sell-units">Units to Sell</label>
              <input id="sell-units" type="number" step="0.0001" value={form.sellUnits} onChange={(e) => setForm({ ...form, sellUnits: Number(e.target.value) })} className="input" max={currentUnits} />
              <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>Max: {currentUnits} units</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="sell-price">Sell Price (₹/unit)</label>
              <input id="sell-price" type="number" step="0.01" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })} className="input" />
              <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                {livePrice ? "Pre-filled from live price" : "Enter actual sell price"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="sell-amount">Amount to Sell (₹)</label>
              <input id="sell-amount" type="number" step="0.01" value={form.sellAmount} onChange={(e) => setForm({ ...form, sellAmount: Number(e.target.value) })} className="input" />
              <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>Max: ₹{effectiveValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Current Value</label>
              <div className="input" style={{ background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 700 }}>
                ₹{effectiveValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }} htmlFor="sell-account">Receive In (Bank Account)</label>
          {accounts.length > 0 ? (
            <select id="sell-account" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className="input">
              <option value="">— Select account —</option>
              {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name} ({a.type})</option>))}
            </select>
          ) : (
            <div className="input" style={{ background: "var(--warning-soft)", color: "var(--warning)", fontWeight: 600 }}>
              ⚠️ No accounts yet — add a Bank account in Settings first
            </div>
          )}
          <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
            Sale proceeds will be recorded as income to this account
          </p>
        </div>

        {/* Settlement toggle */}
        <div className="p-3 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id="sell-settled"
              type="checkbox"
              checked={form.settled}
              onChange={(e) => setForm({ ...form, settled: e.target.checked })}
              className="mt-0.5 w-5 h-5 rounded"
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
                💰 Amount already credited to my account
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                Stock/MF sales typically take T+1 or T+2 days to settle. Only check this if the money has already appeared in your bank account.
              </p>
            </div>
          </label>
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg" style={{ background: "var(--primary-soft)", border: "1px solid var(--border-accent)" }} role="status" aria-label="Sale summary">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>Sale Amount</p>
              <p className="font-bold" style={{ color: "var(--text-heading)" }}>₹{sellAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>Remaining</p>
              <p className="font-bold" style={{ color: "var(--text-heading)" }}>
                {isFullSell ? "Full exit" : hasUnits ? `${remainingUnits} units` : `₹${(effectiveValue - sellAmount).toFixed(2)}`}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>Status</p>
              <p className="font-bold" style={{ color: form.settled ? "var(--success)" : "var(--warning)" }}>
                {form.settled ? "✓ Settled" : "⏳ Pending settlement"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>Recorded as</p>
              <p className="font-bold" style={{ color: "var(--text-heading)" }}>Income</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSell} disabled={loading} className="btn btn-danger flex-1 py-3 disabled:opacity-50" aria-label={isFullSell ? "Sell all and exit" : hasUnits ? `Sell ${form.sellUnits} units` : `Sell ₹${Number(form.sellAmount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}>
            {loading ? "Processing..." : isFullSell ? "📉 Sell All & Exit" : hasUnits ? `📉 Sell ${form.sellUnits} Units` : `📉 Sell ₹${Number(form.sellAmount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          </button>
          <button onClick={onClose} className="btn btn-secondary px-5 py-3">Cancel</button>
        </div>
      </div>
    </AccessibleModal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MANAGEMENT TABLE + MANAGER
   ═══════════════════════════════════════════════════════════════ */

export function InvestmentManagementTable({
  investments,
  onEdit,
  onDelete,
  onSell,
  onAddMore,
}: {
  investments: InvestmentRow[];
  onEdit: (i: InvestmentRow) => void;
  onDelete: (id: number) => Promise<void>;
  onSell?: (i: InvestmentRow) => void;
  onAddMore?: (i: InvestmentRow) => void;
}) {
  return (
    <Card title="📈 Investment Management" subtitle={`${investments.length} holdings`}>
      <Table headers={["Name", "Type", "Invested", "Current", "Return", "Units", "Actions"]} right={[2, 3, 4, 5]}>
        {investments.map((i) => (
          <Tr key={i.id}>
            <Td strong>{i.name}</Td>
            <Td><Badge tone="neutral">{i.type}</Badge></Td>
            <Td right muted>{inr(Number(i.invested), { compact: true })}</Td>
            <Td right strong>{inr(Number(i.currentValue), { compact: true })}</Td>
            <Td right>{Number(i.annualReturn).toFixed(1)}%</Td>
            <Td right muted>{i.units || "—"}</Td>
            <Td right>
              <div className="flex gap-1 justify-end no-print">
                {onAddMore && (Number(i.units || 0) > 0 || Number(i.invested || 0) > 0) && (
                  <button onClick={() => onAddMore(i)} className="btn btn-ghost text-[11px] px-2 py-1" style={{ color: "var(--success)" }} aria-label={`Add more ${i.name}`}>📈 Add</button>
                )}
                {onSell && (Number(i.units || 0) > 0 || Number(i.invested || 0) > 0 || Number(i.currentValue || 0) > 0) && (
                  <button onClick={() => onSell(i)} className="btn btn-ghost text-[11px] px-2 py-1" style={{ color: "var(--warning)" }} aria-label={`Sell ${i.name}`}>📉 Sell</button>
                )}
                <button onClick={() => onEdit(i)} className="btn btn-ghost text-[11px] px-2 py-1" aria-label={`Edit ${i.name}`}>Edit</button>
                <button onClick={() => onDelete(i.id)} className="btn btn-danger text-[11px] px-2 py-1" aria-label={`Delete ${i.name}`}>Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}

export function InvestmentsManager({ investments, accounts }: { investments: InvestmentRow[]; accounts?: AccountOption[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<InvestmentRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sellTarget, setSellTarget] = useState<InvestmentRow | null>(null);
  const [addMoreTarget, setAddMoreTarget] = useState<InvestmentRow | null>(null);

  const handleSave = async (payload: Record<string, unknown>) => {
    await fetch("/api/manage/investments", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
    });
    setShowAdd(false);
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this investment?")) return;
    await fetch("/api/manage/investments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end no-print">
        <button onClick={() => { setShowAdd(!showAdd); setEditing(null); }} className="btn btn-primary text-sm" aria-label={showAdd ? "Cancel adding investment" : "Add new investment"}>
          {showAdd ? "Cancel" : "+ Add Investment"}
        </button>
      </div>
      {(showAdd || editing) && (
        <InvestmentForm editingInvestment={editing} existingInvestments={investments} onSave={handleSave} onCancel={() => { setShowAdd(false); setEditing(null); }} />
      )}
      <InvestmentManagementTable
        investments={investments}
        onEdit={(i) => { setEditing(i); setShowAdd(true); }}
        onDelete={handleDelete}
        onSell={(i) => setSellTarget(i)}
        onAddMore={(i) => setAddMoreTarget(i)}
      />
      {sellTarget && (
        <SellInvestmentModal
          investment={sellTarget}
          livePrice={null}
          accounts={accounts || []}
          onClose={() => setSellTarget(null)}
          onSold={() => { setSellTarget(null); router.refresh(); }}
        />
      )}
      {addMoreTarget && (
        <AddMoreUnitsModal
          investment={addMoreTarget}
          livePrice={null}
          onClose={() => setAddMoreTarget(null)}
          onAdded={() => { setAddMoreTarget(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
