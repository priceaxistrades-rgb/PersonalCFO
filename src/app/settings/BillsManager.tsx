"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { IconBills } from "@/components/ui/Icons";
import { inr, fmtDate } from "@/lib/format";

const inputStyle = { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" };

export const BILL_CATEGORIES = [
  "Rent",
  "Electricity",
  "Gas",
  "Water",
  "Internet",
  "Phone / Mobile",
  "DTH / Cable",
  "Insurance Premium",
  "EMI",
  "Subscription",
  "Gym / Fitness",
  "Education Fee",
  "Maintenance",
  "Society / HOA",
  "Taxes",
  "Medical",
  "Transport",
  "Other",
] as const;

export function BillsManager({ bills }: { bills: { id: number; name: string; category: string; amount: string; dueDate: string; frequency: string; paid: boolean }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [customCat, setCustomCat] = useState("");
  const [form, setForm] = useState({ name: "", category: "Electricity", amount: 0, dueDate: "", frequency: "Monthly", paid: false });

  const save = async () => {
    if (!form.name) return;
    const payload = { ...form, category: customCat || form.category };
    await fetch("/api/manage/bills", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...payload } : payload),
    });
    setEditing(null);
    setShowAdd(false);
    setCustomCat("");
    setForm({ name: "", category: "Electricity", amount: 0, dueDate: "", frequency: "Monthly", paid: false });
    router.refresh();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this bill?")) return;
    await fetch("/api/manage/bills", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  // Category comparison stats
  const catMap = new Map<string, { total: number; count: number; paid: number }>();
  bills.forEach((b) => {
    const cat = b.category || "Other";
    const cur = catMap.get(cat) || { total: 0, count: 0, paid: 0 };
    cur.total += Number(b.amount);
    cur.count += 1;
    if (b.paid) cur.paid += 1;
    catMap.set(cat, cur);
  });
  const catStats = [...catMap.entries()]
    .map(([category, stats]) => ({ category, ...stats }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 shrink-0">
            <IconBills size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Scheduled Bills & Subscriptions</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">Payables v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Monitored household payables, recurring EMI obligations, and automated subscription status</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="btn btn-warning px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Schedule Payable / Bill</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      {/* Category comparison Bento */}
      {catStats.length > 0 && (
        <Card title="Bill Outflows & Allocation Breakdown" subtitle="Monitoring subscription & recurring liabilities across household allocations">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {catStats.map((c) => {
              const paidPct = c.count > 0 ? (c.paid / c.count) * 100 : 0;
              return (
                <div
                  key={c.category}
                  className="p-3.5 rounded-2xl transition-all duration-200 border shadow-sm"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold truncate tracking-tight" style={{ color: "var(--text-heading)" }}>
                      {c.category}
                    </span>
                    <span className="badge badge-neutral text-[10px] font-mono">{c.count}</span>
                  </div>
                  <p className="text-base font-extrabold font-mono tabular-nums" style={{ color: "var(--text-heading)" }}>
                    {inr(c.total)}
                  </p>
                  <div className="mt-2.5 w-full rounded-full h-1.5 overflow-hidden" style={{ background: "var(--surface-4)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${paidPct}%`, background: paidPct >= 100 ? "var(--success)" : "var(--primary)" }}
                    />
                  </div>
                  <p className="text-[10px] font-medium mt-1.5 flex justify-between" style={{ color: "var(--text-faint)" }}>
                    <span>Payment Status:</span>
                    <span className={paidPct >= 100 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{c.paid}/{c.count} cleared</span>
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card title="🔔 Scheduled Bills & Subscriptions" subtitle={`${bills.length} monitored payables`} action={
        <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary px-4 py-2 text-xs font-bold rounded-xl shadow-md no-print">
          {showAdd ? "Cancel ✕" : "+ Schedule New Bill"}
        </button>
      }>
        {(showAdd || editing) && (
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 p-5 rounded-2xl animate-fade-in border border-indigo-500/30 bg-indigo-500/10 shadow-lg no-print">
            <div className="sm:col-span-3 lg:col-span-4 pb-2 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                {editing ? "Edit Scheduled Bill" : "Schedule New Payable / Subscription"}
              </h4>
              <button onClick={() => { setEditing(null); setShowAdd(false); setCustomCat(""); }} className="btn btn-ghost w-7 h-7 rounded-lg text-xs">✕</button>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Bill / Payee Name</label>
              <input placeholder="E.g., Tata Power or Netflix" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Category</label>
              <select
                value={customCat ? "__custom" : form.category}
                onChange={(e) => {
                  if (e.target.value === "__custom") {
                    setCustomCat("");
                  } else {
                    setCustomCat("");
                    setForm({ ...form, category: e.target.value });
                  }
                }}
                className="input font-medium"
              >
                {BILL_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                <option value="__custom">+ Custom Category…</option>
              </select>
              {customCat !== "" && (
                <input
                  placeholder="Enter custom category"
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  className="input mt-2 font-medium"
                  autoFocus
                />
              )}
              {form.category === "__custom" && customCat === "" && (
                <input
                  placeholder="Enter custom category"
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  className="input mt-2 font-medium"
                  autoFocus
                />
              )}
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Amount (₹)</label>
              <input type="number" placeholder="0" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="input font-mono font-bold" />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Next Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input font-mono" />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="input font-medium">
                {["Monthly", "Quarterly", "Yearly", "One-time"].map((f) => (<option key={f}>{f}</option>))}
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer text-slate-200">
                <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="w-4 h-4 rounded ring-1 ring-white/20 text-indigo-500" />
                Mark as currently Paid
              </label>
            </div>
            <div className="flex gap-2 items-end sm:col-span-2">
              <button onClick={save} className="btn btn-success px-5 py-2.5 text-xs font-bold shadow-md">Confirm & Save</button>
              <button onClick={() => { setEditing(null); setShowAdd(false); setCustomCat(""); }} className="btn btn-secondary px-4 py-2.5 text-xs font-bold">Cancel</button>
            </div>
          </div>
        )}

        <Table headers={["Bill & Payee", "Category", "Scheduled Amount", "Due Date", "Frequency", "Payment Status", "Actions"]} right={[2]}>
          {bills.map((b) => (
            <Tr key={b.id}>
              <Td strong>{b.name}</Td>
              <Td><Badge tone="neutral">{b.category}</Badge></Td>
              <Td right strong className="font-mono text-sm text-indigo-300">{inr(Number(b.amount))}</Td>
              <Td muted className="font-medium">{fmtDate(b.dueDate)}</Td>
              <Td><Badge tone="primary">{b.frequency}</Badge></Td>
              <Td>
                {b.paid ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Cleared
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Pending
                  </span>
                )}
              </Td>
              <Td right>
                <div className="flex gap-1.5 justify-end no-print">
                  <button onClick={() => { setEditing(b.id); setForm({ name: b.name, category: BILL_CATEGORIES.includes(b.category as any) ? b.category : "Other", amount: Number(b.amount), dueDate: b.dueDate, frequency: b.frequency, paid: b.paid }); if (!BILL_CATEGORIES.includes(b.category as any)) setCustomCat(b.category); }} className="btn btn-ghost text-[11px] px-2.5 py-1 font-bold">Edit</button>
                  <button onClick={() => del(b.id)} className="btn btn-danger text-[11px] px-2.5 py-1 font-bold">Remove</button>
                </div>
              </Td>
            </Tr>
          ))}
          {!bills.length && (
            <Tr><Td muted className="py-8 text-center" strong>No recurring bills or subscriptions scheduled yet. Click '+ Schedule New Bill' to begin.</Td><Td muted>—</Td><Td right muted>—</Td><Td muted>—</Td><Td muted>—</Td><Td muted>—</Td><Td right muted>—</Td></Tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
