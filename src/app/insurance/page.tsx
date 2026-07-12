import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num, fmtDate, daysUntil } from "@/lib/format";
import { getInsurance, sumBy } from "@/lib/data";
import { InsuranceManager } from "../settings/InsuranceManager";
import { IconInsurance, IconBills, IconTimeline, IconAlert } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function InsurancePage() {
  const policies = await getInsurance();
  const totalPremium = sumBy(policies, (p) => num(p.premium));
  const totalCoverage = sumBy(policies, (p) => num(p.coverage));
  const upcoming = policies.filter((p) => daysUntil(p.renewalDate) <= 45 && daysUntil(p.renewalDate) >= 0);

  const byType = new Map<string, number>();
  policies.forEach((p) => byType.set(p.type, (byType.get(p.type) || 0) + num(p.coverage)));
  const coverageData = [...byType.entries()].map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-6 animate-fade-in w-full select-none">
      <SectionTitle title="Insurance Shield Policies" subtitle="Monitored sum assured, annual premiums, and automated policy renewal reminders" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Coverage Shield" value={inr(totalCoverage, { compact: true })} icon={<IconInsurance size={18} />} tone="success" />
        <KpiCard label="Annual Premium Outflow" value={inr(totalPremium, { compact: true })} icon={<IconBills size={18} />} tone="primary" />
        <KpiCard label="Monitored Policies" value={String(policies.length)} icon={<IconTimeline size={18} />} tone="accent" />
        <KpiCard label="Upcoming Renewals" value={String(upcoming.length)} icon={<IconAlert size={18} />} tone={upcoming.length ? "warning" : "success"} sub="next 45 days" />
      </div>

      {upcoming.length > 0 && (
        <Card className="!p-4 border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 grid place-items-center shrink-0">
              <IconAlert size={18} />
            </span>
            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
              <span className="font-bold uppercase tracking-wider text-amber-400 block sm:inline">Renewal Advisory: </span>
              {upcoming.map((p) => `${p.name} (${fmtDate(p.renewalDate)})`).join(", ")}. Renew ahead of schedule to prevent coverage lapses.
            </p>
          </div>
        </Card>
      )}

      <InsuranceManager insurance={policies} />

      <div className="bento-grid">
        <div className="bento-col-4 flex flex-col">
          <Card title="Coverage Composition" subtitle="Total sum assured allocation" className="flex-1 flex flex-col justify-center">
            {coverageData.length ? (
              <DonutChart data={coverageData} centerLabel="Shield" centerValue={inr(totalCoverage, { compact: true })} />
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm font-medium">No active insurance policies</div>
            )}
          </Card>
        </div>

        <div className="bento-col-8">
          <Card title="Active Policy Archive" subtitle="Coverage amounts, premium liabilities, and renewal schedules">
            <Table headers={["Policy Name", "Insurance Type", "Provider", "Annual Premium", "Sum Assured", "Next Renewal"]} right={[3, 4]}>
              {policies.map((p) => {
                const dleft = daysUntil(p.renewalDate);
                return (
                  <Tr key={p.id}>
                    <Td strong>{p.name}</Td>
                    <Td><Badge tone="primary">{p.type}</Badge></Td>
                    <Td muted className="font-medium">{p.provider}</Td>
                    <Td right muted className="font-mono">{inr(num(p.premium), { compact: true })}</Td>
                    <Td right strong className="font-mono text-emerald-400">{inr(num(p.coverage), { compact: true })}</Td>
                    <Td>
                      <span className={`font-mono font-bold text-xs ${dleft <= 45 && dleft >= 0 ? "text-amber-400" : "text-slate-400"}`}>
                        {fmtDate(p.renewalDate)}
                      </span>
                    </Td>
                  </Tr>
                );
              })}
              {!policies.length && (
                <Tr><Td muted className="py-8 text-center" strong>Zero insurance policies registered yet.</Td><Td muted>—</Td><Td muted>—</Td><Td right muted>—</Td><Td right muted>—</Td><Td muted>—</Td></Tr>
              )}
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
