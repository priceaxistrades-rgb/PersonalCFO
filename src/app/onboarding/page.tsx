import Link from "next/link";
import { Card, SectionTitle, Badge } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const steps = [
  { title: "Create family members", text: "Add yourself, spouse, children, parents, or household profile.", href: "/settings" },
  { title: "Add income", text: "Enter salary, business, rent, dividends, interest, or custom income.", href: "/income" },
  { title: "Add expenses", text: "Track daily/monthly expenses and correct mistakes directly in the Expenses tab.", href: "/expenses" },
  { title: "Add investments", text: "Add stock symbols or mutual fund scheme codes with units for live sync.", href: "/settings" },
  { title: "Add debts and bills", text: "Track EMI, due dates, unpaid bills, and reminders.", href: "/debt" },
  { title: "Set goals", text: "Create emergency fund, vacation, education, retirement, or custom goals.", href: "/savings" },
  { title: "Review dashboard", text: "Use dashboard KPIs as shortcuts to each financial section.", href: "/" },
];

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <SectionTitle title="Onboarding Checklist" subtitle="Set up your Personal CFO workspace step by step" action={<Badge tone="primary">Setup</Badge>} />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {steps.map((step, index) => (
          <Card key={step.title} title={`${index + 1}. ${step.title}`}>
            <p className="text-sm min-h-12" style={{ color: "var(--text-muted)" }}>{step.text}</p>
            <Link href={step.href} className="inline-flex mt-4 px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              Open
            </Link>
          </Card>
        ))}
      </div>

      <Card title="Safety reminders">
        <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <li>Do not store bank passwords, brokerage passwords, OTPs, card PINs, or recovery phrases.</li>
          <li>Market values may be delayed. Verify before financial decisions.</li>
          <li>Export your data periodically for backup.</li>
        </ul>
      </Card>
    </div>
  );
}
