"use client";

import { Card, Badge } from "@/components/ui/Card";
import Link from "next/link";
import { useState } from "react";

export function AICFOFeature() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      title="🤖 AI CFO"
      subtitle="Your intelligent financial advisor"
      action={<Badge tone="warning">PRO</Badge>}
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl text-center" style={{ background: "linear-gradient(135deg, var(--primary-soft), var(--accent-soft, var(--primary-soft)))", border: "1px solid var(--border-accent)" }}>
          <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center text-3xl mb-3 shadow-lg" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#fff" }}>
            🤖
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-heading)" }}>AI Financial Twin</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Your digital financial profile that understands your complete money picture. Ask anything — from &quot;Can I afford this?&quot; to &quot;What if I lose my job?&quot;
          </p>
          <Link href="/ai" className="btn btn-primary py-2.5 px-6 text-sm">
            🤖 Open AI Financial Twin
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: "📊", title: "Smart Budget Analysis", desc: "AI analyzes your spending patterns and suggests optimal budgets" },
            { icon: "🎯", title: "Goal Optimization", desc: "Get recommendations on how to reach your goals faster" },
            { icon: "📉", title: "Risk Assessment", desc: "AI evaluates your investment portfolio risk and diversification" },
            { icon: "💡", title: "Tax Savings Tips", desc: "Personalized tax-saving suggestions based on your income profile" },
            { icon: "🔬", title: "Life Simulator", desc: "What if? Simulate salary changes, house purchase, job loss and more" },
            { icon: "😰", title: "Stress Meter", desc: "Measure your financial stress level and get actionable advice" },
          ].map((f, i) => (
            <div key={i} className="p-3 rounded-lg flex gap-3" style={{ background: "var(--surface-2)", opacity: 0.7 }}>
              <span className="text-xl flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{f.title}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {!expanded ? (
          <button onClick={() => setExpanded(true)} className="btn btn-primary w-full py-3 text-sm">
            🔓 Upgrade to Pro — ₹199/month
          </button>
        ) : (
          <div className="p-4 rounded-lg text-center" style={{ background: "var(--warning-soft)", border: "1px solid var(--warning)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--warning)" }}>🚧 Pro Plan coming soon!</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              AI CFO is currently in development. You&apos;ll be the first to know when it launches.
            </p>
            <button onClick={() => setExpanded(false)} className="btn btn-secondary mt-3 px-4 py-2 text-xs">Got it</button>
          </div>
        )}
      </div>
    </Card>
  );
}
