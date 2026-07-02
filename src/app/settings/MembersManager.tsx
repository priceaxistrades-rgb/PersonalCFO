"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };
const btnPrimary = { background: "var(--primary)", color: "#fff" };
const btnDanger = { background: "var(--danger)", color: "#fff" };

export function MembersManager({ members }: { members: { id: number; name: string; role: string; color: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", role: "Self", color: "#6366f1" });

  const save = async () => {
    if (!form.name) return;
    await fetch("/api/manage/members", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...form } : form),
    });
    setEditing(null);
    setShowAdd(false);
    setForm({ name: "", role: "Self", color: "#6366f1" });
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this member?")) return;
    await fetch("/api/manage/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  return (
    <Card title="👨‍👩‍👧‍👦 Family Members" subtitle={`${members.length} members`}>
      <div className="flex justify-end mb-3 no-print">
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={btnPrimary}>
          {showAdd ? "Cancel" : "+ Add Member"}
        </button>
      </div>

      {(showAdd || editing) && (
        <div className="grid sm:grid-cols-4 gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-3 py-2 rounded-lg text-sm border" style={inputStyle}>
            {["Self", "Spouse", "Child", "Parent", "Household"].map((r) => (<option key={r}>{r}</option>))}
          </select>
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="px-2 py-2 rounded-lg text-sm border h-10" style={inputStyle} />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--success)" }}>Save</button>
            <button onClick={() => { setEditing(null); setShowAdd(false); }} className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
          </div>
        </div>
      )}

      <Table headers={["Name", "Role", "Color", "Actions"]} right={[3]}>
        {members.map((m) => (
          <Tr key={m.id}>
            <Td strong>{m.name}</Td>
            <Td><Badge>{m.role}</Badge></Td>
            <Td><span className="inline-block w-4 h-4 rounded" style={{ background: m.color }} /></Td>
            <Td right>
              <div className="flex gap-2 justify-end no-print">
                <button onClick={() => { setEditing(m.id); setForm({ name: m.name, role: m.role, color: m.color }); }} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => del(m.id)} className="px-2 py-1 rounded text-xs text-white" style={btnDanger}>Delete</button>
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
    </Card>
  );
}
