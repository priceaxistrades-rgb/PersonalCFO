"use client";

import { Card, Badge } from "@/components/ui/Card";
import { IconOpportunities } from "@/components/ui/Icons";
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
    <div className="space-y-6 animate-fade-in w-full">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
            <IconOpportunities size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Optimization Scanner & Savings Potential</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Scanner v5.6</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Automated detection of idle cash reserves, subscription leaks, tax shield potential, and debt refinance opportunities</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Action Opportunity</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

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
