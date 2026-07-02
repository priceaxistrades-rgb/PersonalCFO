"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

export function AccountsManager({ accounts }: { accounts: { id: number; name: string; type: string; category: string; balance: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Bank", category: "liquid", balance: 0 });

  const save = async () => {
    if (!form.name) return;
    await fetch("/api/manage/accounts", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...form } : form),
    });
    setEditing(null);
    setShowAdd(false);
    setForm({ name: "", type: "Bank", category: "liquid", balance: 0 });
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this account?")) return;
    await fetch("/api/manage/accounts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  return (
    <Card title="💳 Accounts" subtitle={`${accounts.length} accounts`}>
      <div className="flex justify-end mb-3 no-print">
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
          {showAdd ? "Cancel" : "+ Add Account"}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="grid sm:grid-cols-5 gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
          <input placeholder="Account Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
            {["Bank", "Cash", "Wallet", "Gold", "RealEstate", "Other"].map((t) => (<option key={t}>{t}</option>))}
          </select>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
            <option value="liquid">Liquid</option>
            <option value="asset">Asset</option>
          </select>
          <input type="number" placeholder="Balance" value={form.balance} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save</button>
            <button onClick={() => { setEditing(null); setShowAdd(false); }} className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
          </div>
        </div>
      )}

      <Table headers={["Name", "Type", "Category", "Balance", "Actions"]} right={[3, 4]}>
        {accounts.map((a) => (
          <Tr key={a.id}>
            <Td strong>{a.name}</Td>
            <Td><Badge>{a.type}</Badge></Td>
            <Td muted>{a.category}</Td>
            <Td right strong>{inr(Number(a.balance))}</Td>
            <Td right>
              <div className="flex gap-2 justify-end no-print">
                <button onClick={() => { setEditing(a.id); setForm({ name: a.name, type: a.type, category: a.category, balance: Number(a.balance) }); }} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => del(a.id)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}
