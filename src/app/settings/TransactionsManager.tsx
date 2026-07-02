"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, fmtDate } from "@/lib/format";

export function TransactionsManager({ 
  transactions, 
  members 
}: { 
  transactions: { id: number; type: string; category: string; amount: string; txnDate: string; memberId: number | null; note: string | null }[];
  members: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const filtered = transactions.filter((t) => filter === "all" || t.type === filter);
  const memberName = (id: number | null) => members.find((m) => m.id === id)?.name ?? "—";

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((t) => t.id)));
  };

  const delSelected = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} transactions?`)) return;
    await fetch("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    router.refresh();
  };

  const delOne = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    await fetch("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  return (
    <Card title="🧾 Transactions" subtitle={`${filtered.length} shown (${selected.size} selected)`}>
      <div className="flex flex-wrap items-center gap-2 mb-3 no-print">
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-1.5 rounded-lg text-sm border" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <button onClick={toggleAll} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: "var(--surface-3)", color: "var(--text)" }}>
          {selected.size === filtered.length ? "Deselect All" : "Select All"}
        </button>
        {selected.size > 0 && (
          <button onClick={delSelected} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--danger)" }}>
            🗑 Delete {selected.size}
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-auto">
        <Table headers={["", "Date", "Type", "Category", "Member", "Amount", "Note", ""]} right={[5, 7]}>
          {filtered.slice(0, 100).map((t) => (
            <Tr key={t.id}>
              <Td>
                <input 
                  type="checkbox" 
                  checked={selected.has(t.id)} 
                  onChange={() => toggle(t.id)}
                  className="cursor-pointer"
                />
              </Td>
              <Td muted>{fmtDate(t.txnDate)}</Td>
              <Td>
                <Badge tone={t.type === "income" ? "success" : "danger"}>{t.type}</Badge>
              </Td>
              <Td>{t.category}</Td>
              <Td muted>{memberName(t.memberId)}</Td>
              <Td right strong>
                {t.type === "income" ? "+" : "−"}{inr(Number(t.amount))}
              </Td>
              <Td muted>{t.note || "—"}</Td>
              <Td right>
                <button 
                  onClick={() => delOne(t.id)} 
                  className="px-2 py-1 rounded text-xs text-white no-print"
                  style={{ background: "var(--danger)" }}
                >
                  Delete
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
      </div>
    </Card>
  );
}
