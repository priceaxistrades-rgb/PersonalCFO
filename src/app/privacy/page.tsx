import { Card, SectionTitle } from "@/components/ui/Card";

export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <SectionTitle title="Privacy Policy" subtitle="How Personal CFO handles financial data" />

      <Card title="Plain-English summary">
        <div className="space-y-3 text-sm" style={{ color: "var(--text-muted)" }}>
          <p>Your financial data belongs to you. The app stores your data only to provide dashboard, reporting, import/export, and planning features.</p>
          <p>We do not sell your personal financial data. Market data may be fetched from third-party public data providers such as Yahoo Finance and mfapi.in.</p>
        </div>
      </Card>

      <Card title="Data collected">
        <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <li>Account details such as name, email, and hashed password.</li>
          <li>Financial records you enter, including income, expenses, investments, debts, goals, bills, insurance, and family members.</li>
          <li>Imported file contents when you upload Excel/CSV data.</li>
          <li>Technical logs needed to operate and secure the service.</li>
        </ul>
      </Card>

      <Card title="Security">
        <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <li>Passwords are hashed before storage.</li>
          <li>Sessions use signed HTTP-only cookies.</li>
          <li>User financial records are scoped by account ID.</li>
          <li>You should still avoid storing bank passwords, OTPs, card PINs, or brokerage login credentials in notes.</li>
        </ul>
      </Card>

      <Card title="Your controls">
        <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <li>You can export your data from the app.</li>
          <li>You can delete or reset your financial records from Settings.</li>
          <li>You can request account/data deletion if this is offered as a hosted service.</li>
        </ul>
      </Card>

      <Card title="Disclaimer">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This app is for tracking and planning only. It is not investment, tax, legal, accounting, or financial advice.
        </p>
      </Card>
    </div>
  );
}
