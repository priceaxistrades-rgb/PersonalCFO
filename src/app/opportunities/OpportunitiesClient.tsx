"use client";

import { Card, Badge } from "@/components/ui/Card";
import { inr } from "@/lib/format";
import { scanOpportunities, type Opportunity } from "@/lib/opportunity-scanner";
import { useRouter } from "next/navigation";

type ScannerData = Parameters<typeof scanOpportunities>[0];

export function OpportunitiesClient(data: ScannerData) {
  const opportunities = scanOpportunities(data);
  const router = useRouter();

  const totalPotentialSaving = opportunities.reduce((s, o) => s + o.potentialSaving, 0);

  const categoryLabels: Record<string, string> = {
    "unused-cash": "Idle Cash",
    overspending: "Overspending",
    subscriptions: "Subscriptions",
    "tax-savings": "Tax",
    investment: "Investment",
    "debt-optimize": "Debt",
  };

  const toneColors: Record<string, { bg: string; border: string; text: string }> = {
    success: { bg: "var(--success-soft)", border: "var(--success)", text: "var(--success)" },
    warning: { bg: "var(--warning-soft)", border: "var(--warning)", text: "var(--warning)" },
    danger: { bg: "var(--danger-soft)", border: "var(--danger)", text: "var(--danger)" },
    primary: { bg: "var(--primary-soft)", border: "var(--primary)", text: "var(--primary)" },
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      {totalPotentialSaving > 0 && (
        <Card style={{ borderColor: "var(--border-accent)", background: "linear-gradient(135deg, var(--primary-soft), var(--accent-soft, var(--primary-soft)))" }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>Potential Monthly Savings Found</p>
              <p className="text-2xl font-extrabold" style={{ color: "var(--text-heading)" }}>{inr(totalPotentialSaving, { compact: true })}<span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>/month</span></p>
            </div>
          </div>
        </Card>
      )}

      {opportunities.length === 0 ? (
        <Card className="text-center py-10">
          <span className="text-4xl mb-3 block">✅</span>
          <h3 className="text-lg font-bold" style={{ color: "var(--text-heading)" }}>No Issues Found!</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Your finances look optimized. Check back later.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {opportunities.map(opp => {
            const tc = toneColors[opp.tone] || toneColors.primary;
            return (
              <div
                key={opp.id}
                className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                style={{ background: tc.bg, border: `1px solid ${tc.border}` }}
                onClick={() => opp.action ? router.push(opp.action) : undefined}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" && opp.action) router.push(opp.action); }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{opp.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold" style={{ color: tc.text }}>{opp.title}</p>
                      <Badge tone={opp.tone === "danger" ? "danger" : opp.tone === "warning" ? "warning" : "primary"}>
                        {categoryLabels[opp.category] || opp.category}
                      </Badge>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{opp.detail}</p>
                    {opp.potentialSaving > 0 && (
                      <p className="text-xs font-bold mt-2" style={{ color: tc.text }}>
                        💰 Save ~{inr(opp.potentialSaving, { compact: true })}/month
                      </p>
                    )}
                  </div>
                  {opp.action && <span className="text-xs" style={{ color: tc.text }}>→</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
