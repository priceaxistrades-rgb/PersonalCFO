"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionTitle, Badge, Card } from "@/components/ui/Card";
import { LiveMarkets } from "./LiveMarkets";
import { AddWatch } from "./AddWatch";
import { MarketsPortfolioSync } from "./MarketsPortfolioSync";
import { InvestmentForm, SellInvestmentModal } from "../settings/InvestmentsManager";
import type { InvestmentRow } from "@/lib/types";

export function MarketsClient({
  watchItemsPromise,
  investmentsPromise,
  accounts,
}: {
  watchItemsPromise: Promise<any[]>;
  investmentsPromise: Promise<any[]>;
  accounts: { id: number; name: string; type: string }[];
}) {
  const router = useRouter();
  const [watchItems, setWatchItems] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sellTarget, setSellTarget] = useState<InvestmentRow | null>(null);
  const [sellLivePrice, setSellLivePrice] = useState<number | null>(null);
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
  // Filter out fully-sold ghost holdings (invested=0, currentValue=0, units=0)
  const activeInvestments = investments.filter((inv: any) => {
    const invAmt = Number(inv.invested) || 0;
    const cv = Number(inv.currentValue) || 0;
    const u = Number(inv.units) || 0;
    return invAmt > 0 || cv > 0 || u > 0;
  });
  const investmentItems = activeInvestments
    .filter((investment) => {
      // Include all investments that have a symbol, scheme code, or a resolvable live tracker
      if (investment.symbol || investment.schemeCode) return true;
      // Also include Gold, Silver, Crypto, RealEstate, Bonds etc. even without explicit symbol
      if (["Gold", "Silver", "Crypto", "RealEstate", "Bonds", "FD", "PPF", "EPF", "NPS", "RD", "Other"].includes(investment.type)) return true;
      return false;
    })
    .map((investment) => {
      // Determine the kind for the watchlist item
      let kind = investment.schemeCode ? "mf" : "stock";
      if (investment.type === "Gold" || investment.type === "Silver") kind = "commodity";
      else if (investment.type === "Crypto") kind = "crypto";
      else if (investment.type === "RealEstate") kind = "reit";
      else if (investment.type === "Bonds") kind = "bond";
      else if (investment.schemeCode) kind = "mf";

      return {
        id: -investment.id,
        kind,
        symbol: investment.symbol,
        schemeCode: investment.schemeCode,
        label: investment.name,
        source: "investment" as const,
        units: investment.units,
        invested: investment.invested,
        currentValue: investment.currentValue,
        investmentId: investment.id,
        investmentType: investment.type,
      };
    });

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

  const handleSell = (item: any) => {
    // Find the real investment from our investments array
    const realId = item.investmentId || item.id;
    const inv = investments.find((i: any) => i.id === realId);
    if (!inv) return;
    setSellTarget({
      id: inv.id,
      name: inv.name,
      type: inv.type,
      invested: inv.invested,
      currentValue: inv.currentValue,
      annualReturn: inv.annualReturn,
      symbol: inv.symbol,
      schemeCode: inv.schemeCode,
      units: inv.units,
      startDate: inv.startDate,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      userId: inv.userId,
      memberId: inv.memberId,
    });
    setSellLivePrice(item.currentPrice || item.livePrice || null);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Live Markets & CAGR"
        subtitle="Market watchlist plus your investment-linked instruments"
        action={<Badge tone="success">● Live data</Badge>}
      />

      <LiveMarkets items={items} onAddToPortfolio={handleAddToPortfolio} onSell={handleSell} />

      {/* Portfolio Sync with Live Markets */}
      {activeInvestments.length > 0 && (
        <MarketsPortfolioSync investments={activeInvestments} onSell={handleSell} />
      )}

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
              existingInvestments={investments}
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

      {sellTarget && (
        <SellInvestmentModal
          investment={sellTarget}
          livePrice={sellLivePrice}
          accounts={accounts}
          onClose={() => { setSellTarget(null); setSellLivePrice(null); }}
          onSold={() => { setSellTarget(null); setSellLivePrice(null); router.refresh(); }}
        />
      )}

      <Card className="!p-4" style={{ border: "1px solid var(--border-accent)" }}>
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">🔗</span>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Auto-Sync Note</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Your investments with a stock symbol or MF scheme code automatically appear here. Stock prices from Yahoo Finance, mutual fund NAVs from AMFI via mfapi.in.
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Click <strong>+ Add</strong> to add a stock/MF to your portfolio — enter <strong>units + average buy price</strong>, and current value auto-calculates from live price.
            </p>
            <p className="text-xs font-medium" style={{ color: "var(--warning)" }}>
              💡 Always enter average buy price when adding investments. This ensures correct invested amount & P&L display in both Live Markets and Investment Dashboard.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
