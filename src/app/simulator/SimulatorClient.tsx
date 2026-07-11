"use client";

import { useState, useCallback } from "react";
import { Card, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { inr } from "@/lib/format";
import { buildTwinProfile, simulateScenario, type TwinProfile, type TwinScenario } from "@/lib/financial-twin";
import type { TransactionRow, AccountRow, InvestmentRow, DebtRow, BillRow, GoalRow, InsuranceRow } from "@/lib/types";

type SimulatorData = {
  txns: TransactionRow[];
  accounts: AccountRow[];
  investments: InvestmentRow[];
  debts: DebtRow[];
  bills: BillRow[];
  goals: GoalRow[];
  insurance: InsuranceRow[];
};

const SCENARIOS = [
  { id: "salaryIncrease", label: "Salary Increase", icon: "📈", unit: "%", defaultVal: 20 },
  { id: "salaryDecrease", label: "Salary Decrease", icon: "📉", unit: "%", defaultVal: 20 },
  { id: "housePurchase", label: "House Purchase", icon: "🏠", unit: "₹", defaultVal: 5000000 },
  { id: "carPurchase", label: "Car Purchase", icon: "🚗", unit: "₹", defaultVal: 1000000 },
  { id: "jobLoss", label: "Job Loss", icon: "⚠️", unit: "", defaultVal: 100 },
  { id: "inflation", label: "Inflation Impact", icon: "📊", unit: "%", defaultVal: 8 },
  { id: "childEducation", label: "Child Education", icon: "🎓", unit: "₹", defaultVal: 2000000 },
  { id: "medicalEmergency", label: "Medical Emergency", icon: "🏥", unit: "₹", defaultVal: 500000 },
] as const;

type ScenarioId = typeof SCENARIOS[number]["id"];

const VALID_SCENARIOS: ScenarioId[] = ["salaryIncrease", "salaryDecrease", "housePurchase", "carPurchase", "jobLoss", "inflation", "childEducation", "medicalEmergency"];

export function SimulatorClient(data: SimulatorData) {
  const profile = buildTwinProfile(data);
  const [scenarioId, setScenarioId] = useState<string>("salaryIncrease");
  const [value, setValue] = useState<number>(20);
  const [result, setResult] = useState<TwinScenario | null>(null);
  const [error, setError] = useState<string>("");

  const handleScenarioChange = (id: string) => {
    setScenarioId(id);
    const sc = SCENARIOS.find(s => s.id === id);
    if (sc) setValue(sc.defaultVal);
    setResult(null);
    setError("");
  };

  // Compute locally — no API call needed, all data is already available
  const runSimulation = useCallback(() => {
    setError("");
    try {
      const sc = SCENARIOS.find(s => s.id === scenarioId);
      const isPercent = sc?.unit === "%";
      const params = isPercent ? { percent: value } : { amount: value };
      const scenarioType = scenarioId as typeof VALID_SCENARIOS[number];
      if (!VALID_SCENARIOS.includes(scenarioType)) {
        setError("Invalid scenario selected");
        return;
      }
      const simResult = simulateScenario(profile, scenarioType, params);
      setResult(simResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed. Please try again.");
    }
  }, [scenarioId, value, profile]);

  const selectedScenario = SCENARIOS.find(s => s.id === scenarioId);
  const isPercent = selectedScenario?.unit === "%";

  return (
    <div className="space-y-4">
      {/* Current Position */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 kpi-scroll lg:grid stagger-wide slide-in-up">
        <KpiCard label="Net Worth" value={inr(profile.netWorth, { compact: true })} icon="💎" tone="primary" />
        <KpiCard label="Monthly Savings" value={inr(profile.monthlySavings, { compact: true })} icon="💰" tone="success" />
        <KpiCard label="Emergency" value={`${profile.emergencyMonths.toFixed(1)} mo`} icon="🛟" tone={profile.emergencyMonths >= 6 ? "success" : "warning"} />
        <KpiCard label="Health Score" value={`${profile.healthScore}/100`} icon="❤️" tone={profile.healthScore >= 60 ? "success" : "warning"} />
      </div>

      {/* Scenario Selection */}
      <Card>
        <div className="text-center mb-4">
          <div className="inline-flex w-12 h-12 rounded-2xl grid place-items-center text-2xl mb-2 shadow-lg gradient-primary">🔬</div>
          <h3 className="text-lg font-bold" style={{ color: "var(--text-heading)" }}>Choose a Life Event</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>See how it impacts your finances</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {SCENARIOS.map(sc => (
            <button
              key={sc.id}
              onClick={() => handleScenarioChange(sc.id)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: scenarioId === sc.id ? "var(--primary-soft)" : "var(--surface-2)",
                border: scenarioId === sc.id ? "2px solid var(--primary)" : "2px solid var(--border)",
                minHeight: "72px",
              }}
            >
              <span className="text-xl">{sc.icon}</span>
              <p className="text-xs font-bold mt-1" style={{ color: scenarioId === sc.id ? "var(--primary)" : "var(--text-muted)" }}>{sc.label}</p>
            </button>
          ))}
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-faint)" }}>
              {isPercent ? "Percentage (%)" : "Amount (₹)"}
            </label>
            <input
              type="number"
              value={value}
              onChange={e => setValue(Number(e.target.value))}
              className="input"
              style={{ minHeight: "44px" }}
              aria-label="Simulation value"
            />
          </div>
          <button
            onClick={runSimulation}
            className="btn btn-primary px-6 whitespace-nowrap"
            style={{ minHeight: "44px" }}
          >
            ▶ Simulate Impact
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
            ⚠️ {error}
          </div>
        )}
      </Card>

      {/* Result */}
      {result && (
        <Card title={`🔬 ${result.name}`} subtitle={result.description}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <ImpactMetric label="Net Worth Change" value={result.impact.netWorthChange} isMoney />
            <ImpactMetric label="Monthly Change" value={result.impact.monthlyChange} isMoney />
            <ImpactMetric label="Emergency Months" value={result.impact.emergencyMonthsChange} />
            <ImpactMetric label="Savings Rate" value={result.impact.savingsRateChange} isPercent />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold">Risk Level:</span>
            <Badge tone={result.risk === "high" ? "danger" : result.risk === "medium" ? "warning" : "success"}>
              {result.risk.toUpperCase()}
            </Badge>
          </div>

          <div className="p-3 rounded-xl" style={{ background: "var(--primary-soft)", border: "1px solid var(--border-accent)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>💡 {result.recommendation}</p>
          </div>
        </Card>
      )}
    </div>
  );
}

function ImpactMetric({ label, value, isMoney, isPercent }: { label: string; value: number; isMoney?: boolean; isPercent?: boolean }) {
  const isPositive = value >= 0;
  const display = isMoney
    ? `${value >= 0 ? "+" : ""}${inr(value, { compact: true })}`
    : isPercent
    ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
    : `${value >= 0 ? "+" : ""}${value.toFixed(1)} mo`;

  return (
    <div className="p-3 rounded-lg text-center" style={{ background: "var(--surface-2)" }}>
      <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="text-lg font-extrabold mt-1" style={{ color: isPositive ? "var(--success)" : "var(--danger)" }}>{display}</p>
    </div>
  );
}
