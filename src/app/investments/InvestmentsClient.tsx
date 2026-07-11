"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionTitle } from "@/components/ui/Card";
import {
  useLiveInvestments,
  InvestmentHoldings,
  InvestmentAllocation,
  InvestmentFooter,
  type Investment,
  type LiveInvestment,
} from "./LiveInvestmentsDashboard";
import { PortfolioSyncDashboard } from "./PortfolioSyncDashboard";
import {
  InvestmentForm,
  InvestmentManagementTable,
  SellInvestmentModal,
} from "../settings/InvestmentsManager";
import type { InvestmentRow } from "@/lib/types";

export function InvestmentsPageClient({
  initialInvestments,
  accounts,
}: {
  initialInvestments: Investment[];
  accounts: { id: number; name: string; type: string }[];
}) {
  const router = useRouter();
  const { liveInvestments, loading, updatedAt, error, loadQuotes, quotes } = useLiveInvestments(initialInvestments);

  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentRow | null>(null);
  const [sellTarget, setSellTarget] = useState<InvestmentRow | null>(null);

  // Build a price lookup from live data
  const livePriceMap = new Map<number, number>();
  liveInvestments.forEach((li) => {
    if (li.livePrice) livePriceMap.set(li.id, li.livePrice);
  });

  const handleSave = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/manage/investments", {
      method: editingInvestment ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingInvestment ? { id: editingInvestment.id, ...payload } : payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(`Error: ${err.error || "Could not save investment"}`);
      return;
    }
    setShowForm(false);
    setEditingInvestment(null);
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this investment?")) return;
    await fetch("/api/manage/investments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  };

  const startEdit = (i: InvestmentRow) => {
    setEditingInvestment(i);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Investment Dashboard"
        subtitle="Live portfolio synced from stock prices and mutual fund NAVs"
      />

      {/* ═══ FULL PORTFOLIO SYNC DASHBOARD ═══ */}
      <PortfolioSyncDashboard
        holdings={liveInvestments}
        quotes={quotes}
        loading={loading}
        updatedAt={updatedAt}
        error={error}
        loadQuotes={loadQuotes}
        onSell={(h) => {
          setSellTarget(h as unknown as InvestmentRow);
        }}
      />

      <div className="flex justify-end mb-2 no-print">
        <button onClick={() => { setShowForm(!showForm); setEditingInvestment(null); }} className="btn btn-primary text-sm">
          {showForm ? "Cancel" : "+ Add Investment"}
        </button>
      </div>

      {showForm && (
        <InvestmentForm editingInvestment={editingInvestment} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingInvestment(null); }} />
      )}

      {/* Legacy holdings table (still useful for detailed view) */}
      <InvestmentHoldings
        liveInvestments={liveInvestments}
        onSell={(li: LiveInvestment) => {
          setSellTarget(li as unknown as InvestmentRow);
        }}
      />

      {/* Investment Management table */}
      <InvestmentManagementTable
        investments={initialInvestments as unknown as InvestmentRow[]}
        onEdit={startEdit}
        onDelete={handleDelete}
        onSell={(i) => setSellTarget(i)}
      />

      <InvestmentFooter />

      {sellTarget && (
        <SellInvestmentModal
          investment={sellTarget}
          livePrice={livePriceMap.get(sellTarget.id) || null}
          accounts={accounts}
          onClose={() => setSellTarget(null)}
          onSold={() => { setSellTarget(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
