import { Card, SectionTitle } from "@/components/ui/Card";
import { KpiCard, Progress } from "@/components/ui/Kpi";
import { EmergencyCheck } from "@/components/EmergencyCheck";
import { inr, num } from "@/lib/format";
import { getEmergencyItems, getGoals, getInsurance, getTransactions, currentMonthKey, monthKey, sumBy } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EmergencyPage() {
  const [items, goals, insurance, txns] = await Promise.all([
    getEmergencyItems(),
    getGoals(),
    getInsurance(),
    getTransactions(),
  ]);

  const contacts = items.filter((i) => i.kind === "contact");
  const documents = items.filter((i) => i.kind === "document");
  const done = items.filter((i) => i.done).length;
  const readiness = items.length ? (done / items.length) * 100 : 0;

  const emergencyFund = goals.find((g) => g.category === "Emergency");
  const fundSaved = emergencyFund ? num(emergencyFund.saved) : 0;
  const cm = currentMonthKey();
  const monthlyExpense = sumBy(
    txns.filter((t) => t.type === "expense" && monthKey(t.txnDate) === cm),
    (t) => num(t.amount)
  );
  const monthsCovered = monthlyExpense > 0 ? fundSaved / monthlyExpense : 0;
  const totalCover = sumBy(insurance, (i) => num(i.coverage));

  return (
    <div className="space-y-6">
      <SectionTitle title="Emergency Planning" subtitle="Be prepared — for your family's peace of mind" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <KpiCard label="Emergency Fund" value={inr(fundSaved, { compact: true })} icon="🛟" tone={monthsCovered >= 6 ? "success" : "warning"} sub={`${monthsCovered.toFixed(1)} months cover`} />
        <KpiCard label="Insurance Cover" value={inr(totalCover, { compact: true })} icon="🛡️" tone="primary" />
        <KpiCard label="Preparedness" value={`${readiness.toFixed(0)}%`} icon="✅" tone="accent" sub={`${done}/${items.length} done`} />
        <KpiCard label="Key Contacts" value={String(contacts.length)} icon="📞" tone="success" />
      </div>

      <Card title="Emergency Readiness" subtitle="Complete your safety checklist">
        <Progress value={readiness} tone={readiness >= 75 ? "success" : "warning"} height={10} />
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          {readiness >= 100 ? "🎉 Fully prepared!" : `${items.length - done} item(s) left to secure your family.`}
        </p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 fade-in-up">
        <Card title="📞 Emergency Contacts" subtitle="Quick access in a crisis">
          <div className="space-y-2">
            {contacts.map((c) => (
              <EmergencyCheck key={c.id} id={c.id} done={c.done} label={c.label} detail={c.detail} />
            ))}
          </div>
        </Card>

        <Card title="📂 Critical Documents" subtitle="Keep these safe & accessible">
          <div className="space-y-2">
            {documents.map((d) => (
              <EmergencyCheck key={d.id} id={d.id} done={d.done} label={d.label} detail={d.detail} />
            ))}
          </div>
        </Card>
      </div>

      <Card className="!p-4">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          🔒 <span className="font-semibold" style={{ color: "var(--text)" }}>Security note:</span> Never store passwords, PINs or OTPs in this planner. Instead, keep a sealed note of where to find them (password manager, bank locker) and share access instructions with a trusted family member.
        </p>
      </Card>
    </div>
  );
}
