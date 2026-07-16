"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionTitle, Card, Badge } from "@/components/ui/Card";
import { inr, num } from "@/lib/format";
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
  AddMoreUnitsModal,
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
  const [addMoreTarget, setAddMoreTarget] = useState<InvestmentRow | null>(null);

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

      <InvestmentsAtAGlance investments={liveInvestments} />

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
        <InvestmentForm editingInvestment={editingInvestment} existingInvestments={initialInvestments as any} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingInvestment(null); }} />
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
        onAddMore={(i) => setAddMoreTarget(i)}
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
      {addMoreTarget && (
        <AddMoreUnitsModal
          investment={addMoreTarget}
          livePrice={livePriceMap.get(addMoreTarget.id) || null}
          onClose={() => setAddMoreTarget(null)}
          onAdded={() => { setAddMoreTarget(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

function InvestmentsAtAGlance({ investments }: { investments: LiveInvestment[] }) {
  const active = investments.filter((investment) => {
    const invested = num(investment.invested);
    const current = investment.liveCurrentValue || num(investment.currentValue);
    const units = num(investment.units);
    return invested > 0 || current > 0 || units > 0;
  });

  if (!active.length) return null;

  return (
    <Card
      title="Your Investment List"
      subtitle="All user-invested instruments visible in one compact view"
      className="investment-glance-card !p-4 sm:!p-5"
      action={<Badge tone="primary">{active.length} holdings</Badge>}
    >
      <div className="investment-glance-grid">
        {active.map((investment) => {
          const invested = num(investment.invested);
          const current = investment.liveCurrentValue || num(investment.currentValue);
          const pnl = current - invested;
          const code = investment.symbol || investment.schemeCode || investment.type;
          return (
            <div key={investment.id} className="investment-glance-item">
              <div className="min-w-0">
                <h3 className="investment-glance-name">{investment.name}</h3>
                <p className="investment-glance-meta">{investment.type} · {code}</p>
              </div>
              <div className="investment-glance-values">
                <span>{inr(current, { compact: true })}</span>
                <small className={pnl >= 0 ? "text-emerald-400" : "text-red-400"}>{pnl >= 0 ? "+" : "−"}{inr(Math.abs(pnl), { compact: true })}</small>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
