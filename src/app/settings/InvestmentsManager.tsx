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
  onCancel 
}: { 
  editingInvestment: InvestmentRow | null, 
  initialData?: { name?: string; symbol?: string; schemeCode?: string; type?: string },
  onSave: (form: any) => Promise<void>, 
  onCancel: () => void 
}) {
  const [stockQuery, setStockQuery] = useState("");
  const [stockResults, setStockResults] = useState<StockResult[]>([]);
  const [mfQuery, setMfQuery] = useState("");
  const [mfResults, setMfResults] = useState<MfResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Stocks", invested: 0, currentValue: 0, annualReturn: 0, symbol: "", schemeCode: "", units: "", startDate: "" });

  useEffect(() => {
    if (editingInvestment) {
      setForm({
        name: editingInvestment.name,
        type: editingInvestment.type,
        invested: Number(editingInvestment.invested),
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
      setForm({
        name: initialData.name || "",
        type: initialData.type || (initialData.schemeCode ? "MutualFunds" : "Stocks"),
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
      setForm({ name: "", type: "Stocks", invested: 0, currentValue: 0, annualReturn: 0, symbol: "", schemeCode: "", units: "", startDate: "" });
      setStockQuery("");
      setMfQuery("");
    }
  }, [editingInvestment, initialData]);

  useEffect(() => {
    if (form.type !== "Stocks") return;
    const q = stockQuery.trim();
    if (!q) {
      const clearTimer = setTimeout(() => setStockResults([]), 0);
      return () => clearTimeout(clearTimer);
    }
    let active = true;
    const timer = setTimeout(() => {
      setSearching(true);
      void fetch(`/api/market/stock-search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (active) setStockResults(data.results || []);
        })
        .catch(() => {
          if (active) setStockResults([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [stockQuery, form.type]);

  useEffect(() => {
    if (form.type !== "MutualFunds") return;
    const q = mfQuery.trim();
    if (q.length < 2) {
      const clearTimer = setTimeout(() => setMfResults([]), 0);
      return () => clearTimeout(clearTimer);
    }
    let active = true;
    const timer = setTimeout(() => {
      setSearching(true);
      void fetch(`/api/market/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (active) setMfResults(data.results || []);
        })
        .catch(() => {
          if (active) setMfResults([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
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

  return (
    <div className="space-y-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase opacity-70 px-1">Holding Name</label>
          <input placeholder="Holding Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase opacity-70 px-1">Category</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, symbol: "", schemeCode: "" })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
            {TYPES.map((t) => (<option key={t}>{t}</option>))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase opacity-70 px-1">Units / Quantity</label>
          <input type="number" placeholder="Units / Quantity" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
        </div>
      </div>

      {form.type === "Stocks" && (
        <div className="relative">
          <label className="text-[10px] font-bold uppercase opacity-70 px-1 block mb-1">Stock Search</label>
          <input
            placeholder="Search Indian stock by name/symbol e.g. Reliance, TCS, HDFC"
            value={stockQuery}
            onChange={(e) => { setStockQuery(e.target.value); setForm({ ...form, symbol: e.target.value.toUpperCase() }); }}
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={inputStyle}
          />
          {stockResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {stockResults.map((s) => (
                <button key={s.symbol} onClick={() => chooseStock(s)} className="w-full text-left px-3 py-2 border-b text-sm hover:opacity-80" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
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
          <label className="text-[10px] font-bold uppercase opacity-70 px-1 block mb-1">Mutual Fund Search</label>
          <input
            placeholder="Search mutual fund by name e.g. Parag Parikh, Nifty Index, SBI"
            value={mfQuery}
            onChange={(e) => { setMfQuery(e.target.value); setForm({ ...form, schemeCode: e.target.value }); }}
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={inputStyle}
          />
          {mfResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {mfResults.map((m) => (
                <button key={m.schemeCode} onClick={() => chooseMf(m)} className="w-full text-left px-3 py-2 border-b text-sm hover:opacity-80" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  <span className="font-medium">{m.schemeName}</span>
                  <span className="block text-[11px]" style={{ color: "var(--text-faint)" }}>Scheme Code: {m.schemeCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {searching && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Searching live instruments...</p>}

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase opacity-70 px-1">Invested Amount</label>
          <input type="number" placeholder="Invested Amount" value={form.invested} onChange={(e) => setForm({ ...form, invested: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase opacity-70 px-1">Manual Current Value</label>
          <input type="number" placeholder="Manual Current Value / Fallback" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase opacity-70 px-1">Annual Return %</label>
          <input type="number" step="0.01" placeholder="Annual Return %" value={form.annualReturn} onChange={(e) => setForm({ ...form, annualReturn: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase opacity-70 px-1">Start Date</label>
          <input type="date" placeholder="Start Date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase opacity-70 px-1">Stock Symbol</label>
          <input placeholder="Selected Stock Symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase opacity-70 px-1">MF Scheme Code</label>
          <input placeholder="Selected MF Scheme Code" value={form.schemeCode} onChange={(e) => setForm({ ...form, schemeCode: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        For automatic live value, select a stock/MF and enter units. Current value will sync as live price/NAV × units on the Investments page.
      </p>

      <div className="flex gap-2">
        <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save Investment</button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
      </div>
    </div>
  );
}

export function InvestmentManagementTable({ 
  investments, 
  onEdit, 
  onDelete 
}: { 
  investments: InvestmentRow[], 
  onEdit: (i: InvestmentRow) => void, 
  onDelete: (id: number) => Promise<void> 
}) {
  return (
    <Card title="📈 Investment Management" subtitle={`${investments.length} holdings`}>
      <Table headers={["Name", "Type", "Invested", "Current", "Return", "Symbol/Code", "Actions"]} right={[2, 3, 4, 6]}>
        {investments.map((i) => (
          <Tr key={i.id}>
            <Td strong>{i.name}</Td>
            <Td><Badge>{i.type}</Badge></Td>
            <Td right muted>{inr(Number(i.invested), { compact: true })}</Td>
            <Td right strong>{inr(Number(i.currentValue), { compact: true })}</Td>
            <Td right>{Number(i.annualReturn).toFixed(1)}%</Td>
            <Td right muted>{i.symbol || i.schemeCode || "—"}</Td>
            <Td right>
              <div className="flex gap-2 justify-end no-print">
                <button onClick={() => onEdit(i)} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => onDelete(i.id)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
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
      startDate: form.startDate || null 
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
    await fetch("/api/manage/investments", { 
      method: "DELETE", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ id }) 
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end no-print">
        <button 
          onClick={() => { setShowAdd(!showAdd); setEditing(null); }} 
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white" 
          style={{ background: "var(--primary)" }}
        >
          {showAdd ? "Cancel" : "+ Add Investment"}
        </button>
      </div>
      
      {(showAdd || editing) && (
        <InvestmentForm 
          editingInvestment={editing} 
          onSave={handleSave} 
          onCancel={() => { setShowAdd(false); setEditing(null); }} 
        />
      )}

      <InvestmentManagementTable 
        investments={investments} 
        onEdit={(i) => { setEditing(i); setShowAdd(true); }} 
        onDelete={handleDelete} 
      />
    </div>
  );
}
