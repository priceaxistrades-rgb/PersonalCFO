"use client";

import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { inr } from "@/lib/format";
import { generateMissionControl, type MissionControlData } from "@/lib/mission-control";
import type {
  TransactionRow, AccountRow, InvestmentRow, DebtRow,
  BillRow, GoalRow, InsuranceRow, BudgetRow,
} from "@/lib/types";

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
  const mc = generateMissionControl(data);

  const healthGrade = mc.healthScore.overall >= 90 ? "A+" : mc.healthScore.overall >= 80 ? "A" : mc.healthScore.overall >= 70 ? "B+" : mc.healthScore.overall >= 60 ? "B" : mc.healthScore.overall >= 50 ? "C" : mc.healthScore.overall >= 40 ? "D" : "F";
  const healthColor = mc.healthScore.overall >= 70 ? "var(--success)" : mc.healthScore.overall >= 50 ? "var(--warning)" : "var(--danger)";
  const stressColor = mc.stress.level === "Low" ? "var(--success)" : mc.stress.level === "Moderate" ? "var(--warning)" : "var(--danger)";

  // SVG gauge props
  const gaugeR = 54;
  const gaugeC = 2 * Math.PI * gaugeR;
  const healthOffset = gaugeC - (gaugeC * mc.healthScore.overall / 100);
  const stressOffset = gaugeC - (gaugeC * mc.stress.overallScore / 100);

  // Categorize brief items by tone
  const criticalItems = mc.brief.items.filter(i => i.tone === "danger");
  const warningItems = mc.brief.items.filter(i => i.tone === "warning");
  const goodItems = mc.brief.items.filter(i => i.tone === "success");

  return (
    <div className="space-y-4">
      {/* ═══ HERO KPI ROW ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 kpi-scroll lg:grid stagger-wide slide-in-up">
        <KpiCard label="Net Worth" value={inr(mc.netWorth, { compact: true })} icon="💎" tone="primary" />
        <KpiCard label="Monthly Savings" value={inr(mc.monthlySavings, { compact: true })} icon="💰" tone={mc.monthlySavings >= 0 ? "success" : "danger"} />
        <KpiCard label="Savings Rate" value={`${mc.savingsRate.toFixed(0)}%`} icon="📊" tone={mc.savingsRate >= 30 ? "success" : "warning"} />
        <KpiCard label="Emergency" value={`${mc.emergencyMonths.toFixed(1)} mo`} icon="🛟" tone={mc.emergencyMonths >= 6 ? "success" : "danger"} />
        <KpiCard label="Investments" value={inr(mc.investmentValue, { compact: true })} icon="📈" tone={mc.investmentGrowth >= 0 ? "success" : "danger"} />
      </div>

      {/* ═══ DUAL GAUGES: Health + Stress ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Health Score Gauge */}
        <Card>
          <Link href="/health" className="block">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>Financial Health</p>
              <div className="relative inline-block">
                <svg width="128" height="128" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r={gaugeR} fill="none" stroke="var(--surface-3)" strokeWidth="10" />
                  <circle
                    cx="64" cy="64" r={gaugeR} fill="none"
                    stroke={healthColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={gaugeC}
                    strokeDashoffset={healthOffset}
                    transform="rotate(-90 64 64)"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div>
                    <p className="text-3xl font-black" style={{ color: healthColor }}>{healthGrade}</p>
                    <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>{mc.healthScore.overall}/100</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {mc.healthScore.subScores.slice(0, 4).map(s => (
                  <span key={s.id} className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--surface-2)", color: s.score >= 60 ? "var(--success)" : "var(--warning)" }}>
                    {s.icon} {s.score}
                  </span>
                ))}
              </div>
              <p className="text-[10px] mt-2 font-medium" style={{ color: "var(--primary)" }}>View Full Health Score →</p>
            </div>
          </Link>
        </Card>

        {/* Stress Meter Gauge */}
        <Card>
          <Link href="/stress" className="block">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>Financial Stress</p>
              <div className="relative inline-block">
                <svg width="128" height="128" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r={gaugeR} fill="none" stroke="var(--surface-3)" strokeWidth="10" />
                  <circle
                    cx="64" cy="64" r={gaugeR} fill="none"
                    stroke={stressColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={gaugeC}
                    strokeDashoffset={stressOffset}
                    transform="rotate(-90 64 64)"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div>
                    <p className="text-3xl font-black" style={{ color: stressColor }}>{mc.stress.overallScore}</p>
                    <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>{mc.stress.level}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {mc.stress.factors.slice(0, 4).map(f => (
                  <span key={f.id} className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--surface-2)", color: f.score >= 50 ? "var(--danger)" : "var(--success)" }}>
                    {f.icon} {f.score}
                  </span>
                ))}
              </div>
              <p className="text-[10px] mt-2 font-medium" style={{ color: "var(--primary)" }}>View Stress Meter →</p>
            </div>
          </Link>
        </Card>
      </div>

      {/* ═══ MORNING BRIEF HIGHLIGHTS ═══ */}
      <Card>
        <Link href="/brief" className="block">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl grid place-items-center text-lg shadow" style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}>☀️</div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-heading)" }}>Morning Brief</h3>
              <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>Your daily financial overview</p>
            </div>
          </div>
          {criticalItems.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {criticalItems.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "var(--danger-soft)" }}>
                  <span className="text-sm">{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--danger)" }}>{item.title}</p>
                    <p className="text-[10px]" style={{ color: "var(--danger)" }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {warningItems.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {warningItems.slice(0, 2).map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "var(--warning-soft)" }}>
                  <span className="text-sm">{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--warning)" }}>{item.title}</p>
                    <p className="text-[10px]" style={{ color: "var(--warning)" }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {goodItems.length > 0 && (
            <div className="space-y-1.5">
              {goodItems.slice(0, 2).map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "var(--success-soft)" }}>
                  <span className="text-sm">{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--success)" }}>{item.title}</p>
                    <p className="text-[10px]" style={{ color: "var(--success)" }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {criticalItems.length === 0 && warningItems.length === 0 && goodItems.length === 0 && (
            <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>No alerts today — check back tomorrow ☀️</p>
          )}
          <p className="text-[10px] mt-2 font-medium text-right" style={{ color: "var(--primary)" }}>Full Morning Brief →</p>
        </Link>
      </Card>

      {/* ═══ WEALTH + BILLS + GOALS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Wealth Timeline */}
        <Card>
          <Link href="/wealth" className="block">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🗺️</span>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-heading)" }}>Wealth Timeline</h3>
            </div>
            {mc.timeline.milestones.length > 0 ? (
              <div className="space-y-2">
                {mc.timeline.milestones.slice(0, 4).map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="font-bold" style={{ color: "var(--text)" }}>{m.icon} {m.title}</span>
                      <span style={{ color: m.status === "achieved" ? "var(--success)" : "var(--text-faint)" }}>
                        {m.status === "achieved" ? "✅ Done" : `${m.progressPct.toFixed(0)}%`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${Math.min(100, m.progressPct)}%`,
                        background: m.status === "achieved" ? "var(--success)" : "linear-gradient(90deg, var(--primary), var(--accent))",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Add goals to see your timeline</p>
            )}
            <p className="text-[10px] mt-2 font-medium text-right" style={{ color: "var(--primary)" }}>Full Timeline →</p>
          </Link>
        </Card>

        {/* Upcoming Bills */}
        <Card>
          <Link href="/bills" className="block">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔔</span>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-heading)" }}>Upcoming Bills</h3>
            </div>
            {mc.upcomingBills.length > 0 ? (
              <div className="space-y-2">
                {mc.upcomingBills.map((b, i) => {
                  const due = new Date(b.dueDate);
                  const daysUntil = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const urgent = daysUntil <= 3;
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: urgent ? "var(--danger-soft)" : "var(--surface-2)" }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: "var(--text)" }}>{b.name}</p>
                        <p className="text-[10px]" style={{ color: urgent ? "var(--danger)" : "var(--text-faint)" }}>
                          {urgent ? `⚠️ ${daysUntil}d left` : due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <p className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{inr(b.amount, { compact: true })}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>No pending bills 🎉</p>
            )}
            <p className="text-[10px] mt-2 font-medium text-right" style={{ color: "var(--primary)" }}>All Bills →</p>
          </Link>
        </Card>

        {/* Goal Progress */}
        <Card>
          <Link href="/savings" className="block">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-heading)" }}>Goal Progress</h3>
            </div>
            {mc.goalProgress.length > 0 ? (
              <div className="space-y-2">
                {mc.goalProgress.slice(0, 4).map((g, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="font-bold" style={{ color: "var(--text)" }}>{g.name}</span>
                      <span style={{ color: g.pct >= 80 ? "var(--success)" : "var(--text-faint)" }}>{g.pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${Math.min(100, g.pct)}%`,
                        background: g.pct >= 80 ? "var(--success)" : g.pct >= 50 ? "var(--primary)" : "var(--warning)",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>No goals set yet</p>
            )}
            <p className="text-[10px] mt-2 font-medium text-right" style={{ color: "var(--primary)" }}>All Goals →</p>
          </Link>
        </Card>
      </div>

      {/* ═══ CASH FLOW + INVESTMENTS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💵</span>
            <h3 className="font-bold text-sm" style={{ color: "var(--text-heading)" }}>Cash Flow</h3>
          </div>
          <div className="space-y-2">
            <FlowBar label="Income" value={mc.monthlyIncome} max={mc.monthlyIncome} color="var(--success)" />
            <FlowBar label="Expenses" value={mc.monthlyExpense} max={mc.monthlyIncome} color="var(--danger)" />
            <FlowBar label="Savings" value={Math.max(0, mc.monthlySavings)} max={mc.monthlyIncome} color="var(--primary)" />
            <FlowBar label="EMI" value={mc.totalEMI} max={mc.monthlyIncome} color="var(--warning)" />
          </div>
        </Card>

        <Card>
          <Link href="/investments" className="block">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📈</span>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-heading)" }}>Investments</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Portfolio" value={inr(mc.investmentValue, { compact: true })} color="var(--text-heading)" />
              <MiniStat label="Invested" value={inr(mc.investedAmount, { compact: true })} color="var(--text-muted)" />
              <MiniStat label="Returns" value={`${mc.investedAmount > 0 ? ((mc.investmentGrowth / mc.investedAmount) * 100).toFixed(1) : "0"}%`} color={mc.investmentGrowth >= 0 ? "var(--success)" : "var(--danger)"} />
              <MiniStat label="Debt" value={inr(mc.totalDebt, { compact: true })} color={mc.totalDebt > 0 ? "var(--warning)" : "var(--success)"} />
            </div>
            <p className="text-[10px] mt-2 font-medium text-right" style={{ color: "var(--primary)" }}>All Investments →</p>
          </Link>
        </Card>
      </div>

      {/* ═══ OPPORTUNITIES ═══ */}
      {mc.opportunities.length > 0 && (
        <Card>
          <Link href="/opportunities" className="block">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔍</span>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-heading)" }}>Opportunities Found</h3>
              <Badge tone="success">{mc.opportunities.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mc.opportunities.slice(0, 4).map((opp, i) => (
                <div key={i} className="p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs font-bold" style={{ color: "var(--text-heading)" }}>{opp.icon} {opp.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{opp.detail}</p>
                  {opp.potentialSaving > 0 && (
                    <p className="text-[10px] font-bold mt-1" style={{ color: "var(--success)" }}>
                      Save {inr(opp.potentialSaving, { compact: true })}/mo
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-2 font-medium text-right" style={{ color: "var(--primary)" }}>All Opportunities →</p>
          </Link>
        </Card>
      )}

      {/* ═══ AI RECOMMENDATIONS ═══ */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤖</span>
          <h3 className="font-bold text-sm" style={{ color: "var(--text-heading)" }}>AI Recommendations</h3>
        </div>
        <div className="space-y-2">
          {mc.topRecommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: "var(--surface-2)" }}>
              <span className="text-sm flex-shrink-0">{i === 0 ? "🎯" : "💡"}</span>
              <p className="text-xs font-medium" style={{ color: "var(--text)" }}>{rec}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ═══ QUICK LINKS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { href: "/ai", icon: "🤖", label: "AI Twin" },
          { href: "/simulator", icon: "🔬", label: "Simulator" },
          { href: "/dreams", icon: "✨", label: "Dreams" },
          { href: "/coach", icon: "🧠", label: "Coach" },
        ].map(link => (
          <Link key={link.href} href={link.href} className="p-3 rounded-xl text-center transition-all active:scale-95" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <span className="text-2xl">{link.icon}</span>
            <p className="text-xs font-bold mt-1" style={{ color: "var(--text-heading)" }}>{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FlowBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="font-bold" style={{ color: "var(--text)" }}>{label}</span>
        <span style={{ color }}>{inr(value, { compact: true })}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2.5 rounded-lg text-center" style={{ background: "var(--surface-2)" }}>
      <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="text-sm font-extrabold mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}
