"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };
const TYPES = ["Stocks", "MutualFunds", "PPF", "EPF", "NPS", "FD", "RD", "Gold", "Silver", "Bonds", "Crypto", "RealEstate", "Other"];

export function InvestmentsManager({ investments }: { investments: { id: number; name: string; type: string; invested: string; currentValue: string; annualReturn: string | null; symbol: string | null; schemeCode: string | null; units: string | null; startDate: string | null }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Stocks", invested: 0, currentValue: 0, annualReturn: 0, symbol: "", schemeCode: "", units: "", startDate: "" });

  const save = async () => {
    if (!form.name) return;
    const payload = { ...form, symbol: form.symbol || null, schemeCode: form.schemeCode || null, units: form.units || null, startDate: form.startDate || null };
    await fetch("/api/manage/investments", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...payload } : payload),
    });
    setEditing(null);
    setShowAdd(false);
    setForm({ name: "", type: "Stocks", invested: 0, currentValue: 0, annualReturn: 0, symbol: "", schemeCode: "", units: "", startDate: "" });
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this investment?")) return;
    await fetch("/api/manage/investments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  return (
    <Card title="📈 Investments" subtitle={`${investments.length} holdings`}>
      <div className="flex justify-end mb-3 no-print">
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
          {showAdd ? "Cancel" : "+ Add Investment"}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="grid sm:grid-cols-3 gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
            {TYPES.map((t) => (<option key={t}>{t}</option>))}
          </select>
          <input type="number" placeholder="Invested" value={form.invested} onChange={(e) => setForm({ ...form, invested: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" placeholder="Current Value" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" step="0.01" placeholder="Annual Return %" value={form.annualReturn} onChange={(e) => setForm({ ...form, annualReturn: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="date" placeholder="Start Date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input placeholder="Stock Symbol (e.g. RELIANCE.NS)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input placeholder="MF Scheme Code" value={form.schemeCode} onChange={(e) => setForm({ ...form, schemeCode: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input placeholder="Units/Quantity" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <div className="flex gap-2 sm:col-span-3">
            <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save</button>
            <button onClick={() => { setEditing(null); setShowAdd(false); }} className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
          </div>
        </div>
      )}

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
                <button onClick={() => { setEditing(i.id); setForm({ name: i.name, type: i.type, invested: Number(i.invested), currentValue: Number(i.currentValue), annualReturn: Number(i.annualReturn), symbol: i.symbol || "", schemeCode: i.schemeCode || "", units: i.units || "", startDate: i.startDate || "" }); }} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => del(i.id)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}
