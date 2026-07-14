"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMemberFilter } from "@/lib/filters";
import { usePrivacy } from "@/lib/privacy";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart, BarChart, LineChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num, fmtDate } from "@/lib/format";
import {
  IconExpenses, IconDashboard, IconBills, IconTimeline,
  IconAlert, IconUser
} from "@/components/ui/Icons";

const EXPENSE_CATEGORIES = [
  "Housing", "Food", "Groceries", "Electricity", "Water", "Gas", "Internet",
  "Mobile", "Transportation", "Fuel", "Insurance", "Medical", "Education",
  "Shopping", "Entertainment", "Subscriptions", "Travel", "Gifts",
  "Investments", "Miscellaneous",
];

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
};

type ExpenseTxn = {
  id: number;
  type: string;
  category: string;
  amount: string;
  txnDate: string;
  memberId: number | null;
  accountId: number | null;
  note: string | null;
};

type Member = { id: number; name: string };
type Account = { id: number; name: string; type: string };
type ExpensePanel = "today" | "week" | "month" | "year";

function dateKey(d: string | Date): string {
  return (typeof d === "string" ? d : d.toISOString()).slice(0, 10);
}

function getMonthKey(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function sumBy<T>(arr: T[], fn: (x: T) => number): number {
  return arr.reduce((s, x) => s + fn(x), 0);
}

function lastNMonths(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
    });
  }
  return out;
}

function monthlyExpense(txns: ExpenseTxn[], months: { key: string; label: string }[]) {
  return months.map((m) => ({
    ...m,
    expense: sumBy(txns.filter((t) => getMonthKey(t.txnDate) === m.key), (t) => num(t.amount)),
  }));
}

function expenseByCategory(txns: ExpenseTxn[]) {
  const map = new Map<string, number>();
  txns.forEach((t) => map.set(t.category, (map.get(t.category) || 0) + num(t.amount)));
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function FilteredExpenses({ expenses, members, accounts = [] }: { expenses: ExpenseTxn[]; members: Member[]; accounts?: Account[] }) {
  const router = useRouter();
  const { mask } = usePrivacy();
  const { isSelected, hasSelection, selectedIds } = useMemberFilter();
  const [activePanel, setActivePanel] = useState<ExpensePanel>("month");
  const [panelOpen, setPanelOpen] = useState<Record<ExpensePanel, boolean>>({ today: true, week: true, month: true, year: true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "Miscellaneous", amount: "", txnDate: "", memberId: "", note: "" });

  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const selectedNames = selectedIds.map((id) => memberMap.get(id)?.split(" ")[0]).filter(Boolean);
  const filteredExpenses = expenses.filter((t) => (t.memberId === null ? !hasSelection : isSelected(t.memberId)));
  const visibleExpenses = hasSelection ? filteredExpenses : expenses;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const month = getMonthKey(now);
  const year = String(now.getFullYear());

  const todayRows = visibleExpenses.filter((t) => dateKey(t.txnDate) === today);
  const weekRows = visibleExpenses.filter((t) => new Date(t.txnDate) >= weekAgo);
  const monthRows = visibleExpenses.filter((t) => getMonthKey(t.txnDate) === month);
  const yearRows = visibleExpenses.filter((t) => String(new Date(t.txnDate).getFullYear()) === year);

  const todayTotal = sumBy(todayRows, (t) => num(t.amount));
  const weekTotal = sumBy(weekRows, (t) => num(t.amount));
  const monthTotal = sumBy(monthRows, (t) => num(t.amount));
  const yearTotal = sumBy(yearRows, (t) => num(t.amount));

  const months = lastNMonths(6);
  const flow = monthlyExpense(filteredExpenses, months);
  const catData = expenseByCategory(monthRows);

  const panelRows: Record<ExpensePanel, ExpenseTxn[]> = {
    today: todayRows,
    week: weekRows,
    month: monthRows,
    year: yearRows,
  };

  const panelTitle: Record<ExpensePanel, string> = {
    today: "Today Expense Details",
    week: "This Week Expense Details",
    month: "This Month Expense Details",
    year: "This Year Expense Details",
  };

  const panelSubtitle: Record<ExpensePanel, string> = {
    today: `${todayRows.length} entr${todayRows.length === 1 ? "y" : "ies"} logged today`,
    week: `${weekRows.length} entr${weekRows.length === 1 ? "y" : "ies"} across last 7 days`,
    month: `${monthRows.length} entr${monthRows.length === 1 ? "y" : "ies"} logged this month`,
    year: `${yearRows.length} entr${yearRows.length === 1 ? "y" : "ies"} across ${year}`,
  };

  const privacyKey: Record<ExpensePanel, string> = {
    today: "expense-today",
    week: "expense-week",
    month: "expense-month",
    year: "expense-year",
  };

  const togglePanel = (panel: ExpensePanel) => {
    setPanelOpen((current) => ({ ...current, [panel]: !current[panel] }));
  };

  const openPanel = (panel: ExpensePanel) => {
    if (activePanel === panel) {
      togglePanel(panel);
      return;
    }
    setActivePanel(panel);
  };

  const startEdit = (txn: ExpenseTxn) => {
    setError("");
    setEditingId(txn.id);
    setForm({
      category: txn.category,
      amount: String(num(txn.amount)),
      txnDate: String(txn.txnDate).slice(0, 10),
      memberId: txn.memberId ? String(txn.memberId) : "",
      note: txn.note || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Enter a valid amount before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, type: "expense", category: form.category, amount: form.amount, txnDate: form.txnDate, memberId: form.memberId || null, note: form.note || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not update expense.");
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Network error while updating expense.");
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (txn: ExpenseTxn) => {
    if (!confirm(`Delete this expense entry of ${inr(num(txn.amount))}?`)) return;
    setError("");
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txn.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not delete expense.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while deleting expense.");
    }
  };

  const renderExpenseRows = (rows: ExpenseTxn[], key: string, mode: "global" | "local" = "local") =>
    rows.map((t) => {
      const isEditing = editingId === t.id;
      return (
        <Tr key={t.id}>
          <Td muted>
            {isEditing ? (
              <input type="date" value={form.txnDate} onChange={(e) => setForm({ ...form, txnDate: e.target.value })} className="w-36 px-2.5 py-1.5 rounded-lg border text-xs font-mono" style={inputStyle} />
            ) : (
              fmtDate(t.txnDate)
            )}
          </Td>
          <Td strong>
            {isEditing ? (
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-40 px-2.5 py-1.5 rounded-lg border text-xs font-medium" style={inputStyle}>
                {[...new Set([...EXPENSE_CATEGORIES, ...expenses.map((i) => i.category)])].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <Badge tone="danger">{t.category}</Badge>
            )}
          </Td>
          <Td muted>
            {isEditing ? (
              <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="w-36 px-2.5 py-1.5 rounded-lg border text-xs font-medium" style={inputStyle}>
                <option value="">—</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            ) : (
              t.memberId ? memberMap.get(t.memberId) ?? "—" : "—"
            )}
          </Td>
          <Td muted>
            {isEditing ? (
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-44 px-2.5 py-1.5 rounded-lg border text-xs font-medium" style={inputStyle} placeholder="Optional" />
            ) : (
              t.note || "—"
            )}
          </Td>
          <Td right strong>
            {isEditing ? (
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-32 px-2.5 py-1.5 rounded-lg border text-xs text-right font-mono font-bold" style={inputStyle} />
            ) : (
              <span className="font-mono font-bold text-red-400">−{mask(inr(num(t.amount)), key, mode)}</span>
            )}
          </Td>
          <Td right>
            {isEditing ? (
              <div className="flex justify-end gap-1.5 no-print">
                <button onClick={saveEdit} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all" style={{ background: "var(--success)", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving" : "Save"}</button>
                <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-white/[0.06]" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
              </div>
            ) : (
              <div className="flex justify-end gap-1.5 no-print">
                <button onClick={() => startEdit(t)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-indigo-500/20" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => deleteExpense(t)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90" style={{ background: "var(--danger)" }}>Delete</button>
              </div>
            )}
          </Td>
        </Tr>
      );
    });

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-red-500/20 shrink-0">
            <IconExpenses size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Expenditures & Spend Leak Telemetry</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">Outflow v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Categorized outflows, daily burn rates, and capital leak diagnostic breakdowns</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center", { detail: { type: "expense" } }))}
            className="btn btn-danger px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-red-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Outflow / Expense</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      {hasSelection && (
        <Card className="!p-3.5 border-indigo-500/30 bg-indigo-500/10">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg grid place-items-center text-xs bg-indigo-500/20 text-indigo-400">
              <IconUser size={16} />
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Showing isolated expenses for: <strong className="font-bold" style={{ color: "var(--text-heading)" }}>{selectedNames.join(", ")}</strong></span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Today Spend" value={inr(todayTotal, { compact: true })} icon={<IconExpenses size={18} />} tone="accent" sub="parent scope · click to inspect" onClick={() => openPanel("today")} active={activePanel === "today"} privacyMode="global" privacyKey="expense-today" />
        <KpiCard label="This Week" value={inr(weekTotal, { compact: true })} icon={<IconDashboard size={18} />} tone="primary" sub="last 7 days outflow" onClick={() => openPanel("week")} active={activePanel === "week"} privacyKey="expense-week" />
        <KpiCard label="This Month" value={inr(monthTotal, { compact: true })} icon={<IconBills size={18} />} tone="danger" sub={`${monthRows.length} entries · active panel`} onClick={() => openPanel("month")} active={activePanel === "month"} privacyKey="expense-month" />
        <KpiCard label="Year to Date" value={inr(yearTotal, { compact: true })} icon={<IconTimeline size={18} />} tone="warning" sub="annual outflow total" onClick={() => openPanel("year")} active={activePanel === "year"} privacyKey="expense-year" />
      </div>

      <section className="card p-4 sm:p-6.5 transition-all border rounded-3xl shadow-xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <header
          role="button"
          tabIndex={0}
          onClick={() => togglePanel(activePanel)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              togglePanel(activePanel);
            }
          }}
          className="flex items-center justify-between gap-3 cursor-pointer select-none pb-4 border-b mb-5"
          style={{ borderColor: "var(--border)" }}
          title={panelOpen[activePanel] ? "Click to collapse drawer" : "Click to expand drawer"}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <h3 className="text-base font-extrabold tracking-tight truncate" style={{ color: "var(--text-heading)" }}>{panelTitle[activePanel]}</h3>
            </div>
            <p className="text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>{panelSubtitle[activePanel]}</p>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); togglePanel(activePanel); }} className="px-3.5 py-1.5 rounded-xl text-xs font-bold no-print shrink-0 transition-colors hover:bg-white/[0.06]" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
            {panelOpen[activePanel] ? "Collapse ▲" : "Expand ▼"}
          </button>
        </header>

        <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: panelOpen[activePanel] ? 1200 : 0, opacity: panelOpen[activePanel] ? 1 : 0 }}>
          {error && <div className="mb-4 rounded-xl p-3.5 text-xs font-bold no-print flex items-center justify-between border border-red-500/40 bg-red-500/10 text-red-400"><span className="flex items-center gap-2"><IconAlert size={16} /> {error}</span><button onClick={() => setError("")} className="btn btn-ghost text-xs px-2 py-0.5 font-mono">✕</button></div>}
          {panelRows[activePanel].length ? (
            <Table headers={["Date", "Expense Category", "Member", "Note", "Amount", "Actions"]} right={[4, 5]}>
              {renderExpenseRows(panelRows[activePanel], privacyKey[activePanel], activePanel === "today" ? "global" : "local")}
            </Table>
          ) : (
            <div className="py-12 text-center border border-dashed rounded-2xl bg-surface-2/40" style={{ borderColor: "var(--border-strong)" }}>
              <span className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 grid place-items-center mx-auto mb-3">
                <IconExpenses size={24} />
              </span>
              <p className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>No expenses logged for this timeframe</p>
              <p className="text-xs text-slate-400 mt-1">Use &apos;+ Log Expense&apos; above or Universal Quick Entry to log daily spending.</p>
            </div>
          )}
        </div>
      </section>

      <div className="bento-grid">
        <div className="bento-col-8">
          <Card title="Monthly Spend Velocity" subtitle={hasSelection ? "Filtered Member Outflow Trend" : "6-Month Historical Expense Trajectory"}>
            <div className="pt-2">
              <LineChart labels={flow.map((f) => f.label)} series={[{ name: "Expenses", values: flow.map((f) => f.expense), color: "#ef4444" }]} />
            </div>
          </Card>
        </div>
        <div className="bento-col-4 flex flex-col">
          <Card title="Category Split" subtitle="This month's distribution" className="flex-1 flex flex-col justify-center">
            {catData.length ? (
              <DonutChart data={catData.slice(0, 8)} centerLabel="Total Spent" centerValue={inr(monthTotal, { compact: true })} />
            ) : (
              <div className="py-12 text-center text-sm font-medium" style={{ color: "var(--text-faint)" }}>
                {hasSelection ? "No expenses logged for selected profiles" : "No expenses logged"}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card title="Top Spending Categories Ranked" subtitle={hasSelection ? "Filtered Member Rankings" : "This month's highest expenditure allocations across all household accounts"}>
        <div className="pt-2">
          <BarChart data={catData.slice(0, 10)} />
        </div>
      </Card>
    </div>
  );
}
