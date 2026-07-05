"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionTitle, Badge, Card } from "@/components/ui/Card";
import { LiveMarkets } from "./LiveMarkets";
import { AddWatch } from "./AddWatch";
import { InvestmentForm } from "../settings/InvestmentsManager";

export function MarketsClient({ 
  watchItemsPromise, 
  investmentsPromise 
}: { 
  watchItemsPromise: Promise<any[]>, 
  investmentsPromise: Promise<any[]> 
}) {
  const router = useRouter();
  const [watchItems, setWatchItems] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ symbol?: string; schemeCode?: string; name: string; kind: "stock" | "mf" } | null>(null);

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
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Live Markets & CAGR"
        subtitle="Market watchlist plus your investment-linked instruments, synced with Investments"
        action={<Badge tone="success">● Live data</Badge>}
      />

      <LiveMarkets items={items} onAddToPortfolio={handleAddToPortfolio} />

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-6 shadow-2xl border-2" style={{ borderColor: "var(--primary)" }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>💎</span> Add {selectedItem?.kind === "stock" ? "Stock" : "Mutual Fund"} to Portfolio
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 opacity-50 hover:opacity-100">✕</button>
            </div>
            <div className="mb-4 p-3 rounded-lg bg-var(--surface-2) border text-sm">
              <strong>Instrument:</strong> {selectedItem?.name} {selectedItem?.symbol && `(${selectedItem.symbol})`} {selectedItem?.schemeCode && `(Code: ${selectedItem.schemeCode})`}
            </div>
            <InvestmentForm 
              editingInvestment={null} 
              initialData={selectedItem ?? undefined}
              onSave={async (form) => {
                await fetch("/api/manage/investments", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(form),
                });
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
          Your investments with a stock symbol or MF scheme code automatically appear here. Stock prices come from Yahoo Finance and mutual fund NAVs from AMFI via mfapi.in. Stocks auto-refresh frequently; mutual fund NAVs update daily after fund houses publish NAV. Market data may be delayed.
        </p>
      </Card>
    </div>
  );
}

import { getInvestments, getWatchlist } from "@/lib/data";

export default async function MarketsPage() {
  const watchItemsPromise = getWatchlist();
  const investmentsPromise = getInvestments();

  return <MarketsClient watchItemsPromise={watchItemsPromise} investmentsPromise={investmentsPromise} />;
}
