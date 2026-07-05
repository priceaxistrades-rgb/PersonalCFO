"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
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

  const selectedCategory = customCat || form.category;

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
    <div className="space-y-4">
      {/* Category comparison */}
      {catStats.length > 0 && (
        <Card title="📊 Bills by Category" subtitle="Compare spending across categories">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {catStats.map((c) => {
              const paidPct = c.count > 0 ? (c.paid / c.count) * 100 : 0;
              return (
                <div
                  key={c.category}
                  className="p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold truncate" style={{ color: "var(--text-heading)" }}>
                      {c.category}
                    </span>
                    <span className="badge badge-neutral">{c.count}</span>
                  </div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>
                    {inr(c.total)}
                  </p>
                  <div className="mt-2 w-full rounded-full h-1.5" style={{ background: "var(--surface-4)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${paidPct}%`, background: paidPct >= 100 ? "var(--success)" : "var(--primary)" }}
                    />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                    {c.paid}/{c.count} paid
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card title="🔔 Bills" subtitle={`${bills.length} bills`}>
        <div className="flex justify-end mb-3 no-print">
          <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary text-sm">
            {showAdd ? "Cancel" : "+ Add Bill"}
          </button>
        </div>

        {(showAdd || editing) && (
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 p-4 rounded-xl fade-in-up" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Bill Name</label>
              <input placeholder="Electricity Bill" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Category</label>
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
                className="input"
              >
                {BILL_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                <option value="__custom">+ Custom Category…</option>
              </select>
              {customCat !== "" && (
                <input
                  placeholder="Enter custom category"
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  className="input mt-2"
                  autoFocus
                />
              )}
              {form.category === "__custom" && customCat === "" && (
                <input
                  placeholder="Enter custom category"
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  className="input mt-2"
                  autoFocus
                />
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Amount (₹)</label>
              <input type="number" placeholder="0" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-faint)" }}>Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="input">
                {["Monthly", "Quarterly", "Yearly", "One-time"].map((f) => (<option key={f}>{f}</option>))}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text)" }}>
                <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="w-4 h-4 rounded" />
                Paid
              </label>
            </div>
            <div className="flex gap-2 items-end sm:col-span-2">
              <button onClick={save} className="btn btn-success px-5 py-2.5">Save</button>
              <button onClick={() => { setEditing(null); setShowAdd(false); setCustomCat(""); }} className="btn btn-secondary px-4 py-2.5">Cancel</button>
            </div>
          </div>
        )}

        <Table headers={["Name", "Category", "Amount", "Due Date", "Frequency", "Status", "Actions"]} right={[2, 5]}>
          {bills.map((b) => (
            <Tr key={b.id}>
              <Td strong>{b.name}</Td>
              <Td><Badge tone="neutral">{b.category}</Badge></Td>
              <Td right>{inr(Number(b.amount))}</Td>
              <Td muted>{fmtDate(b.dueDate)}</Td>
              <Td><Badge>{b.frequency}</Badge></Td>
              <Td>{b.paid ? <span style={{ color: "var(--success)" }}>✓ Paid</span> : <span style={{ color: "var(--warning)" }}>Pending</span>}</Td>
              <Td right>
                <div className="flex gap-1 justify-end no-print">
                  <button onClick={() => { setEditing(b.id); setForm({ name: b.name, category: BILL_CATEGORIES.includes(b.category as any) ? b.category : "Other", amount: Number(b.amount), dueDate: b.dueDate, frequency: b.frequency, paid: b.paid }); if (!BILL_CATEGORIES.includes(b.category as any)) setCustomCat(b.category); }} className="btn btn-ghost text-[11px] px-2 py-1">Edit</button>
                  <button onClick={() => del(b.id)} className="btn btn-danger text-[11px] px-2 py-1">Delete</button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
