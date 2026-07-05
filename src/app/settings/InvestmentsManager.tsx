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

export function InvestmentForm({
  editingInvestment,
  initialData,
  onSave,
  onCancel,
}: {
  editingInvestment: InvestmentRow | null;
  initialData?: { name?: string; symbol?: string; schemeCode?: string; type?: string; price?: number; kind?: string };
  onSave: (form: any) => Promise<void>;
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

  // Compute current value from live price × units
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

  // Auto-calculate invested & currentValue from avgPrice and units
  const recalcFromUnits = (units: string, avgPrice: number) => {
    const u = Number(units) || 0;
    const invested = Math.round(u * avgPrice * 100) / 100;
    const currentValue = livePrice > 0 ? Math.round(u * livePrice * 100) / 100 : invested;
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

  // Whether this form has live price data (from Markets page)
  const hasLivePrice = livePrice > 0;

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
          <input
            type="number"
            placeholder="e.g. 10"
            value={form.units}
            onChange={(e) => handleUnitsChange(e.target.value)}
            className="input"
            autoFocus={!editingInvestment && !!initialData}
          />
        </div>
      </div>

      {/* Average Price — THE KEY FIELD */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>
            Average Buy Price (₹ per unit)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 2450.50"
            value={form.avgPrice || ""}
            onChange={(e) => handleAvgPriceChange(Number(e.target.value))}
            className="input"
          />
          <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
            Total invested = avg price × units
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
          <input
            placeholder="Search e.g. Reliance, TCS, HDFC"
            value={stockQuery}
            onChange={(e) => { setStockQuery(e.target.value); setForm({ ...form, symbol: e.target.value.toUpperCase() }); }}
            className="input"
          />
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
          <input
            placeholder="Search e.g. Parag Parikh, Nifty Index"
            value={mfQuery}
            onChange={(e) => { setMfQuery(e.target.value); setForm({ ...form, schemeCode: e.target.value }); }}
            className="input"
          />
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

      {/* Manual overrides */}
      <details className="group">
        <summary className="text-[11px] font-semibold cursor-pointer" style={{ color: "var(--text-faint)" }}>
          ⚙️ Advanced: Override values & set dates
        </summary>
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
        <button onClick={() => onSave(form)} className="btn btn-success px-5 py-2.5">Save Investment</button>
        <button onClick={onCancel} className="btn btn-secondary px-5 py-2.5">Cancel</button>
      </div>
    </div>
  );
}

export function InvestmentManagementTable({
  investments,
  onEdit,
  onDelete,
}: {
  investments: InvestmentRow[];
  onEdit: (i: InvestmentRow) => void;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <Card title="📈 Investment Management" subtitle={`${investments.length} holdings`}>
      <Table headers={["Name", "Type", "Invested", "Current", "Return", "Symbol/Code", "Actions"]} right={[2, 3, 4, 6]}>
        {investments.map((i) => (
          <Tr key={i.id}>
            <Td strong>{i.name}</Td>
            <Td><Badge tone="neutral">{i.type}</Badge></Td>
            <Td right muted>{inr(Number(i.invested), { compact: true })}</Td>
            <Td right strong>{inr(Number(i.currentValue), { compact: true })}</Td>
            <Td right>{Number(i.annualReturn).toFixed(1)}%</Td>
            <Td right muted>{i.symbol || i.schemeCode || "—"}</Td>
            <Td right>
              <div className="flex gap-2 justify-end no-print">
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

export function InvestmentsManager({ investments }: { investments: InvestmentRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<InvestmentRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const handleSave = async (form: any) => {
    const payload = {
      ...form,
      symbol: form.symbol || null,
      schemeCode: form.schemeCode || null,
      units: form.units || null,
      startDate: form.startDate || null,
    };
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
      <InvestmentManagementTable investments={investments} onEdit={(i) => { setEditing(i); setShowAdd(true); }} onDelete={handleDelete} />
    </div>
  );
}
