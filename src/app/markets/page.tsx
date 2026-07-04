import { SectionTitle, Badge, Card } from "@/components/ui/Card";
import { LiveMarkets } from "./LiveMarkets";
import { AddWatch } from "./AddWatch";
import { getInvestments, getWatchlist } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const [watchItems, investments] = await Promise.all([getWatchlist(), getInvestments()]);

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

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Live Markets & CAGR"
        subtitle="Market watchlist plus your investment-linked instruments, synced with Investments"
        action={<Badge tone="success">● Live data</Badge>}
      />

      <LiveMarkets items={items} />

      <AddWatch />

      <Card className="!p-4">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          📊 <span className="font-semibold" style={{ color: "var(--text)" }}>How it works: </span>
          Your investments with a stock symbol or MF scheme code automatically appear here. Stock prices come from Yahoo Finance and mutual fund NAVs from AMFI via mfapi.in. Stocks auto-refresh frequently; mutual fund NAVs update daily after fund houses publish NAVs. Market data may be delayed.
        </p>
      </Card>
    </div>
  );
}
