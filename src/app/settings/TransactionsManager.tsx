"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, fmtDate } from "@/lib/format";

type TxnRow = { id: number; type: string; category: string; amount: string; txnDate: string; memberId: number | null; note: string | null };
const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

export function TransactionsManager({ 
  transactions, 
  members 
}: { 
  transactions: TxnRow[];
  members: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [editing, setEditing] = useState<TxnRow | null>(null);
  const [form, setForm] = useState({ type: "expense", category: "", amount: 0, txnDate: "", memberId: "", note: "" });

  const filtered = transactions.filter((t) => filter === "all" || t.type === filter);
  const memberName = (id: number | null) => members.find((m) => m.id === id)?.name ?? "—";

  const startEdit = (t: TxnRow) => {
    setEditing(t);
    setForm({
      type: t.type,
      category: t.category,
      amount: Number(t.amount),
      txnDate: String(t.txnDate).slice(0, 10),
      memberId: t.memberId ? String(t.memberId) : "",
      note: t.note || "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await fetch("/api/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, ...form, memberId: form.memberId || null }),
    });
    setEditing(null);
    router.refresh();
  };

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((t) => t.id)));
  };

  const delSelected = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} transactions?`)) return;
    await fetch("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    router.refresh();
  };

  const delOne = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    await fetch("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  return (
    <Card title="🧾 Transactions" subtitle={`${filtered.length} shown (${selected.size} selected)`}>
      {editing && (
        <div className="mb-4 p-4 rounded-xl border no-print" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
          <div className="grid sm:grid-cols-6 gap-3">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="Amount" className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
            <input type="date" value={form.txnDate} onChange={(e) => setForm({ ...form, txnDate: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
            <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
              <option value="">No member</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note" className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={saveEdit} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save changes</button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3 no-print">
        <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "income" | "expense")} className="px-3 py-1.5 rounded-lg text-sm border" style={inputStyle}>
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <button onClick={toggleAll} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>
          {selected.size === filtered.length ? "Deselect All" : "Select All"}
        </button>
        {selected.size > 0 && (
          <button onClick={delSelected} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--danger)" }}>
            🗑 Delete {selected.size}
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-auto">
        <Table headers={["", "Date", "Type", "Category", "Member", "Amount", "Note", ""]} right={[5, 7]}>
          {filtered.slice(0, 100).map((t) => (
            <Tr key={t.id}>
              <Td><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="cursor-pointer" /></Td>
              <Td muted>{fmtDate(t.txnDate)}</Td>
              <Td><Badge tone={t.type === "income" ? "success" : "danger"}>{t.type}</Badge></Td>
              <Td>{t.category}</Td>
              <Td muted>{memberName(t.memberId)}</Td>
              <Td right strong>{t.type === "income" ? "+" : "−"}{inr(Number(t.amount))}</Td>
              <Td muted>{t.note || "—"}</Td>
              <Td right>
                <div className="flex gap-1 justify-end no-print">
                  <button onClick={() => startEdit(t)} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                  <button onClick={() => delOne(t.id)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </div>
    </Card>
  );
}
