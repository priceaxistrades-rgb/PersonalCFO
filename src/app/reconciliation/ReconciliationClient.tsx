"use client";

import { useMemo, useState } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { inr } from "@/lib/format";

type Row = {
  id: number; type: "income" | "expense"; category: string; amount: string;
  txnDate: string; note: string | null; accountId: number | null;
  reconciled: boolean; reconciledAt: string | null;
};

type View = "unreconciled" | "duplicates" | "reconciled" | "all";

function duplicateKey(row: Row) {
  return [row.type, row.category.trim().toLowerCase(), Number(row.amount).toFixed(2), row.txnDate, row.accountId || "none", (row.note || "").trim().toLowerCase()].join("|");
}

export function ReconciliationClient({ transactions }: { transactions: Row[] }) {
  const [rows, setRows] = useState(transactions);
  const [view, setView] = useState<View>("unreconciled");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const duplicateIds = useMemo(() => {
    const groups = new Map<string, number[]>();
    for (const row of rows) groups.set(duplicateKey(row), [...(groups.get(duplicateKey(row)) || []), row.id]);
    return new Set([...groups.values()].filter((ids) => ids.length > 1).flat());
  }, [rows]);

  const visible = useMemo(() => rows.filter((row) => {
    if (view === "unreconciled") return !row.reconciled;
    if (view === "reconciled") return row.reconciled;
    if (view === "duplicates") return duplicateIds.has(row.id);
    return true;
  }).sort((a, b) => b.txnDate.localeCompare(a.txnDate) || b.id - a.id), [duplicateIds, rows, view]);

  const counts = {
    unreconciled: rows.filter((row) => !row.reconciled).length,
    duplicates: duplicateIds.size,
    reconciled: rows.filter((row) => row.reconciled).length,
    all: rows.length,
  };

  const toggle = async (row: Row) => {
    setSavingId(row.id); setError("");
    try {
      const response = await fetch("/api/transactions/reconcile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, reconciled: !row.reconciled }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not update reconciliation status");
      const updated = payload.data?.row;
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, reconciled: Boolean(updated?.reconciled), reconciledAt: updated?.reconciledAt || null } : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Update failed"); }
    finally { setSavingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="reconcile-summary">
        <Summary label="Needs review" value={counts.unreconciled} tone="warning" />
        <Summary label="Potential duplicates" value={counts.duplicates} tone={counts.duplicates ? "danger" : "success"} />
        <Summary label="Verified" value={counts.reconciled} tone="success" />
        <Summary label="Total records" value={counts.all} tone="primary" />
      </div>

      <Card title="Review transactions" subtitle="Potential duplicates are exact matches and are never deleted automatically.">
        <div className="reconcile-tabs" role="tablist" aria-label="Reconciliation views">
          {(["unreconciled", "duplicates", "reconciled", "all"] as View[]).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={view === item} onClick={() => setView(item)} className={view === item ? "reconcile-tab-active" : ""}>
              {item === "unreconciled" ? "Needs review" : item === "duplicates" ? "Duplicates" : item === "reconciled" ? "Verified" : "All"} <span>{counts[item]}</span>
            </button>
          ))}
        </div>
        {error && <p className="reconcile-error" role="alert">{error}</p>}
        {visible.length === 0 ? <div className="reconcile-empty">No transactions in this view.</div> : (
          <div className="reconcile-list">
            {visible.map((row) => (
              <article key={row.id} className={`reconcile-row ${duplicateIds.has(row.id) ? "reconcile-row-duplicate" : ""}`}>
                <div className="reconcile-main">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong>{row.category}</strong>
                    <Badge tone={row.type === "income" ? "success" : "danger"}>{row.type}</Badge>
                    {duplicateIds.has(row.id) && <Badge tone="danger">Potential duplicate</Badge>}
                  </div>
                  <p>{row.note || "No description"}</p>
                  <small>{new Date(`${row.txnDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · Record #{row.id}</small>
                </div>
                <div className="reconcile-actions">
                  <strong>{row.type === "income" ? "+" : "−"}{inr(Number(row.amount))}</strong>
                  <button type="button" className={`btn ${row.reconciled ? "btn-secondary" : "btn-primary"}`} disabled={savingId === row.id} onClick={() => void toggle(row)}>
                    {savingId === row.id ? "Saving…" : row.reconciled ? "Mark unverified" : "Mark verified"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: number; tone: "primary" | "success" | "warning" | "danger" }) {
  return <div className="reconcile-summary-card" data-tone={tone}><span>{label}</span><strong>{value}</strong></div>;
}
