"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionTitle, Badge, Card } from "@/components/ui/Card";
import { LiveMarkets } from "./LiveMarkets";
import { AddWatch } from "./AddWatch";
import { InvestmentForm } from "../settings/InvestmentsManager";

export function MarketsClient({
  watchItemsPromise,
  investmentsPromise,
}: {
  watchItemsPromise: Promise<any[]>;
  investmentsPromise: Promise<any[]>;
}) {
  const router = useRouter();
  const [watchItems, setWatchItems] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    symbol?: string;
    schemeCode?: string;
    name: string;
    kind: "stock" | "mf";
    price?: number;
    type?: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([watchItemsPromise, investmentsPromise]).then(([w, i]) => {
      setWatchItems(w);
      setInvestments(i);
    });
  }, [watchItemsPromise, investmentsPromise]);

  const manualItems = watchItems.map((item) => ({ ...item, source: "watchlist" as const }));
  const investmentItems = investments
    .filter((investment) => investment.symbol || investment.schemeCode)
    .map((investment) => ({
      id: -investment.id,
      kind: investment.schemeCode ? "mf" : "stock",
      symbol: investment.symbol,
      schemeCode: investment.schemeCode,
      label: investment.name,
      source: "investment" as const,
      units: investment.units,
      invested: investment.invested,
    }));

  const seen = new Set<string>();
  const items = [...manualItems, ...investmentItems].filter((item) => {
    const key = item.kind === "stock" ? `stock:${item.symbol}` : `mf:${item.schemeCode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const handleAddToPortfolio = (item: any) => {
    setSelectedItem({
      name: item.label,
      symbol: item.symbol,
      schemeCode: item.schemeCode,
      kind: item.kind === "stock" ? "stock" : "mf",
      price: item.currentPrice,
      type: item.kind === "stock" ? "Stocks" : "MutualFunds",
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Live Markets & CAGR"
        subtitle="Market watchlist plus your investment-linked instruments"
        action={<Badge tone="success">● Live data</Badge>}
      />

      <LiveMarkets items={items} onAddToPortfolio={handleAddToPortfolio} />

      {showAddModal && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <Card variant="glass" className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto scale-in" style={{ borderColor: "var(--border-accent)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-heading)" }}>
                <span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>💎</span>
                Add {selectedItem.kind === "stock" ? "Stock" : "Mutual Fund"} to Portfolio
              </h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost w-8 h-8 rounded-full text-xs">✕</button>
            </div>
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span className="font-semibold" style={{ color: "var(--text-heading)" }}>{selectedItem.name}</span>
              {selectedItem.symbol && <span className="ml-2 badge badge-primary">{selectedItem.symbol}</span>}
              {selectedItem.schemeCode && <span className="ml-2 badge badge-primary">Code: {selectedItem.schemeCode}</span>}
              {selectedItem.price ? (
                <span className="ml-2 badge badge-success">Live: ₹{selectedItem.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              ) : null}
            </div>
            <InvestmentForm
              editingInvestment={null}
              initialData={selectedItem}
              onSave={async (payload) => {
                const res = await fetch("/api/manage/investments", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  alert(`Error: ${err.error || "Could not add investment"}`);
                  return;
                }
                setShowAddModal(false);
                router.refresh();
              }}
              onCancel={() => setShowAddModal(false)}
            />
          </Card>
        </div>
      )}

      <AddWatch />

      <Card className="!p-4">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          📊 <span className="font-semibold" style={{ color: "var(--text)" }}>How it works: </span>
          Your investments with a stock symbol or MF scheme code automatically appear here. Stock prices from Yahoo Finance, mutual fund NAVs from AMFI via mfapi.in. Click <strong>+ Add</strong> to add a stock/MF to your portfolio — just enter units &amp; average buy price, and current value auto-calculates from live price.
        </p>
      </Card>
    </div>
  );
}
