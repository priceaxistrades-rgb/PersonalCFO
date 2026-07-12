import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { DonutChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import { getDebts, sumBy } from "@/lib/data";
import { DebtsManager } from "../settings/DebtsManager";
import { IconDebt, IconBills, IconCheck, IconDashboard } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  HomeLoan: "Home Loan",
  CarLoan: "Car Loan",
  EducationLoan: "Education Loan",
  CreditCard: "Credit Card",
  PersonalLoan: "Personal Loan",
};

function payoffMonths(outstanding: number, emi: number, annualRate: number): number {
  const r = annualRate / 12 / 100;
  if (emi <= outstanding * r) return 999;
  const n = Math.log(emi / (emi - outstanding * r)) / Math.log(1 + r);
  return Math.ceil(n);
}

export default async function DebtPage() {
  const debts = await getDebts();
  const totalOutstanding = sumBy(debts, (d) => num(d.outstanding));
  const totalPrincipal = sumBy(debts, (d) => num(d.principal));
  const totalEmi = sumBy(debts, (d) => num(d.emi));
  const paidOff = totalPrincipal - totalOutstanding;
  const avgRate = debts.length
    ? sumBy(debts, (d) => num(d.interestRate) * num(d.outstanding)) / Math.max(totalOutstanding, 1)
    : 0;

  const allocation = debts.map((d) => ({ label: TYPE_LABELS[d.type] || d.type, value: num(d.outstanding) }));

  return (
    <div className="space-y-6">
      <SectionTitle title="Debt & Loan Management" subtitle="Track outstanding liabilities, monthly EMIs, and projected payoff timelines" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Outstanding" value={inr(totalOutstanding, { compact: true })} icon={<IconDebt size={18} />} tone="danger" />
        <KpiCard label="Monthly EMI Outflow" value={inr(totalEmi, { compact: true })} icon={<IconBills size={18} />} tone="warning" />
        <KpiCard label="Capital Repaid" value={inr(paidOff, { compact: true })} icon={<IconCheck size={18} />} tone="success" sub={`of ${inr(totalPrincipal, { compact: true })} principal`} />
        <KpiCard label="Avg Weighted Rate" value={`${avgRate.toFixed(1)}%`} icon={<IconDashboard size={18} />} tone="primary" sub="annual percentage" />
      </div>

      <DebtsManager debts={debts} />

      <div className="bento-grid">
        <div className="bento-col-4 flex flex-col">
          <Card title="Liability Composition" subtitle="Share by outstanding balance" className="flex-1 flex flex-col justify-center">
            <DonutChart data={allocation} centerLabel="Total Debt" centerValue={inr(totalOutstanding, { compact: true })} />
          </Card>
        </div>

        <div className="bento-col-8">
          <Card title="Active Loan Obligations" subtitle="Amortization & payoff projections">
            <Table headers={["Loan Name", "Type", "Outstanding Balance", "Interest Rate", "Monthly EMI", "Payoff Horizon"]} right={[2, 3, 4, 5]}>
              {debts.map((d) => {
                const out = num(d.outstanding);
                const months = payoffMonths(out, num(d.emi), num(d.interestRate));
                const yrs = Math.floor(months / 12);
                const mos = months % 12;
                return (
                  <Tr key={d.id}>
                    <Td strong>{d.name}</Td>
                    <Td><Badge tone={d.type === "CreditCard" ? "danger" : "neutral"}>{TYPE_LABELS[d.type] || d.type}</Badge></Td>
                    <Td right strong className="font-mono text-red-400">{inr(out, { compact: true })}</Td>
                    <Td right muted className="font-mono">{num(d.interestRate).toFixed(1)}%</Td>
                    <Td right strong className="font-mono">{inr(num(d.emi), { compact: true })}</Td>
                    <Td right muted className="font-mono">{months >= 999 ? "Interest only" : `${yrs}y ${mos}m`}</Td>
                  </Tr>
                );
              })}
            </Table>
          </Card>
        </div>
      </div>

      <Card title="Capital Principal Repayment Progress" subtitle="Percentage of original principal cleared across household loans">
        <div className="grid sm:grid-cols-2 gap-6 pt-1">
          {debts.map((d) => {
            const prin = num(d.principal);
            const out = num(d.outstanding);
            const pct = prin > 0 ? ((prin - out) / prin) * 100 : 0;
            return (
              <div key={d.id} className="p-3.5 rounded-xl border border-white/[0.04] bg-surface-2">
                <div className="flex justify-between items-center text-xs mb-2 font-bold">
                  <span style={{ color: "var(--text-heading)" }}>{d.name}</span>
                  <span className="font-mono text-indigo-400">{pct.toFixed(0)}% cleared</span>
                </div>
                <Progress value={pct} tone={pct >= 60 ? "success" : "primary"} height={7} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
