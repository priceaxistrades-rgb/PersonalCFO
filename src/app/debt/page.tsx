import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { DonutChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num } from "@/lib/format";
import { getDebts, sumBy } from "@/lib/data";

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
  if (emi <= outstanding * r) return 999; // never
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
      <SectionTitle title="Debt & Loan Dashboard" subtitle="Track balances, EMIs and payoff timelines" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Outstanding" value={inr(totalOutstanding, { compact: true })} icon="🏦" tone="danger" />
        <KpiCard label="Monthly EMI" value={inr(totalEmi, { compact: true })} icon="📅" tone="warning" />
        <KpiCard label="Already Repaid" value={inr(paidOff, { compact: true })} icon="✅" tone="success" sub={`of ${inr(totalPrincipal, { compact: true })}`} />
        <KpiCard label="Avg Interest" value={`${avgRate.toFixed(1)}%`} icon="📉" tone="primary" sub="weighted" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Debt Composition" subtitle="By outstanding balance">
          <DonutChart data={allocation} centerLabel="Total" centerValue={inr(totalOutstanding, { compact: true })} />
        </Card>

        <Card title="Loan Details" subtitle="Payoff projections" className="lg:col-span-2">
          <Table headers={["Loan", "Type", "Outstanding", "Rate", "EMI", "Payoff"]} right={[2, 3, 4, 5]}>
            {debts.map((d) => {
              const out = num(d.outstanding);
              const months = payoffMonths(out, num(d.emi), num(d.interestRate));
              const yrs = Math.floor(months / 12);
              const mos = months % 12;
              return (
                <Tr key={d.id}>
                  <Td strong>{d.name}</Td>
                  <Td><Badge tone={d.type === "CreditCard" ? "danger" : "neutral"}>{TYPE_LABELS[d.type] || d.type}</Badge></Td>
                  <Td right strong>{inr(out, { compact: true })}</Td>
                  <Td right muted>{num(d.interestRate).toFixed(1)}%</Td>
                  <Td right muted>{inr(num(d.emi), { compact: true })}</Td>
                  <Td right muted>{months >= 999 ? "—" : `${yrs}y ${mos}m`}</Td>
                </Tr>
              );
            })}
          </Table>
        </Card>
      </div>

      <Card title="Repayment Progress" subtitle="How much of each loan is cleared">
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          {debts.map((d) => {
            const prin = num(d.principal);
            const out = num(d.outstanding);
            const pct = prin > 0 ? ((prin - out) / prin) * 100 : 0;
            return (
              <div key={d.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium" style={{ color: "var(--text)" }}>{d.name}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{pct.toFixed(0)}% paid</span>
                </div>
                <Progress value={pct} tone={pct >= 60 ? "success" : "primary"} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
