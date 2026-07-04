"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMemberFilter } from "@/lib/filters";
import { usePrivacy } from "@/lib/privacy";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart, LineChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num, fmtDate } from "@/lib/format";

const INCOME_CATEGORIES = [
  "Salary",
  "Business",
  "Freelancing",
  "Rental Income",
  "Dividends",
  "Interest",
  "Other Income",
];

const inputStyle = {
  background: "var(--surface-2)",
  borderColor: "var(--border)",
  color: "var(--text)",
};

type IncomeTxn = {
  id: number;
  type: string;
  category: string;
  amount: string;
  txnDate: string;
  memberId: number | null;
  accountId: number | null;
  note: string | null;
};

type Member = {
  id: number;
  name: string;
};

type Account = {
  id: number;
  name: string;
  type: string;
};

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

function monthlyFlow(txns: IncomeTxn[], months: { key: string; label: string }[]) {
  return months.map((m) => {
    const income = sumBy(
      txns.filter((t) => t.type === "income" && getMonthKey(t.txnDate) === m.key),
      (t) => num(t.amount)
    );
    return { ...m, income };
  });
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function FilteredIncome({
  income,
  members,
  accounts = [],
}: {
  income: IncomeTxn[];
  members: Member[];
  accounts?: Account[];
}) {
  const router = useRouter();
  const { mask } = usePrivacy();
  const { isSelected, hasSelection, selectedIds } = useMemberFilter();
  const [editingId, setEditingId] = useState<number | null>(null);
  type IncomePanel = "month" | "average" | "sources" | "top";
  const [activePanel, setActivePanel] = useState<IncomePanel>("month");
  const [panelOpen, setPanelOpen] = useState<Record<IncomePanel, boolean>>({
    month: true,
    average: true,
    sources: true,
    top: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    category: "Salary",
    amount: "",
    txnDate: "",
    memberId: "",
    note: "",
  });

  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const selectedNames = selectedIds.map((id) => memberMap.get(id)?.split(" ")[0]).filter(Boolean);

  const filteredIncome = income.filter((t) => (t.memberId === null ? !hasSelection : isSelected(t.memberId)));
  const visibleIncome = hasSelection ? filteredIncome : income;
  const cm = currentMonthKey();
  const thisMonthIncome = filteredIncome.filter((t) => getMonthKey(t.txnDate) === cm);
  const thisMonthVisibleIncome = visibleIncome.filter((t) => getMonthKey(t.txnDate) === cm);

  const months = lastNMonths(6);
  const flow = monthlyFlow(filteredIncome, months);
  const total = sumBy(thisMonthIncome, (t) => num(t.amount));
  const avg = flow.length > 0 ? sumBy(flow, (f) => f.income) / flow.length : 0;

  const byCat = new Map<string, number>();
  thisMonthIncome.forEach((t) => byCat.set(t.category, (byCat.get(t.category) || 0) + num(t.amount)));
  const catData = [...byCat.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const sourceDetails = catData.map((cat) => ({
    ...cat,
    entries: thisMonthIncome.filter((t) => t.category === cat.label),
  }));
  const topSource = catData[0];
  const topSourceEntries = topSource ? thisMonthIncome.filter((t) => t.category === topSource.label) : [];
  const categoryOptions = [...new Set([...INCOME_CATEGORIES, ...income.map((i) => i.category)])];

  const startEdit = (txn: IncomeTxn) => {
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
        body: JSON.stringify({
          id: editingId,
          type: "income",
          category: form.category,
          amount: form.amount,
          txnDate: form.txnDate,
          memberId: form.memberId || null,
          note: form.note || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not update income.");
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Network error while updating income.");
    } finally {
      setSaving(false);
    }
  };

  const deleteIncome = async (txn: IncomeTxn) => {
    if (!confirm(`Delete this income entry of ${inr(num(txn.amount))}?`)) return;
    setError("");
    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txn.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not delete income.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while deleting income.");
    }
  };

  const togglePanel = (panel: IncomePanel) => {
    setPanelOpen((current) => ({ ...current, [panel]: !current[panel] }));
  };

  const openPanel = (panel: IncomePanel) => {
    if (activePanel === panel) {
      togglePanel(panel);
      return;
    }
    setActivePanel(panel);
  };

  const renderIncomeRows = (rows: IncomeTxn[], privacyKey: string, privacyMode: "global" | "local" = "local") =>
    rows.map((t) => {
      const isEditing = editingId === t.id;
      return (
        <Tr key={t.id}>
          <Td muted>
            {isEditing ? (
              <input
                type="date"
                value={form.txnDate}
                onChange={(e) => setForm({ ...form, txnDate: e.target.value })}
                className="w-36 px-2 py-1 rounded border text-xs"
                style={inputStyle}
              />
            ) : (
              fmtDate(t.txnDate)
            )}
          </Td>
          <Td strong>
            {isEditing ? (
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-40 px-2 py-1 rounded border text-xs"
                style={inputStyle}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <Badge tone="success">{t.category}</Badge>
            )}
          </Td>
          <Td muted>
            {isEditing ? (
              <select
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                className="w-36 px-2 py-1 rounded border text-xs"
                style={inputStyle}
              >
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
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-44 px-2 py-1 rounded border text-xs"
                style={inputStyle}
                placeholder="Optional"
              />
            ) : (
              t.note || "—"
            )}
          </Td>
          <Td right strong>
            {isEditing ? (
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-28 px-2 py-1 rounded border text-xs text-right"
                style={inputStyle}
              />
            ) : (
              <span style={{ color: "var(--success)" }}>+{mask(inr(num(t.amount)), privacyKey, privacyMode)}</span>
            )}
          </Td>
          <Td right>
            {isEditing ? (
              <div className="flex justify-end gap-1 no-print">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-2 py-1 rounded text-xs font-semibold text-white"
                  style={{ background: "var(--success)", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving" : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-2 py-1 rounded text-xs"
                  style={{ background: "var(--surface-3)", color: "var(--text)" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-1 no-print">
                <button
                  onClick={() => startEdit(t)}
                  className="px-2 py-1 rounded text-xs"
                  style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteIncome(t)}
                  className="px-2 py-1 rounded text-xs text-white"
                  style={{ background: "var(--danger)" }}
                >
                  Delete
                </button>
              </div>
            )}
          </Td>
        </Tr>
      );
    });

  const panelTitle: Record<typeof activePanel, string> = {
    month: "This Month Income Details",
    average: "6-Month Average Details",
    sources: "Income Sources Details",
    top: "Top Source Details",
  };

  const panelSubtitle: Record<typeof activePanel, string> = {
    month: `${thisMonthVisibleIncome.length} entr${thisMonthVisibleIncome.length === 1 ? "y" : "ies"} · edit or delete directly here`,
    average: "Month-wise income used to calculate the average",
    sources: "This month source-wise income breakdown",
    top: topSource ? `${topSource.label} entries for this month` : "No top source this month",
  };

  return (
    <>
      {hasSelection && (
        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--primary)" }}>👤</span>
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Showing income for: {selectedNames.join(", ")}
            </span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="This Month"
          value={inr(total, { compact: true })}
          icon="💰"
          tone="success"
          sub={`${thisMonthVisibleIncome.length} entr${thisMonthVisibleIncome.length === 1 ? "y" : "ies"} · click to view`}
          onClick={() => openPanel("month")}
          active={activePanel === "month"}
          privacyMode="global"
          privacyKey="income-month"
        />
        <KpiCard
          label="6-Month Average"
          value={inr(avg, { compact: true })}
          icon="📊"
          tone="primary"
          sub="click to view"
          onClick={() => openPanel("average")}
          active={activePanel === "average"}
          privacyKey="income-average"
        />
        <KpiCard
          label="Income Sources"
          value={String(catData.length)}
          icon="🔗"
          tone="accent"
          sub="click to view"
          onClick={() => openPanel("sources")}
          active={activePanel === "sources"}
          privacyKey="income-sources"
        />
        <KpiCard
          label="Top Source"
          value={topSource ? inr(topSource.value, { compact: true }) : "—"}
          icon="⭐"
          tone="warning"
          sub={topSource?.label || "click to view"}
          onClick={() => openPanel("top")}
          active={activePanel === "top"}
          privacyKey="income-top"
        />
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
          title={panelOpen[activePanel] ? "Click to hide details" : "Click to view details"}
        >
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight truncate" style={{ color: "var(--text)" }}>
              Income Insight Drawer
            </h3>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
              {panelTitle[activePanel]} · {panelSubtitle[activePanel]}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePanel(activePanel);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium no-print shrink-0"
            style={{ background: "var(--surface-3)", color: "var(--text)" }}
          >
            {panelOpen[activePanel] ? "Hide" : "View"}
          </button>
        </header>

        <div
          className="overflow-hidden"
          style={{
            maxHeight: panelOpen[activePanel] ? 900 : 0,
            opacity: panelOpen[activePanel] ? 1 : 0,
            transition: "max-height 180ms ease, opacity 140ms ease",
          }}
        >
          {error && (
            <div className="mb-3 rounded-lg p-3 text-sm no-print" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          {activePanel === "month" && (
            thisMonthVisibleIncome.length ? (
              <Table headers={["Date", "Source", "Member", "Note", "Amount", "Actions"]} right={[4, 5]}>
                {renderIncomeRows(thisMonthVisibleIncome, "income-month", "global")}
              </Table>
            ) : (
              <p className="text-sm py-8 text-center" style={{ color: "var(--text-faint)" }}>
                No income recorded this month. Use the + Add Income button above to add one.
              </p>
            )
          )}

          {activePanel === "average" && (
            <Table headers={["Month", "Entries", "Income"]} right={[1, 2]}>
              {flow.map((m) => {
                const entries = filteredIncome.filter((t) => getMonthKey(t.txnDate) === m.key);
                return (
                  <Tr key={m.key}>
                    <Td strong>{m.label}</Td>
                    <Td right>{entries.length}</Td>
                    <Td right strong><span style={{ color: "var(--success)" }}>{mask(inr(m.income), "income-average", "local")}</span></Td>
                  </Tr>
                );
              })}
            </Table>
          )}

          {activePanel === "sources" && (
            sourceDetails.length ? (
              <Table headers={["Source", "Entries", "Amount"]} right={[1, 2]}>
                {sourceDetails.map((source) => (
                  <Tr key={source.label}>
                    <Td strong><Badge tone="success">{source.label}</Badge></Td>
                    <Td right>{source.entries.length}</Td>
                    <Td right strong><span style={{ color: "var(--success)" }}>{mask(inr(source.value), "income-sources", "local")}</span></Td>
                  </Tr>
                ))}
              </Table>
            ) : (
              <p className="text-sm py-8 text-center" style={{ color: "var(--text-faint)" }}>No income sources this month.</p>
            )
          )}

          {activePanel === "top" && (
            topSourceEntries.length ? (
              <Table headers={["Date", "Source", "Member", "Note", "Amount", "Actions"]} right={[4, 5]}>
                {renderIncomeRows(topSourceEntries, "income-top", "local")}
              </Table>
            ) : (
              <p className="text-sm py-8 text-center" style={{ color: "var(--text-faint)" }}>No top source details available.</p>
            )
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Income Trend" subtitle={hasSelection ? "Filtered" : "Monthly inflow"} className="lg:col-span-2">
          <LineChart
            labels={flow.map((f) => f.label)}
            series={[{ name: "Income", values: flow.map((f) => f.income), color: "#10b981" }]}
          />
        </Card>
        <Card title="Source Breakdown" subtitle="This month">
          {catData.length ? (
            <DonutChart data={catData} centerLabel="Total" centerValue={inr(total, { compact: true })} />
          ) : (
            <p className="text-sm py-10 text-center" style={{ color: "var(--text-faint)" }}>
              {hasSelection ? "No income for selected members" : "No income recorded"}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
