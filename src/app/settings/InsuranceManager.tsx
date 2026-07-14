"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { IconInsurance } from "@/components/ui/Icons";
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
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 shrink-0">
            <IconInsurance size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Insurance Shield & Risk Coverage</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Shield v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Monitored term life policies, health insurance coverage sums, vehicle protections, and next renewal reminders</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center", { detail: { type: "insurance" } }))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Register Insurance Policy</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      <Card title="Registered Shield Policies" subtitle={`${insurance.length} active shield policies registered`} action={
        <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-md no-print cursor-pointer">
          {showAdd ? "Cancel Configuration ✕" : "+ Register Policy"}
        </button>
      }>
        {(showAdd || editing) && (
          <div className="grid sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 shadow-lg animate-fade-in no-print">
            <div className="sm:col-span-4 pb-2 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
              {editing ? "Modify Policy Parameters" : "Register New Insurance Shield Policy"}
            </h4>
            <button onClick={() => { setEditing(null); setShowAdd(false); }} className="btn btn-ghost w-7 h-7 rounded-lg text-xs font-mono font-bold">✕</button>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Policy Name</label>
            <input placeholder="E.g., HDFC Ergo Optima" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input font-medium" />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Insurance Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input font-medium">
              {TYPES.map((t) => (<option key={t}>{t}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Provider / Underwriter</label>
            <input placeholder="E.g., HDFC Ergo" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="input font-medium" />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Annual Premium (₹)</label>
            <input type="number" placeholder="25000" value={form.premium || ""} onChange={(e) => setForm({ ...form, premium: Number(e.target.value) })} className="input font-mono font-bold" />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Total Sum Assured (₹)</label>
            <input type="number" placeholder="1000000" value={form.coverage || ""} onChange={(e) => setForm({ ...form, coverage: Number(e.target.value) })} className="input font-mono font-bold" />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Next Renewal Date</label>
            <input type="date" value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} className="input font-mono font-medium" />
          </div>
          <div className="flex gap-2.5 items-end sm:col-span-2">
            <button onClick={save} className="btn btn-success px-5 py-2.5 text-xs font-bold shadow-md">Confirm Policy</button>
            <button onClick={() => { setEditing(null); setShowAdd(false); }} className="btn btn-secondary px-4 py-2.5 text-xs font-bold">Cancel</button>
          </div>
        </div>
      )}

      <Table headers={["Policy Name", "Type", "Provider", "Annual Premium", "Sum Assured", "Renewal Date", "Actions"]} right={[3, 4]}>
        {insurance.map((i) => (
          <Tr key={i.id}>
            <Td strong>{i.name}</Td>
            <Td><Badge tone="primary">{i.type}</Badge></Td>
            <Td muted className="font-medium">{i.provider}</Td>
            <Td right strong className="font-mono text-slate-300">{inr(Number(i.premium))}</Td>
            <Td right strong className="font-mono text-emerald-400">{inr(Number(i.coverage))}</Td>
            <Td muted className="font-mono">{fmtDate(i.renewalDate)}</Td>
            <Td right>
              <div className="flex gap-1.5 justify-end no-print">
                <button onClick={() => { setEditing(i.id); setForm({ name: i.name, type: i.type, provider: i.provider, premium: Number(i.premium), coverage: Number(i.coverage), renewalDate: i.renewalDate }); }} className="btn btn-ghost text-[11px] px-2.5 py-1 font-bold">Edit</button>
                <button onClick={() => del(i.id)} className="btn btn-danger text-[11px] px-2.5 py-1 font-bold">Remove</button>
              </div>
            </Td>
          </Tr>
        ))}
        {!insurance.length && (
          <Tr><Td muted className="py-8 text-center" strong>No insurance policies registered across household profiles.</Td><Td muted>—</Td><Td muted>—</Td><Td right muted>—</Td><Td right muted>—</Td><Td muted>—</Td><Td right muted>—</Td></Tr>
        )}
      </Table>
    </Card>
    </div>
  );
}
