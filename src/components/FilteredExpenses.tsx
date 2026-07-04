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
    today: `${todayRows.length} entr${todayRows.length === 1 ? "y" : "ies"} today`,
    week: `${weekRows.length} entr${weekRows.length === 1 ? "y" : "ies"} in last 7 days`,
    month: `${monthRows.length} entr${monthRows.length === 1 ? "y" : "ies"} this month`,
    year: `${yearRows.length} entr${yearRows.length === 1 ? "y" : "ies"} this year`,
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
          <Td muted>{isEditing ? <input type="date" value={form.txnDate} onChange={(e) => setForm({ ...form, txnDate: e.target.value })} className="w-36 px-2 py-1 rounded border text-xs" style={inputStyle} /> : fmtDate(t.txnDate)}</Td>
          <Td>{isEditing ? <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-40 px-2 py-1 rounded border text-xs" style={inputStyle}>{[...new Set([...EXPENSE_CATEGORIES, ...expenses.map((i) => i.category)])].map((c) => <option key={c} value={c}>{c}</option>)}</select> : <Badge>{t.category}</Badge>}</Td>
          <Td muted>{isEditing ? <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="w-36 px-2 py-1 rounded border text-xs" style={inputStyle}><option value="">—</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select> : t.memberId ? memberMap.get(t.memberId) ?? "—" : "—"}</Td>
          <Td muted>{isEditing ? <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-44 px-2 py-1 rounded border text-xs" style={inputStyle} placeholder="Optional" /> : t.note || "—"}</Td>
          <Td right strong>{isEditing ? <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-28 px-2 py-1 rounded border text-xs text-right" style={inputStyle} /> : <span style={{ color: "var(--danger)" }}>−{mask(inr(num(t.amount)), key, mode)}</span>}</Td>
          <Td right>
            {isEditing ? (
              <div className="flex justify-end gap-1 no-print">
                <button onClick={saveEdit} disabled={saving} className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ background: "var(--success)", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving" : "Save"}</button>
                <button onClick={cancelEdit} className="px-2 py-1 rounded text-xs" style={{ background: "var(--surface-3)", color: "var(--text)" }}>Cancel</button>
              </div>
            ) : (
              <div className="flex justify-end gap-1 no-print">
                <button onClick={() => startEdit(t)} className="px-2 py-1 rounded text-xs" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>Edit</button>
                <button onClick={() => deleteExpense(t)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "var(--danger)" }}>Delete</button>
              </div>
            )}
          </Td>
        </Tr>
      );
    });

  return (
    <>
      {hasSelection && (
        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--primary)" }}>👤</span>
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>Showing expenses for: {selectedNames.join(", ")}</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Today" value={inr(todayTotal, { compact: true })} icon="📅" tone="accent" sub="parent privacy · click to view" onClick={() => openPanel("today")} active={activePanel === "today"} privacyMode="global" privacyKey="expense-today" />
        <KpiCard label="This Week" value={inr(weekTotal, { compact: true })} icon="🗓️" tone="primary" sub="click to view" onClick={() => openPanel("week")} active={activePanel === "week"} privacyKey="expense-week" />
        <KpiCard label="This Month" value={inr(monthTotal, { compact: true })} icon="🧾" tone="danger" sub={`${monthRows.length} entries · click to view`} onClick={() => openPanel("month")} active={activePanel === "month"} privacyKey="expense-month" />
        <KpiCard label="This Year" value={inr(yearTotal, { compact: true })} icon="📆" tone="warning" sub="click to view" onClick={() => openPanel("year")} active={activePanel === "year"} privacyKey="expense-year" />
      </div>

      <section className="card p-3 sm:p-5 fade-in">
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
          className="flex items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-3 cursor-pointer select-none rounded-xl"
        >
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight truncate" style={{ color: "var(--text)" }}>Expense Insight Drawer</h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{panelTitle[activePanel]} · {panelSubtitle[activePanel]}</p>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); togglePanel(activePanel); }} className="px-3 py-1.5 rounded-lg text-xs font-medium no-print shrink-0" style={{ background: "var(--surface-3)", color: "var(--text)" }}>{panelOpen[activePanel] ? "Hide" : "View"}</button>
        </header>

        <div className="overflow-hidden" style={{ maxHeight: panelOpen[activePanel] ? 900 : 0, opacity: panelOpen[activePanel] ? 1 : 0, transition: "max-height 180ms ease, opacity 140ms ease" }}>
          {error && <div className="mb-3 rounded-lg p-3 text-sm no-print" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>}
          {panelRows[activePanel].length ? (
            <Table headers={["Date", "Category", "Member", "Note", "Amount", "Actions"]} right={[4, 5]}>
              {renderExpenseRows(panelRows[activePanel], privacyKey[activePanel], activePanel === "today" ? "global" : "local")}
            </Table>
          ) : (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-faint)" }}>No expenses found for this period.</p>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Monthly Spend Trend" subtitle={hasSelection ? "Filtered" : "Last 6 months"} className="lg:col-span-2">
          <LineChart labels={flow.map((f) => f.label)} series={[{ name: "Expenses", values: flow.map((f) => f.expense), color: "#ef4444" }]} />
        </Card>
        <Card title="Category Split" subtitle="This month">
          {catData.length ? <DonutChart data={catData.slice(0, 8)} centerLabel="Total" centerValue={inr(monthTotal, { compact: true })} /> : <p className="text-sm py-10 text-center" style={{ color: "var(--text-faint)" }}>{hasSelection ? "No expenses for selected members" : "No expenses recorded"}</p>}
        </Card>
      </div>

      <Card title="Top Spending Categories" subtitle={hasSelection ? "Filtered" : "This month, ranked"}>
        <BarChart data={catData.slice(0, 10)} />
      </Card>
    </>
  );
}
