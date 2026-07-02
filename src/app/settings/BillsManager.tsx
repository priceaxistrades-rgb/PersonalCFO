"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, fmtDate } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

export function BillsManager({ bills }: { bills: { id: number; name: string; category: string; amount: string; dueDate: string; frequency: string; paid: boolean }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", amount: 0, dueDate: "", frequency: "Monthly", paid: false });

  const save = async () => {
    if (!form.name) return;
    await fetch("/api/manage/bills", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...form } : form),
    });
    setEditing(null);
    setShowAdd(false);
    setForm({ name: "", category: "", amount: 0, dueDate: "", frequency: "Monthly", paid: false });
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this bill?")) return;
    await fetch("/api/manage/bills", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  return (
    <Card title="🔔 Bills" subtitle={`${bills.length} bills`}>
      <div className="flex justify-end mb-3 no-print">
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
          {showAdd ? "Cancel" : "+ Add Bill"}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="grid sm:grid-cols-4 gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
          <input placeholder="Bill Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
            {["Monthly", "Quarterly", "Yearly"].map((f) => (<option key={f}>{f}</option>))}
          </select>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
            <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} /> Paid
          </label>
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save</button>
            <button onClick={() => { setEditing(null); setShowAdd(false); }} className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
          </div>
        </div>
      )}

      <Table headers={["Name", "Category", "Amount", "Due Date", "Status", "Actions"]} right={[2, 5]}>
        {bills.map((b) => (
          <Tr key={b.id}>
            <Td strong>{b.name}</Td>
            <Td><Badge>{b.category}</Badge></Td>
            <Td right>{inr(Number(b.amount))}</Td>
            <Td muted>{fmtDate(b.dueDate)}</Td>
            <Td>{b.paid ? <span style={{ color: "var(--success)" }}>✓ Paid</span> : <span style={{ color: "var(--warning)" }}>Pending</span>}</Td>
            <Td right>
              <div className="flex gap-2 justify-end no-print">
                <button onClick={() => { setEditing(b.id); setForm({ name: b.name, category: b.category, amount: Number(b.amount), dueDate: b.dueDate, frequency: b.frequency, paid: b.paid }); }} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => del(b.id)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}
