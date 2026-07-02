import { SectionTitle, Badge, Card } from "@/components/ui/Card";
import { LiveMarkets } from "./LiveMarkets";
import { AddWatch } from "./AddWatch";
import { getWatchlist } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const items = await getWatchlist();

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Live Markets & CAGR"
        subtitle="Real-time NSE stock prices and mutual fund NAVs with rolling CAGR"
        action={<Badge tone="success">● Live data</Badge>}
      />

      <LiveMarkets items={items} />

      <AddWatch />

      <Card className="!p-4">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          📊 <span className="font-semibold" style={{ color: "var(--text)" }}>How it works: </span>
          Stock prices come from Yahoo Finance and mutual fund NAVs from AMFI (via mfapi.in) — both free and
          key-free. <span className="font-semibold" style={{ color: "var(--text)" }}>CAGR</span> (Compound Annual
          Growth Rate) is calculated from historical prices: <code>((End ÷ Start)^(1/years) − 1) × 100</code>.
          Prices auto-refresh every 60 seconds. Market data may be delayed 15–20 minutes.
        </p>
      </Card>
    </div>
  );
}
