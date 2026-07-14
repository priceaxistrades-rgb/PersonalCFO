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
import {
  IconIncome, IconDashboard, IconOpportunities, IconSparkles,
  IconUser, IconAlert
} from "@/components/ui/Icons";

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
                className="w-36 px-2.5 py-1.5 rounded-lg border text-xs font-mono"
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
                className="w-40 px-2.5 py-1.5 rounded-lg border text-xs font-medium"
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
                className="w-36 px-2.5 py-1.5 rounded-lg border text-xs font-medium"
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
                className="w-44 px-2.5 py-1.5 rounded-lg border text-xs font-medium"
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
                className="w-32 px-2.5 py-1.5 rounded-lg border text-xs text-right font-mono font-bold"
                style={inputStyle}
              />
            ) : (
              <span className="font-mono font-bold text-emerald-400">+{mask(inr(num(t.amount)), privacyKey, privacyMode)}</span>
            )}
          </Td>
          <Td right>
            {isEditing ? (
              <div className="flex justify-end gap-1.5 no-print">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all"
                  style={{ background: "var(--success)", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving" : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-white/[0.06]"
                  style={{ background: "var(--surface-3)", color: "var(--text)" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-1.5 no-print">
                <button
                  onClick={() => startEdit(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-indigo-500/20"
                  style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteIncome(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
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
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 shrink-0">
            <IconIncome size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Income Revenue Streams</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Inflow v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Categorized salary, business revenue, dividends & capital yield telemetry</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Income Stream</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      {hasSelection && (
        <Card className="!p-3.5 border-indigo-500/30 bg-indigo-500/10">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl grid place-items-center text-sm shadow-sm bg-indigo-500/20 text-indigo-400">
              <IconUser size={16} />
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Showing isolated income for: <strong className="font-bold" style={{ color: "var(--text-heading)" }}>{selectedNames.join(", ")}</strong>
            </span>
          </div>
        </Card>
      )}

      {/* Hero Bento Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="This Month Total"
          value={inr(total, { compact: true })}
          icon={<IconIncome size={18} />}
          tone="success"
          sub={`${thisMonthVisibleIncome.length} entr${thisMonthVisibleIncome.length === 1 ? "y" : "ies"} · click to inspect`}
          onClick={() => openPanel("month")}
          active={activePanel === "month"}
          privacyMode="global"
          privacyKey="income-month"
        />
        <KpiCard
          label="6-Month Average"
          value={inr(avg, { compact: true })}
          icon={<IconDashboard size={18} />}
          tone="primary"
          sub="historical inflow mean"
          onClick={() => openPanel("average")}
          active={activePanel === "average"}
          privacyKey="income-average"
        />
        <KpiCard
          label="Active Sources"
          value={String(catData.length)}
          icon={<IconOpportunities size={18} />}
          tone="accent"
          sub="income diversification"
          onClick={() => openPanel("sources")}
          active={activePanel === "sources"}
          privacyKey="income-sources"
        />
        <KpiCard
          label="Top Stream"
          value={topSource ? inr(topSource.value, { compact: true }) : "—"}
          icon={<IconSparkles size={18} />}
          tone="warning"
          sub={topSource?.label || "none recorded"}
          onClick={() => openPanel("top")}
          active={activePanel === "top"}
          privacyKey="income-top"
        />
      </div>

      {/* Interactive Drilldown Drawer */}
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
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-base font-extrabold tracking-tight truncate" style={{ color: "var(--text-heading)" }}>
                {panelTitle[activePanel]}
              </h3>
            </div>
            <p className="text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>
              {panelSubtitle[activePanel]}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePanel(activePanel);
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold no-print shrink-0 transition-colors hover:bg-white/[0.06]"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            {panelOpen[activePanel] ? "Collapse ▲" : "Expand ▼"}
          </button>
        </header>

        <div
          className="overflow-hidden transition-all duration-300"
          style={{
            maxHeight: panelOpen[activePanel] ? 1200 : 0,
            opacity: panelOpen[activePanel] ? 1 : 0,
          }}
        >
          {error && (
            <div className="mb-4 rounded-xl p-3.5 text-xs font-bold no-print flex items-center justify-between border border-red-500/40 bg-red-500/10 text-red-400">
              <span className="flex items-center gap-2"><IconAlert size={16} /> {error}</span>
              <button onClick={() => setError("")} className="btn btn-ghost text-xs px-2 py-0.5 font-mono">✕</button>
            </div>
          )}

          {activePanel === "month" && (
            thisMonthVisibleIncome.length ? (
              <Table headers={["Date", "Source Category", "Member", "Note", "Amount", "Actions"]} right={[4, 5]}>
                {renderIncomeRows(thisMonthVisibleIncome, "income-month", "global")}
              </Table>
            ) : (
              <div className="py-12 text-center border border-dashed rounded-2xl bg-surface-2/40" style={{ borderColor: "var(--border-strong)" }}>
                <span className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 grid place-items-center mx-auto mb-3">
                  <IconIncome size={24} />
                </span>
                <p className="text-sm font-bold" style={{ color: "var(--text-heading)" }}>No income logged this month</p>
                <p className="text-xs text-slate-400 mt-1">Use the &apos;+ Log Income&apos; button above or Universal Quick Entry to log your salary and inflows.</p>
              </div>
            )
          )}

          {activePanel === "average" && (
            <Table headers={["Historical Month", "Logged Entries", "Total Monthly Income"]} right={[1, 2]}>
              {flow.map((m) => {
                const entries = filteredIncome.filter((t) => getMonthKey(t.txnDate) === m.key);
                return (
                  <Tr key={m.key}>
                    <Td strong className="font-mono">{m.label}</Td>
                    <Td right className="font-semibold">{entries.length} entr{entries.length === 1 ? "y" : "ies"}</Td>
                    <Td right strong><span className="font-mono font-bold text-emerald-400">{mask(inr(m.income), "income-average", "local")}</span></Td>
                  </Tr>
                );
              })}
            </Table>
          )}

          {activePanel === "sources" && (
            sourceDetails.length ? (
              <Table headers={["Income Stream / Category", "Transaction Count", "Total Stream Inflow"]} right={[1, 2]}>
                {sourceDetails.map((source) => (
                  <Tr key={source.label}>
                    <Td strong><Badge tone="success">{source.label}</Badge></Td>
                    <Td right className="font-semibold">{source.entries.length} entr{source.entries.length === 1 ? "y" : "ies"}</Td>
                    <Td right strong><span className="font-mono font-bold text-emerald-400">{mask(inr(source.value), "income-sources", "local")}</span></Td>
                  </Tr>
                ))}
              </Table>
            ) : (
              <p className="text-sm py-10 text-center font-medium" style={{ color: "var(--text-faint)" }}>No income sources recorded for this month.</p>
            )
          )}

          {activePanel === "top" && (
            topSourceEntries.length ? (
              <Table headers={["Date", "Source Category", "Member", "Note", "Amount", "Actions"]} right={[4, 5]}>
                {renderIncomeRows(topSourceEntries, "income-top", "local")}
              </Table>
            ) : (
              <p className="text-sm py-10 text-center font-medium" style={{ color: "var(--text-faint)" }}>No top source details available right now.</p>
            )
          )}
        </div>
      </section>

      {/* Bento Charts Section */}
      <div className="bento-grid">
        <div className="bento-col-8">
          <Card title="Income Inflow Velocity" subtitle={hasSelection ? "Filtered Member Inflow Trend" : "6-Month Historical Revenue Trajectory"}>
            <div className="pt-2">
              <LineChart
                labels={flow.map((f) => f.label)}
                series={[{ name: "Income", values: flow.map((f) => f.income), color: "#10b981" }]}
              />
            </div>
          </Card>
        </div>
        <div className="bento-col-4 flex flex-col">
          <Card title="Stream Allocation" subtitle="This month's revenue share" className="flex-1 flex flex-col justify-center">
            {catData.length ? (
              <DonutChart data={catData} centerLabel="Total Inflow" centerValue={inr(total, { compact: true })} />
            ) : (
              <div className="py-12 text-center text-sm font-medium" style={{ color: "var(--text-faint)" }}>
                {hasSelection ? "No income logged for selected profiles" : "No income logged"}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
