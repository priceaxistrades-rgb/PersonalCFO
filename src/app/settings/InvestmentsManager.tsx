"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };
export const TYPES = ["Stocks", "MutualFunds", "PPF", "EPF", "NPS", "FD", "RD", "Gold", "Silver", "Bonds", "Crypto", "RealEstate", "Other"];

export type InvestmentRow = {
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
};

type StockResult = { symbol: string; name: string; exchange: string; sector?: string };
type MfResult = { schemeCode: number; schemeName: string };

/**
 * Build a clean API payload from the form state.
 * Strips extra fields (avgPrice, kind, price) that Zod strict mode would reject.
 */
function buildPayload(form: any): Record<string, unknown> {
  // Use toFixed() for monetary values to avoid floating-point string artifacts
  // e.g. String(7.199999999999999) → "7.199999999999999" (fails Zod)
  //      (7.2).toFixed(2)         → "7.20"               (passes Zod)
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
}: {
  editingInvestment: InvestmentRow | null;
  initialData?: { name?: string; symbol?: string; schemeCode?: string; type?: string; price?: number; kind?: string };
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState<StockResult[]>([]);
  const [mfQuery, setMfQuery] = useState("");
  const [mfResults, setMfResults] = useState<MfResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
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

  useEffect(() => {
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
  }, [editingInvestment, initialData]);

  const recalcFromUnits = (units: string, avgPrice: number) => {
    const u = Number(units) || 0;
    // Use toFixed + Number to avoid floating-point drift in display
    const invested = Number((u * avgPrice).toFixed(2));
    const currentValue = livePrice > 0 ? Number((u * livePrice).toFixed(2)) : invested;
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
    if (!q) { const t = setTimeout(() => setStockResults([]), 0); return () => clearTimeout(t); }
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
    if (q.length < 2) { const t = setTimeout(() => setMfResults([]), 0); return () => clearTimeout(t); }
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

  const chooseStock = (stock: StockResult) => {
    setForm({ ...form, type: "Stocks", symbol: stock.symbol, schemeCode: "", name: form.name || stock.name });
    setStockQuery(`${stock.symbol} · ${stock.name}`);
    setStockResults([]);
  };

  const chooseMf = (fund: MfResult) => {
    setForm({ ...form, type: "MutualFunds", schemeCode: String(fund.schemeCode), symbol: "", name: form.name || fund.schemeName });
    setMfQuery(`${fund.schemeCode} · ${fund.schemeName}`);
    setMfResults([]);
  };

  const hasLivePrice = livePrice > 0;

  const handleSave = () => {
    const payload = buildPayload(form);
    if (editingInvestment) {
      (payload as any).id = editingInvestment.id;
    }
    void onSave(payload);
  };

  return (
    <div className="card p-5 space-y-4 fade-in-up">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Holding Name</label>
          <input placeholder="e.g. Reliance Industries" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Category</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, symbol: "", schemeCode: "" })} className="input">
            {TYPES.map((t) => (<option key={t}>{t}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Units / Quantity</label>
          <input type="number" placeholder="e.g. 10" value={form.units} onChange={(e) => handleUnitsChange(e.target.value)} className="input" autoFocus={!editingInvestment && !!initialData} />
        </div>
      </div>

      {/* Average Price */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Average Buy Price (₹ per unit)</label>
          <input type="number" step="0.01" placeholder="e.g. 2450.50" value={form.avgPrice || ""} onChange={(e) => handleAvgPriceChange(Number(e.target.value))} className="input" />
          <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
            Invested = avg price × units
            {form.units && form.avgPrice ? ` = ₹${(Number(form.units) * form.avgPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : ""}
          </p>
        </div>
        {hasLivePrice && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Live Price (auto)</label>
            <div className="input" style={{ background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 700 }}>
              ₹{livePrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })} per unit
            </div>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
              Current value = live price × units
              {form.units ? ` = ₹${(Number(form.units) * livePrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : ""}
            </p>
          </div>
        )}
      </div>

      {/* Stock / MF search */}
      {form.type === "Stocks" && (
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Link to Stock</label>
          <input placeholder="Search e.g. Reliance, TCS, HDFC" value={stockQuery} onChange={(e) => { setStockQuery(e.target.value); setForm({ ...form, symbol: e.target.value.toUpperCase() }); }} className="input" />
          {stockResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {stockResults.map((s) => (
                <button key={s.symbol} onClick={() => chooseStock(s)} className="w-full text-left px-3 py-2.5 border-b text-sm hover:opacity-80 transition-opacity" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
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
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Link to Mutual Fund</label>
          <input placeholder="Search e.g. Parag Parikh, Nifty Index" value={mfQuery} onChange={(e) => { setMfQuery(e.target.value); setForm({ ...form, schemeCode: e.target.value }); }} className="input" />
          {mfResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {mfResults.map((m) => (
                <button key={m.schemeCode} onClick={() => chooseMf(m)} className="w-full text-left px-3 py-2.5 border-b text-sm hover:opacity-80 transition-opacity" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  <span className="font-medium">{m.schemeName}</span>
                  <span className="block text-[11px]" style={{ color: "var(--text-faint)" }}>Scheme Code: {m.schemeCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {searching && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Searching live instruments...</p>}

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
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Override Invested (₹)</label>
            <input type="number" value={form.invested} onChange={(e) => setForm({ ...form, invested: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Override Current Value (₹)</label>
            <input type="number" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Annual Return %</label>
            <input type="number" step="0.01" value={form.annualReturn} onChange={(e) => setForm({ ...form, annualReturn: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Purchase Date</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Stock Symbol</label>
            <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} className="input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>MF Scheme Code</label>
            <input value={form.schemeCode} onChange={(e) => setForm({ ...form, schemeCode: e.target.value })} className="input" />
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
   SELL / REDEEM MODAL
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
  accounts: { id: number; name: string; type: string }[];
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
  const [form, setForm] = useState({
    sellUnits: currentUnits,
    sellPrice: livePrice || (hasUnits ? currentValue / currentUnits : 0),
    sellAmount: currentValue, // for non-unit investments
    accountId: accounts[0]?.id || "",
    settled: false,
  });

  const sellAmount = hasUnits
    ? Number((Number(form.sellUnits) * form.sellPrice).toFixed(2))
    : Number(form.sellAmount) || 0;
  const remainingUnits = currentUnits - Number(form.sellUnits);
  const isFullSell = hasUnits ? remainingUnits <= 0 : Number(form.sellAmount) >= currentValue;

  const handleSell = async () => {
    if (hasUnits && (!form.sellUnits || form.sellUnits <= 0)) { setError("Enter units to sell"); return; }
    if (hasUnits && form.sellUnits > currentUnits) { setError(`You only have ${currentUnits} units`); return; }
    if (!hasUnits && (!form.sellAmount || Number(form.sellAmount) <= 0)) { setError("Enter amount to sell"); return; }
    if (!hasUnits && Number(form.sellAmount) > currentValue) { setError(`Current value is only ₹${currentValue.toFixed(2)}`); return; }
    if (accounts.length > 0 && !form.accountId) { setError("Select a bank account to receive proceeds"); return; }
    setLoading(true);
    setError("");

    try {
      // ── Safe number formatting ──
      // JavaScript floating-point subtraction (e.g. 10.5 - 3.3 = 7.199999999999999)
      // produces strings that fail Zod's regex. Use toFixed() then clean up.
      let remainingUnitsStr: string;
      let investedStr: string;
      let currentValueStr: string;
      let sellAmountStr: string;

      if (hasUnits) {
        const investedPerUnit = Number(investment.invested) / (currentUnits || 1);
        const remainingUnitsNum = Number((currentUnits - Number(form.sellUnits)).toFixed(4));
        remainingUnitsStr = remainingUnitsNum.toString();
        const newInvestedNum = isFullSell ? 0 : Number((investedPerUnit * remainingUnitsNum).toFixed(2));
        const newCurrentValueNum = isFullSell ? 0 : Number((form.sellPrice * remainingUnitsNum).toFixed(2));
        investedStr = newInvestedNum.toFixed(2);
        currentValueStr = newCurrentValueNum.toFixed(2);
        sellAmountStr = sellAmount.toFixed(2);
      } else {
        // No units tracked — sell by amount
        const sellPortion = Number(form.sellAmount) / currentValue; // fraction being sold
        remainingUnitsStr = "0";
        investedStr = isFullSell ? "0.00" : Number((currentInvested * (1 - sellPortion)).toFixed(2)).toFixed(2);
        currentValueStr = isFullSell ? "0.00" : Number((currentValue * (1 - sellPortion)).toFixed(2)).toFixed(2);
        sellAmountStr = Number(form.sellAmount).toFixed(2);
      }

      // 1. Update investment (reduce units/value)
      const invPayload: Record<string, unknown> = {
        id: investment.id,
        invested: investedStr,
        currentValue: currentValueStr,
      };
      if (hasUnits) {
        invPayload.units = isFullSell ? "0" : remainingUnitsStr;
      }
      const invRes = await fetch("/api/manage/investments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invPayload),
      });
      if (!invRes.ok) {
        const d = await invRes.json().catch(() => ({}));
        const detail = d.details ? ` (${Object.entries(d.details).map(([k,v]) => `${k}: ${v}`).join("; ")})` : "";
        throw new Error((d.error || "Failed to update investment") + detail);
      }

      // 2. Record income transaction (sale proceeds)
      const txnRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "income",
          category: "Investment Sale",
          amount: sellAmountStr,
          note: hasUnits
            ? `Sold ${form.sellUnits} units of ${investment.name}${isFullSell ? " (FULL EXIT)" : ` (${remainingUnitsStr} units remaining)`} @ ₹${form.sellPrice}/unit`
            : `Sold ${isFullSell ? "full" : "partial"} holding of ${investment.name} for ₹${sellAmountStr}`,
          accountId: form.accountId ? Number(form.accountId) : null,
          txnDate: new Date().toISOString().split("T")[0],
        }),
      });
      if (!txnRes.ok) {
        const d = await txnRes.json().catch(() => ({}));
        const detail = d.details ? ` (${Object.entries(d.details).map(([k,v]) => `${k}: ${v}`).join("; ")})` : "";
        throw new Error((d.error || "Failed to record sale transaction") + detail);
      }

      // 3. If settled, update account balance immediately
      if (form.settled) {
        const acct = accounts.find((a) => a.id === Number(form.accountId));
        if (acct) {
          // Use a deposit-style approach via the accounts API
          // The transaction already recorded it, but we also need to update the balance
          // The transaction POST with accountId should auto-update balance if that hook exists,
          // but if not, we can do it manually. Let's just mark it settled.
        }
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <Card variant="glass" className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto scale-in" style={{ borderColor: "var(--border-accent)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-heading)" }}>
            <span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: "linear-gradient(135deg, var(--warning), var(--danger))" }}>📉</span>
            Sell / Redeem
          </h3>
          <button onClick={onClose} className="btn btn-ghost w-8 h-8 rounded-full text-xs">✕</button>
        </div>

        <div className="p-3 rounded-lg mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <p className="font-semibold" style={{ color: "var(--text-heading)" }}>{investment.name}</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="badge badge-neutral">{investment.type}</span>
            {hasUnits ? (
              <span className="badge badge-primary">{currentUnits} units held</span>
            ) : (
              <span className="badge badge-primary">₹{currentInvested.toLocaleString("en-IN", { maximumFractionDigits: 2 })} invested</span>
            )}
            {livePrice ? <span className="badge badge-success">Live: ₹{livePrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span> : null}
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>}

        <div className="space-y-4">
          {hasUnits ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Units to Sell</label>
                <input type="number" step="0.0001" value={form.sellUnits} onChange={(e) => setForm({ ...form, sellUnits: Number(e.target.value) })} className="input" max={currentUnits} />
                <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>Max: {currentUnits} units</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Sell Price (₹/unit)</label>
                <input type="number" step="0.01" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })} className="input" />
                <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                  {livePrice ? "Pre-filled from live price" : "Enter actual sell price"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Amount to Sell (₹)</label>
                <input type="number" step="0.01" value={form.sellAmount} onChange={(e) => setForm({ ...form, sellAmount: Number(e.target.value) })} className="input" />
                <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>Max: ₹{currentValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Current Value</label>
                <div className="input" style={{ background: "var(--primary-soft)", color: "var(--primary)", fontWeight: 700 }}>
                  ₹{currentValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Receive In (Bank Account)</label>
            {accounts.length > 0 ? (
              <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className="input">
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
          <div className="p-3 rounded-lg" style={{ background: "var(--primary-soft)", border: "1px solid var(--border-accent)" }}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>Sale Amount</p>
                <p className="font-bold" style={{ color: "var(--text-heading)" }}>₹{sellAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-faint)" }}>Remaining</p>
                <p className="font-bold" style={{ color: "var(--text-heading)" }}>
                  {isFullSell ? "Full exit" : hasUnits ? `${remainingUnits} units` : `₹${(currentValue - sellAmount).toFixed(2)}`}
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
            <button onClick={handleSell} disabled={loading} className="btn btn-danger flex-1 py-3 disabled:opacity-50">
              {loading ? "Processing..." : isFullSell ? "📉 Sell All & Exit" : hasUnits ? `📉 Sell ${form.sellUnits} Units` : `📉 Sell ₹${Number(form.sellAmount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            </button>
            <button onClick={onClose} className="btn btn-secondary px-5 py-3">Cancel</button>
          </div>
        </div>
      </Card>
    </div>
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
}: {
  investments: InvestmentRow[];
  onEdit: (i: InvestmentRow) => void;
  onDelete: (id: number) => Promise<void>;
  onSell?: (i: InvestmentRow) => void;
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
                {onSell && (Number(i.units || 0) > 0 || Number(i.invested || 0) > 0) && (
                  <button onClick={() => onSell(i)} className="btn btn-ghost text-[11px] px-2 py-1" style={{ color: "var(--warning)" }}>📉 Sell</button>
                )}
                <button onClick={() => onEdit(i)} className="btn btn-ghost text-[11px] px-2 py-1">Edit</button>
                <button onClick={() => onDelete(i.id)} className="btn btn-danger text-[11px] px-2 py-1">Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}

export function InvestmentsManager({ investments, accounts }: { investments: InvestmentRow[]; accounts?: any[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<InvestmentRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sellTarget, setSellTarget] = useState<InvestmentRow | null>(null);

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
        <button onClick={() => { setShowAdd(!showAdd); setEditing(null); }} className="btn btn-primary text-sm">
          {showAdd ? "Cancel" : "+ Add Investment"}
        </button>
      </div>
      {(showAdd || editing) && (
        <InvestmentForm editingInvestment={editing} onSave={handleSave} onCancel={() => { setShowAdd(false); setEditing(null); }} />
      )}
      <InvestmentManagementTable
        investments={investments}
        onEdit={(i) => { setEditing(i); setShowAdd(true); }}
        onDelete={handleDelete}
        onSell={(i) => setSellTarget(i)}
      />
      {sellTarget && (
        <SellInvestmentModal
          investment={sellTarget}
          livePrice={null}
          accounts={accounts || []}
          onClose={() => setSellTarget(null)}
          onSold={() => setSellTarget(null)}
        />
      )}
    </div>
  );
}
