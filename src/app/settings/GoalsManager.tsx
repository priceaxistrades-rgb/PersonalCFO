"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, fmtDate } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };
const CATS = ["Emergency", "Vacation", "House", "Car", "Education", "Wedding", "Retirement", "Custom"];
const ICONS = ["🎯", "🐖", "🏡", "🚗", "🎓", "💍", "🌅", "🛟", "🏖️"];

export function GoalsManager({ goals }: { goals: { id: number; name: string; category: string; target: string; saved: string; deadline: string | null; icon: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Emergency", target: 0, saved: 0, deadline: "", icon: "🎯" });

  const save = async () => {
    if (!form.name) return;
    const payload = { ...form, deadline: form.deadline || null };
    await fetch("/api/manage/goals", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...payload } : payload),
    });
    setEditing(null);
    setShowAdd(false);
    setForm({ name: "", category: "Emergency", target: 0, saved: 0, deadline: "", icon: "🎯" });
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this goal?")) return;
    await fetch("/api/manage/goals", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  const pct = (saved: number, target: number) => target > 0 ? Math.round((saved / target) * 100) : 0;

  return (
    <Card title="🎯 Savings Goals" subtitle={`${goals.length} goals`}>
      <div className="flex justify-end mb-3 no-print">
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
          {showAdd ? "Cancel" : "+ Add Goal"}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="grid sm:grid-cols-4 gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
          <input placeholder="Goal Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
            {CATS.map((c) => (<option key={c}>{c}</option>))}
          </select>
          <input type="number" placeholder="Target Amount" value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="number" placeholder="Saved So Far" value={form.saved} onChange={(e) => setForm({ ...form, saved: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <input type="date" placeholder="Deadline" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
            {ICONS.map((i) => (<option key={i} value={i}>{i}</option>))}
          </select>
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save</button>
            <button onClick={() => { setEditing(null); setShowAdd(false); }} className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
          </div>
        </div>
      )}

      <Table headers={["Icon", "Name", "Category", "Target", "Saved", "Progress", "Deadline", "Actions"]} right={[3, 4, 5, 7]}>
        {goals.map((g) => (
          <Tr key={g.id}>
            <Td>{g.icon}</Td>
            <Td strong>{g.name}</Td>
            <Td><Badge>{g.category}</Badge></Td>
            <Td right>{inr(Number(g.target))}</Td>
            <Td right>{inr(Number(g.saved))}</Td>
            <Td right>{pct(Number(g.saved), Number(g.target))}%</Td>
            <Td muted>{g.deadline ? fmtDate(g.deadline) : "—"}</Td>
            <Td right>
              <div className="flex gap-2 justify-end no-print">
                <button onClick={() => { setEditing(g.id); setForm({ name: g.name, category: g.category, target: Number(g.target), saved: Number(g.saved), deadline: g.deadline || "", icon: g.icon }); }} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => del(g.id)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}
