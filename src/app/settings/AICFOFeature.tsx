"use client";

import { Card, Badge } from "@/components/ui/Card";
import Link from "next/link";
import { useState } from "react";
import {
  IconAI, IconDashboard, IconTarget, IconInvestments,
  IconOpportunities, IconSimulator, IconStress, IconArrowRight
} from "@/components/ui/Icons";

export function AICFOFeature() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      title="AI CFO Executive Suite"
      subtitle="Your autonomous digital financial advisory architecture"
      action={<Badge tone="primary">PRO ENGINE</Badge>}
    >
      <div className="space-y-6 pt-1">
        <div className="p-6 rounded-2xl text-center border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-surface-2 to-surface shadow-xl">
          <div className="inline-flex w-14 h-14 rounded-2xl grid place-items-center mb-4 shadow-lg text-white bg-gradient-to-tr from-indigo-500 to-purple-600">
            <IconAI size={28} />
          </div>
          <h3 className="text-xl font-extrabold mb-1 tracking-tight text-white">Autonomous Financial Twin</h3>
          <p className="text-sm font-medium mb-6 max-w-lg mx-auto text-slate-300 leading-relaxed">
            Your digital financial profile that continuously monitors household capital allocation, tax brackets, and liability buffers. Ask analytical questions or simulate major life scenarios.
          </p>
          <Link href="/ai" className="btn btn-primary py-3 px-8 text-xs font-bold rounded-xl shadow-lg inline-flex items-center gap-2">
            <span>Launch AI Financial Twin</span> <IconArrowRight size={14} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: IconDashboard, title: "Smart Budget Allocation", desc: "AI analyzes your spending velocity and recommends exact category ceilings" },
            { icon: IconTarget, title: "Milestone Feasibility Engine", desc: "Calculates SIP requirements to reach retirement and major milestones" },
            { icon: IconInvestments, title: "Concentration Risk Telemetry", desc: "Evaluates portfolio diversification and sector exposure ratios" },
            { icon: IconOpportunities, title: "Tax Shield Optimization", desc: "Identifies Old vs New marginal regime efficiency and 80C/80D utilization" },
            { icon: IconSimulator, title: "Life Scenario Modeling", desc: "Simulate salary changes, property purchase, and inflation shocks" },
            { icon: IconStress, title: "Financial Stress Telemetry", desc: "Measures debt-to-income buffers and calculates household resilience" },
          ].map((f, i) => {
            const IconComp = f.icon;
            return (
              <div key={i} className="p-4 rounded-2xl flex items-start gap-3.5 border border-white/[0.04] bg-surface-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 grid place-items-center shrink-0 mt-0.5"><IconComp size={18} /></span>
                <div>
                  <p className="text-xs font-bold text-white">{f.title}</p>
                  <p className="text-[11px] font-medium text-slate-400 leading-relaxed mt-0.5">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {!expanded ? (
          <button onClick={() => setExpanded(true)} className="btn btn-secondary w-full py-3.5 text-xs font-bold rounded-xl border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10">
            Configure AI Advisory Parameters →
          </button>
        ) : (
          <div className="p-5 rounded-2xl text-center border border-indigo-500/40 bg-indigo-500/10">
            <p className="text-sm font-bold text-white">AI Engine Status: Active & Operational</p>
            <p className="text-xs font-medium mt-1 text-slate-300 max-w-md mx-auto leading-relaxed">
              Your real-time transaction feeds, market valuations, and tax profiles are currently linked with the AI Financial Twin.
            </p>
            <button onClick={() => setExpanded(false)} className="btn btn-ghost mt-4 px-5 py-2 text-xs font-bold rounded-xl border border-white/10 text-white">Acknowledge</button>
          </div>
        )}
      </div>
    </Card>
  );
}
