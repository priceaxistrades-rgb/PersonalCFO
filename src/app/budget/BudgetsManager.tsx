"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

export function BudgetsManager({ budgets }: { budgets: { id: number; category: string; monthlyLimit: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: "", monthlyLimit: 0 });

  const reset = () => {
    setEditing(null);
    setShowAdd(false);
    setForm({ category: "", monthlyLimit: 0 });
  };

  const save = async () => {
    if (!form.category) return;
    await fetch("/api/manage/budgets", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...form } : form),
    });
    reset();
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this budget category?")) return;
    await fetch("/api/manage/budgets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  return (
    <Card title="📊 Manage Budgets" subtitle={`${budgets.length} categories`}>
      <div className="flex justify-end mb-3 no-print">
        <button onClick={() => { setShowAdd(!showAdd); setEditing(null); }} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
          {showAdd ? "Cancel" : "+ Add Budget"}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="grid sm:grid-cols-[1fr_180px_auto] gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" placeholder="Monthly limit" value={form.monthlyLimit} onChange={(e) => setForm({ ...form, monthlyLimit: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save</button>
            <button onClick={reset} className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
          </div>
        </div>
      )}

      <Table headers={["Category", "Monthly Limit", "Actions"]} right={[1, 2]}>
        {budgets.map((b) => (
          <Tr key={b.id}>
            <Td><Badge>{b.category}</Badge></Td>
            <Td right strong>{inr(Number(b.monthlyLimit))}</Td>
            <Td right>
              <div className="flex justify-end gap-2 no-print">
                <button onClick={() => { setEditing(b.id); setShowAdd(false); setForm({ category: b.category, monthlyLimit: Number(b.monthlyLimit) }); }} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => del(b.id)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}
