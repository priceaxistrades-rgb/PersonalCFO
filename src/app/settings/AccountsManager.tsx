"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { IconSavings } from "@/components/ui/Icons";
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
    <div id="accounts" className="scroll-mt-24 space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 shrink-0">
            <IconSavings size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Bank Accounts, Wallets & Cash Sources</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Sources v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Register and manage bank accounts, cash reserves, credit cards, digital wallets & household liquid sources</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => { setShowAdd(!showAdd); setEditing(null); }}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>{showAdd ? "Cancel Configuration ✕" : "+ Register New Account Source"}</span>
          </button>
        </div>
      </div>

      <Card title="Registered Household Account Sources" subtitle={`${accounts.length} accounts actively logged across household scope`} action={
        <button onClick={() => { setShowAdd(!showAdd); setEditing(null); }} className="btn btn-primary text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-md no-print cursor-pointer">
          {showAdd ? "Cancel ✕" : "+ Add Account Source"}
        </button>
      }>
        {(showAdd || editing) && (
          <div className="grid sm:grid-cols-5 gap-3 mb-6 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-lg animate-fade-in no-print">
            <div className="sm:col-span-5 pb-2 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                {editing ? "Modify Account Source Parameters" : "Register New Household Account Source"}
              </h4>
              <button onClick={() => { setEditing(null); setShowAdd(false); }} className="btn btn-ghost w-7 h-7 rounded-lg text-xs font-mono font-bold">✕</button>
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Account Name</label>
              <input placeholder="E.g. HDFC Salary Account" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input font-medium text-xs" />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Account Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input font-medium text-xs">
                {["Bank", "Cash", "Wallet", "CreditCard", "FixedDeposit", "PPF", "Gold", "RealEstate", "Other"].map((t) => (<option key={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Classification</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input font-medium text-xs">
                <option value="liquid">Liquid Balance</option>
                <option value="asset">Capital Asset</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-slate-300">Initial Balance (₹)</label>
              <input type="number" placeholder="50000" value={form.balance} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} className="input font-mono font-bold text-xs" />
            </div>
            <div className="flex items-end gap-2 pt-5">
              <button onClick={save} className="flex-1 btn btn-primary py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer">Save Account</button>
              <button onClick={() => { setEditing(null); setShowAdd(false); }} className="btn btn-ghost py-2 px-3 text-xs font-bold rounded-xl cursor-pointer border" style={{ borderColor: "var(--border)" }}>Cancel</button>
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
    </div>
  );
}
