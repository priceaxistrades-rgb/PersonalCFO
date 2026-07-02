"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, fmtDate } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };
const TYPES = ["Health", "Life", "Vehicle", "Property"];

export function InsuranceManager({ insurance }: { insurance: { id: number; name: string; type: string; provider: string; premium: string; coverage: string; renewalDate: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Health", provider: "", premium: 0, coverage: 0, renewalDate: "" });

  const save = async () => {
    if (!form.name) return;
    await fetch("/api/manage/insurance", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...form } : form),
    });
    setEditing(null);
    setShowAdd(false);
    setForm({ name: "", type: "Health", provider: "", premium: 0, coverage: 0, renewalDate: "" });
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this policy?")) return;
    await fetch("/api/manage/insurance", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  return (
    <Card title="🛡️ Insurance Policies" subtitle={`${insurance.length} policies`}>
      <div className="flex justify-end mb-3 no-print">
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
          {showAdd ? "Cancel" : "+ Add Policy"}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="grid sm:grid-cols-4 gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
          <input placeholder="Policy Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
            {TYPES.map((t) => (<option key={t}>{t}</option>))}
          </select>
          <input placeholder="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" placeholder="Premium" value={form.premium} onChange={(e) => setForm({ ...form, premium: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" placeholder="Coverage" value={form.coverage} onChange={(e) => setForm({ ...form, coverage: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="date" value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save</button>
            <button onClick={() => { setEditing(null); setShowAdd(false); }} className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
          </div>
        </div>
      )}

      <Table headers={["Name", "Type", "Provider", "Premium", "Coverage", "Renewal", "Actions"]} right={[3, 4, 6]}>
        {insurance.map((i) => (
          <Tr key={i.id}>
            <Td strong>{i.name}</Td>
            <Td><Badge>{i.type}</Badge></Td>
            <Td muted>{i.provider}</Td>
            <Td right>{inr(Number(i.premium))}</Td>
            <Td right>{inr(Number(i.coverage))}</Td>
            <Td muted>{fmtDate(i.renewalDate)}</Td>
            <Td right>
              <div className="flex gap-2 justify-end no-print">
                <button onClick={() => { setEditing(i.id); setForm({ name: i.name, type: i.type, provider: i.provider, premium: Number(i.premium), coverage: Number(i.coverage), renewalDate: i.renewalDate }); }} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => del(i.id)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}
