"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };
const TYPES = ["HomeLoan", "CarLoan", "EducationLoan", "CreditCard", "PersonalLoan"];

export function DebtsManager({ debts }: { debts: { id: number; name: string; type: string; principal: string; outstanding: string; interestRate: string; emi: string; tenureMonths: number }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "HomeLoan", principal: 0, outstanding: 0, interestRate: 0, emi: 0, tenureMonths: 0 });

  const save = async () => {
    if (!form.name) return;
    await fetch("/api/manage/debts", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...form } : form),
    });
    setEditing(null);
    setShowAdd(false);
    setForm({ name: "", type: "HomeLoan", principal: 0, outstanding: 0, interestRate: 0, emi: 0, tenureMonths: 0 });
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this loan?")) return;
    await fetch("/api/manage/debts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  return (
    <Card title="🏦 Loans & Debts" subtitle={`${debts.length} loans`}>
      <div className="flex justify-end mb-3 no-print">
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
          {showAdd ? "Cancel" : "+ Add Loan"}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="grid sm:grid-cols-4 gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
          <input placeholder="Loan Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
            {TYPES.map((t) => (<option key={t}>{t}</option>))}
          </select>
          <input type="number" placeholder="Principal" value={form.principal} onChange={(e) => setForm({ ...form, principal: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" placeholder="Outstanding" value={form.outstanding} onChange={(e) => setForm({ ...form, outstanding: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" step="0.01" placeholder="Interest Rate %" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" placeholder="EMI" value={form.emi} onChange={(e) => setForm({ ...form, emi: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" placeholder="Tenure (months)" value={form.tenureMonths} onChange={(e) => setForm({ ...form, tenureMonths: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save</button>
            <button onClick={() => { setEditing(null); setShowAdd(false); }} className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
          </div>
        </div>
      )}

      <Table headers={["Name", "Type", "Outstanding", "Rate", "EMI", "Actions"]} right={[2, 3, 4, 5]}>
        {debts.map((d) => (
          <Tr key={d.id}>
            <Td strong>{d.name}</Td>
            <Td><Badge>{d.type}</Badge></Td>
            <Td right strong>{inr(Number(d.outstanding))}</Td>
            <Td right>{Number(d.interestRate).toFixed(1)}%</Td>
            <Td right>{inr(Number(d.emi))}</Td>
            <Td right>
              <div className="flex gap-2 justify-end no-print">
                <button onClick={() => { setEditing(d.id); setForm({ name: d.name, type: d.type, principal: Number(d.principal), outstanding: Number(d.outstanding), interestRate: Number(d.interestRate), emi: Number(d.emi), tenureMonths: d.tenureMonths }); }} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => del(d.id)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}
