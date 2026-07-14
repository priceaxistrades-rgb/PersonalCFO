"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { inr } from "@/lib/format";
import { generateMissionControl, type MissionControlData } from "@/lib/mission-control";
import type {
  TransactionRow, AccountRow, InvestmentRow, DebtRow,
  BillRow, GoalRow, InsuranceRow, BudgetRow,
} from "@/lib/types";
import {
  IconNetWorth, IconSavings, IconInvestments, IconEmergency,
  IconBrief, IconTimeline, IconBills, IconOpportunities, IconAI,
  IconSimulator, IconDreams, IconCoach, IconAlert, IconSparkles, IconDashboard, IconHealth
} from "@/components/ui/Icons";

type ControlProps = {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
  insurance: InsuranceRow[];
  budgets: BudgetRow[];
};

export function ControlClient(data: ControlProps) {
  const [calculationTime] = useState(() => Date.now());
  const mc = generateMissionControl(data);

  const healthGrade = mc.healthScore.overall >= 90 ? "A+" : mc.healthScore.overall >= 80 ? "A" : mc.healthScore.overall >= 70 ? "B+" : mc.healthScore.overall >= 60 ? "B" : mc.healthScore.overall >= 50 ? "C" : mc.healthScore.overall >= 40 ? "D" : "F";
  const healthColor = mc.healthScore.overall >= 70 ? "var(--success)" : mc.healthScore.overall >= 50 ? "var(--warning)" : "var(--danger)";
  const stressColor = mc.stress.level === "Low" ? "var(--success)" : mc.stress.level === "Moderate" ? "var(--warning)" : "var(--danger)";

  const gaugeR = 54;
  const gaugeC = 2 * Math.PI * gaugeR;
  const healthOffset = gaugeC - (gaugeC * mc.healthScore.overall / 100);
  const stressOffset = gaugeC - (gaugeC * mc.stress.overallScore / 100);

  const criticalItems = mc.brief.items.filter(i => i.tone === "danger");
  const warningItems = mc.brief.items.filter(i => i.tone === "warning");
  const goodItems = mc.brief.items.filter(i => i.tone === "success");

  return (
    <div className="space-y-6 animate-fade-in w-full select-none">
      {/* ─── SOVEREIGN COMMAND DECK HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 shrink-0">
            <IconDashboard size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>Sovereign Mission Control</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Command v6.0</span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>All live financial telemetry, automated asset vs liability coverage & real-time household diagnostics</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="btn btn-primary px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <span>+ Log Entry Hub</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>
        </div>
      </div>

      {/* ═══ HERO KPI ROW ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard label="Total Net Worth" value={inr(mc.netWorth, { compact: true })} icon={<IconNetWorth size={18} />} tone="primary" onClick={() => {}} />
        <KpiCard label="Monthly Savings" value={inr(mc.monthlySavings, { compact: true })} icon={<IconSavings size={18} />} tone={mc.monthlySavings >= 0 ? "success" : "danger"} onClick={() => {}} />
        <KpiCard label="Savings Rate" value={`${mc.savingsRate.toFixed(0)}%`} icon={<IconDashboard size={18} />} tone={mc.savingsRate >= 30 ? "success" : "warning"} onClick={() => {}} />
        <KpiCard label="Emergency Cover" value={`${mc.emergencyMonths.toFixed(1)} mo`} icon={<IconEmergency size={18} />} tone={mc.emergencyMonths >= 6 ? "success" : "danger"} onClick={() => {}} />
        <KpiCard label="Asset Portfolio" value={inr(mc.investmentValue, { compact: true })} icon={<IconInvestments size={18} />} tone={mc.investmentGrowth >= 0 ? "success" : "danger"} onClick={() => {}} />
      </div>

      {/* ═══ DUAL SOVEREIGN DIAGNOSTIC TOWERS (SPLIT COCKPIT) ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Health Tower */}
        <Card className="!p-6 border transition-all hover:border-indigo-500/40 shadow-xl" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between pb-4 border-b mb-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 shrink-0">
                <IconHealth size={16} />
              </span>
              <div>
                <h3 className="text-base font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>Financial Health Index</h3>
                <p className="text-[11px] font-medium text-slate-400">4-Pillar capital structure diagnostics</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest border" style={{ background: `${healthColor}15`, color: healthColor, borderColor: `${healthColor}40` }}>
              Grade {healthGrade}
            </span>
          </div>

          <div className="grid sm:grid-cols-12 gap-6 items-center">
            {/* Donut Dial */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
              <div className="relative inline-block my-1">
                <svg width="150" height="150" viewBox="0 0 128 128" className="overflow-visible">
                  <circle cx="64" cy="64" r={gaugeR} fill="none" stroke="var(--surface-3)" strokeWidth="12" />
                  <circle
                    cx="64" cy="64" r={gaugeR} fill="none"
                    stroke={healthColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={gaugeC}
                    strokeDashoffset={healthOffset}
                    transform="rotate(-90 64 64)"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div>
                    <p className="text-4xl font-black font-mono tabular-nums leading-none" style={{ color: healthColor }}>{healthGrade}</p>
                    <p className="text-[11px] font-mono font-extrabold tracking-tight mt-1" style={{ color: "var(--text-heading)" }}>{mc.healthScore.overall} / 100</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Score Telemetry Matrix */}
            <div className="sm:col-span-7 space-y-3">
              {mc.healthScore.subScores.slice(0, 4).map(s => (
                <div key={s.id} className="p-3 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                    <span style={{ color: "var(--text-heading)" }}>{s.label}</span>
                    <span className="font-mono" style={{ color: s.score >= 60 ? "var(--success)" : "var(--warning)" }}>{s.score}/100</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-surface-3">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, s.score))}%`, background: s.score >= 60 ? "var(--success)" : "var(--warning)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t flex justify-between items-center text-xs font-bold" style={{ borderColor: "var(--border)" }}>
            <span className="text-slate-400 font-medium">System evaluation: {mc.healthScore.overall >= 75 ? "Optimal capital buffer" : "Optimize cash flow & investment ratio"}</span>
            <Link href="/health" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 no-underline">
              <span>Diagnose Pillar Diagnostics →</span>
            </Link>
          </div>
        </Card>

        {/* Stress Tower */}
        <Card className="!p-6 border transition-all hover:border-indigo-500/40 shadow-xl" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between pb-4 border-b mb-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-400 shrink-0">
                <IconAlert size={16} />
              </span>
              <div>
                <h3 className="text-base font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>Financial Stress Meter</h3>
                <p className="text-[11px] font-medium text-slate-400">Real-time debt buffers & burn telemetry</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest border" style={{ background: `${stressColor}15`, color: stressColor, borderColor: `${stressColor}40` }}>
              {mc.stress.level} Risk
            </span>
          </div>

          <div className="grid sm:grid-cols-12 gap-6 items-center">
            {/* Donut Dial */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
              <div className="relative inline-block my-1">
                <svg width="150" height="150" viewBox="0 0 128 128" className="overflow-visible">
                  <circle cx="64" cy="64" r={gaugeR} fill="none" stroke="var(--surface-3)" strokeWidth="12" />
                  <circle
                    cx="64" cy="64" r={gaugeR} fill="none"
                    stroke={stressColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={gaugeC}
                    strokeDashoffset={stressOffset}
                    transform="rotate(-90 64 64)"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div>
                    <p className="text-4xl font-black font-mono tabular-nums leading-none" style={{ color: stressColor }}>{mc.stress.overallScore}</p>
                    <p className="text-[11px] font-mono font-extrabold tracking-tight uppercase mt-1" style={{ color: "var(--text-heading)" }}>{mc.stress.level}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Score Telemetry Matrix */}
            <div className="sm:col-span-7 space-y-3">
              {mc.stress.factors.slice(0, 4).map(f => (
                <div key={f.id} className="p-3 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                    <span style={{ color: "var(--text-heading)" }}>{f.label}</span>
                    <span className="font-mono" style={{ color: f.score >= 50 ? "var(--danger)" : "var(--success)" }}>{f.score}/100</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-surface-3">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, f.score))}%`, background: f.score >= 50 ? "var(--danger)" : "var(--success)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t flex justify-between items-center text-xs font-bold" style={{ borderColor: "var(--border)" }}>
            <span className="text-slate-400 font-medium">Risk status: {mc.stress.overallScore <= 30 ? "Stable liquidity buffer" : "Review burn rate & salary dependency"}</span>
            <Link href="/stress" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 no-underline">
              <span>View Stress Factors →</span>
            </Link>
          </div>
        </Card>
      </div>

      {/* ═══ MORNING BRIEF HIGHLIGHTS ═══ */}
      <Card className="hover:border-amber-500/30 transition-all">
        <Link href="/brief" className="block">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl grid place-items-center text-lg shadow-md" style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "#fff" }}>
                <IconBrief size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight" style={{ color: "var(--text-heading)" }}>Executive Morning Briefing</h3>
                <p className="text-xs font-medium text-slate-400">Automated daily financial intelligence report</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400">Full Brief →</span>
          </div>

          <div className="space-y-2.5">
            {criticalItems.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-red-500/30" style={{ background: "var(--danger-soft)" }}>
                <span className="text-red-400 shrink-0 mt-0.5"><IconAlert size={18} /></span>
                <div>
                  <p className="text-xs font-bold text-red-400 leading-snug">{item.title}</p>
                  <p className="text-[11px] text-red-300 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
            {warningItems.slice(0, 2).map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/30" style={{ background: "var(--warning-soft)" }}>
                <span className="text-amber-400 shrink-0 mt-0.5"><IconAlert size={18} /></span>
                <div>
                  <p className="text-xs font-bold text-amber-400 leading-snug">{item.title}</p>
                  <p className="text-[11px] text-amber-300 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
            {goodItems.slice(0, 2).map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-emerald-500/30" style={{ background: "var(--success-soft)" }}>
                <span className="text-emerald-400 shrink-0 mt-0.5"><IconSparkles size={18} /></span>
                <div>
                  <p className="text-xs font-bold text-emerald-400 leading-snug">{item.title}</p>
                  <p className="text-[11px] text-emerald-300 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
            {criticalItems.length === 0 && warningItems.length === 0 && goodItems.length === 0 && (
              <p className="text-sm font-medium text-center py-6" style={{ color: "var(--text-muted)" }}>All systems normal. No critical alerts today.</p>
            )}
          </div>
        </Link>
      </Card>

      {/* ═══ BENTO TIER: WEALTH + BILLS + GOALS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wealth Timeline */}
        <Card>
          <Link href="/wealth" className="block h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
                <span className="font-extrabold text-sm flex items-center gap-2" style={{ color: "var(--text-heading)" }}><IconTimeline size={16} className="text-indigo-400" /> Wealth Timeline</span>
                <span className="text-xs font-bold text-indigo-400">Map →</span>
              </div>
              {mc.timeline.milestones.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {mc.timeline.milestones.slice(0, 4).map((m, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span className="font-bold truncate" style={{ color: "var(--text)" }}>{m.title}</span>
                        <span className="font-mono font-bold" style={{ color: m.status === "achieved" ? "var(--success)" : "var(--text-faint)" }}>
                          {m.status === "achieved" ? "Achieved" : `${m.progressPct.toFixed(0)}%`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${Math.min(100, m.progressPct)}%`,
                          background: m.status === "achieved" ? "var(--success)" : "linear-gradient(90deg, var(--primary), var(--accent))",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>Add goals to build your roadmap</p>
              )}
            </div>
          </Link>
        </Card>

        {/* Upcoming Bills */}
        <Card>
          <Link href="/bills" className="block h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
                <span className="font-extrabold text-sm flex items-center gap-2" style={{ color: "var(--text-heading)" }}><IconBills size={16} className="text-amber-400" /> Scheduled Bills</span>
                <span className="text-xs font-bold text-indigo-400">Pay →</span>
              </div>
              {mc.upcomingBills.length > 0 ? (
                <div className="space-y-2.5 pt-1">
                  {mc.upcomingBills.map((b, i) => {
                    const due = new Date(b.dueDate);
                    const daysUntil = Math.ceil((due.getTime() - calculationTime) / (1000 * 60 * 60 * 24));
                    const urgent = daysUntil <= 3;
                    return (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ background: urgent ? "var(--danger-soft)" : "var(--surface-2)", borderColor: "var(--border)" }}>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: "var(--text)" }}>{b.name}</p>
                          <p className="text-[10px] font-semibold mt-0.5" style={{ color: urgent ? "var(--danger)" : "var(--text-faint)" }}>
                            {urgent ? `${daysUntil}d left` : due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <p className="text-xs font-extrabold font-mono tabular-nums ml-2 shrink-0" style={{ color: "var(--text-heading)" }}>{inr(b.amount, { compact: true })}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-center py-6 font-medium" style={{ color: "var(--text-muted)" }}>No pending bills right now.</p>
              )}
            </div>
          </Link>
        </Card>

        {/* Goal Progress */}
        <Card>
          <Link href="/savings" className="block h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
                <span className="font-extrabold text-sm flex items-center gap-2" style={{ color: "var(--text-heading)" }}><IconSavings size={16} className="text-emerald-400" /> Milestone Tracking</span>
                <span className="text-xs font-bold text-indigo-400">Vaults →</span>
              </div>
              {mc.goalProgress.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {mc.goalProgress.slice(0, 4).map((g, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span className="font-bold truncate" style={{ color: "var(--text)" }}>{g.name}</span>
                        <span className="font-mono font-bold" style={{ color: g.pct >= 80 ? "var(--success)" : "var(--text-faint)" }}>{g.pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{
                          width: `${Math.min(100, g.pct)}%`,
                          background: g.pct >= 80 ? "var(--success)" : g.pct >= 50 ? "var(--primary)" : "var(--warning)",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center py-6 font-medium" style={{ color: "var(--text-muted)" }}>No active goal milestones</p>
              )}
            </div>
          </Link>
        </Card>
      </div>

      {/* ═══ CASH FLOW + INVESTMENTS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Monthly Outflow Allocation" subtitle="Income distribution">
          <div className="space-y-3 pt-2">
            <FlowBar label="Gross Income" value={mc.monthlyIncome} max={mc.monthlyIncome} color="var(--success)" />
            <FlowBar label="Living Expenses" value={mc.monthlyExpense} max={mc.monthlyIncome} color="var(--danger)" />
            <FlowBar label="Net Capital Savings" value={Math.max(0, mc.monthlySavings)} max={mc.monthlyIncome} color="var(--primary)" />
            <FlowBar label="EMI Loan Outflows" value={mc.totalEMI} max={mc.monthlyIncome} color="var(--warning)" />
          </div>
        </Card>

        <Card title="Investment Performance" subtitle="Asset allocation statistics" action={
          <Link href="/investments" className="text-xs font-bold text-indigo-400">All Assets →</Link>
        }>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <MiniStat label="Total Portfolio" value={inr(mc.investmentValue, { compact: true })} color="var(--text-heading)" />
            <MiniStat label="Capital Invested" value={inr(mc.investedAmount, { compact: true })} color="var(--text-muted)" />
            <MiniStat label="Unrealized Yield" value={`${mc.investedAmount > 0 ? ((mc.investmentGrowth / mc.investedAmount) * 100).toFixed(1) : "0"}%`} color={mc.investmentGrowth >= 0 ? "var(--success)" : "var(--danger)"} />
            <MiniStat label="Total Liabilities" value={inr(mc.totalDebt, { compact: true })} color={mc.totalDebt > 0 ? "var(--warning)" : "var(--success)"} />
          </div>
        </Card>
      </div>

      {/* ═══ AI RECOMMENDATIONS & OPPORTUNITIES ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mc.opportunities.length > 0 && (
          <Card title="Detected Savings Opportunities" subtitle="Optimization scanner" action={<Badge tone="success">{mc.opportunities.length} active</Badge>}>
            <div className="space-y-2 pt-1">
              {mc.opportunities.slice(0, 3).map((opp, i) => (
                <div key={i} className="p-3 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold truncate flex items-center gap-1.5" style={{ color: "var(--text-heading)" }}>
                      <IconOpportunities size={14} className="text-indigo-400 shrink-0" /> {opp.title}
                    </p>
                    {opp.potentialSaving > 0 && (
                      <span className="text-xs font-mono font-bold text-emerald-400">Save {inr(opp.potentialSaving, { compact: true })}/mo</span>
                    )}
                  </div>
                  <p className="text-[11px] mt-1 font-medium text-slate-400 leading-relaxed">{opp.detail}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card title="AI Strategic Advisory" subtitle="Prioritized wealth actions">
          <div className="space-y-2.5 pt-1">
            {mc.topRecommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
                <span className="text-indigo-400 shrink-0 mt-0.5"><IconAI size={16} /></span>
                <p className="text-xs font-semibold leading-relaxed" style={{ color: "var(--text)" }}>{rec}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ═══ UNIVERSAL SUITE LAUNCHER ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/ai", icon: IconAI, label: "AI Financial Twin", desc: "Interactive advisory" },
          { href: "/simulator", icon: IconSimulator, label: "Life Simulator", desc: "Scenario modeling" },
          { href: "/dreams", icon: IconDreams, label: "Dream Planner", desc: "Major life milestones" },
          { href: "/coach", icon: IconCoach, label: "Wealth Coach", desc: "Personal guidance" },
        ].map(link => {
          const IconComp = link.icon;
          return (
            <Link key={link.href} href={link.href} className="p-4 rounded-2xl text-center transition-all duration-200 group border hover:border-indigo-500/40 hover:-translate-y-1 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <span className="inline-flex w-10 h-10 rounded-xl items-center justify-center bg-indigo-500/10 text-indigo-400 mb-2 transition-transform group-hover:scale-110"><IconComp size={20} /></span>
              <p className="text-xs font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>{link.label}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{link.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FlowBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 font-medium">
        <span className="font-bold" style={{ color: "var(--text)" }}>{label}</span>
        <span className="font-mono font-bold tabular-nums" style={{ color }}>{inr(value, { compact: true })}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl text-center border bg-surface-2" style={{ borderColor: "var(--border)" }}>
      <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="text-base font-extrabold font-mono tabular-nums mt-1" style={{ color }}>{value}</p>
    </div>
  );
}
