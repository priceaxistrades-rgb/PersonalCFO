import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/Kpi";
import { DonutChart } from "@/components/ui/Charts";
import { Table, Tr, Td } from "@/components/ui/Table";
import { inr, num, fmtDate, daysUntil } from "@/lib/format";
import { getInsurance, sumBy } from "@/lib/data";
import { InsuranceManager } from "../settings/InsuranceManager";

export const dynamic = "force-dynamic";

const TYPE_ICON: Record<string, string> = {
  Health: "🏥",
  Life: "👨‍👩‍👧",
  Vehicle: "🚗",
  Property: "🏠",
};

export default async function InsurancePage() {
  const policies = await getInsurance();
  const totalPremium = sumBy(policies, (p) => num(p.premium));
  const totalCoverage = sumBy(policies, (p) => num(p.coverage));
  const upcoming = policies.filter((p) => daysUntil(p.renewalDate) <= 45 && daysUntil(p.renewalDate) >= 0);

  const byType = new Map<string, number>();
  policies.forEach((p) => byType.set(p.type, (byType.get(p.type) || 0) + num(p.coverage)));
  const coverageData = [...byType.entries()].map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-6">
      <SectionTitle title="Insurance Tracker" subtitle="Policies, premiums and renewal reminders" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 kpi-scroll lg:grid stagger">
        <KpiCard label="Total Coverage" value={inr(totalCoverage, { compact: true })} icon="🛡️" tone="success" />
        <KpiCard label="Annual Premium" value={inr(totalPremium, { compact: true })} icon="💳" tone="primary" />
        <KpiCard label="Active Policies" value={String(policies.length)} icon="📋" tone="accent" />
        <KpiCard label="Renewals Due" value={String(upcoming.length)} icon="⏰" tone={upcoming.length ? "warning" : "success"} sub="next 45 days" />
      </div>

      {upcoming.length > 0 && (
        <Card className="!p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⏰</span>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--warning)" }}>Renewal reminder: </span>
              {upcoming.map((p) => `${p.name} (${fmtDate(p.renewalDate)})`).join(", ")}. Renew on time to keep coverage active.
            </p>
          </div>
        </Card>
      )}

      <InsuranceManager insurance={policies} />

      <div className="grid lg:grid-cols-3 gap-4 stagger fade-in-up">
        <Card title="Coverage by Type" subtitle="Total sum assured">
          <DonutChart data={coverageData} centerLabel="Cover" centerValue={inr(totalCoverage, { compact: true })} />
        </Card>

        <Card title="All Policies" subtitle="Coverage and renewal schedule" className="lg:col-span-2">
          <Table headers={["Policy", "Type", "Provider", "Premium", "Coverage", "Renewal"]} right={[3, 4]}>
            {policies.map((p) => {
              const dleft = daysUntil(p.renewalDate);
              return (
                <Tr key={p.id}>
                  <Td strong>{TYPE_ICON[p.type]} {p.name}</Td>
                  <Td><Badge>{p.type}</Badge></Td>
                  <Td muted>{p.provider}</Td>
                  <Td right muted>{inr(num(p.premium), { compact: true })}</Td>
                  <Td right strong>{inr(num(p.coverage), { compact: true })}</Td>
                  <Td>
                    <span style={{ color: dleft <= 45 && dleft >= 0 ? "var(--warning)" : "var(--text-muted)" }}>
                      {fmtDate(p.renewalDate)}
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        </Card>
      </div>
    </div>
  );
}
