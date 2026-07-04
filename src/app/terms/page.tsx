import { Card, SectionTitle } from "@/components/ui/Card";

export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <SectionTitle title="Terms & Disclaimer" subtitle="Important usage terms for Personal CFO" />

      <Card title="No financial advice">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Personal CFO is a tracking, planning, and reporting tool. It does not provide investment, tax, legal, accounting, or financial advice. Always consult a qualified professional before making financial decisions.
        </p>
      </Card>

      <Card title="Market data disclaimer">
        <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <li>Stock and mutual fund data may be delayed, incomplete, or unavailable.</li>
          <li>Mutual fund NAVs normally update daily, not every second.</li>
          <li>Do not make trades or investments based only on this app’s displayed values.</li>
        </ul>
      </Card>

      <Card title="User responsibility">
        <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <li>You are responsible for verifying entered and imported data.</li>
          <li>You are responsible for maintaining safe access to your account.</li>
          <li>Do not upload or store passwords, OTPs, PINs, or other highly sensitive credentials.</li>
        </ul>
      </Card>

      <Card title="Availability">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          The service may be unavailable due to maintenance, third-party API failures, deployment changes, or infrastructure issues.
        </p>
      </Card>
    </div>
  );
}
