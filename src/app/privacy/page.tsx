import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg text-white py-12 px-6 max-w-4xl mx-auto">
      <div className="mb-10">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to Personal CFO</Link>
        <h1 className="text-4xl font-black tracking-tight mt-4">Privacy Policy</h1>
        <p className="text-slate-400 mt-2">Last updated: July 19, 2026</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-slate-300">
        <section>
          <h2 className="text-2xl font-bold text-white">1. Information We Collect</h2>
          <p>PersonalCFO collects the following information to provide financial planning services:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Account information (email, name, password hash)</li>
            <li>Financial data: transactions, accounts, investments, debts, goals, bills, insurance</li>
            <li>Family member profiles for budget tracking</li>
            <li>Usage data for improving the service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide core financial dashboard and analytics</li>
            <li>Generate reports, charts, and AI insights</li>
            <li>Send password reset emails (when configured)</li>
            <li>Improve product security and performance</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">3. Data Security</h2>
          <p>
            Your financial data is protected with:
          </p>
          <ul className="list-disc pl-6">
            <li>Bcrypt-hashed passwords</li>
            <li>HTTP-only, Secure, SameSite session cookies</li>
            <li>PostgreSQL with user-level isolation</li>
            <li>Strong input validation and sanitization</li>
            <li>Audit logging for all financial changes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">4. Data Sharing</h2>
          <p>We do <strong>not</strong> sell or share your personal or financial data with third parties except:</p>
          <ul className="list-disc pl-6">
            <li>Resend (email delivery) — only when you request password reset</li>
            <li>Market data providers (Yahoo Finance, MF API) — anonymous requests only</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6">
            <li>Access your data via the dashboard</li>
            <li>Export all your data (Excel export)</li>
            <li>Delete your account and all associated data</li>
            <li>Request corrections</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">6. Data Retention</h2>
          <p>
            Data is retained until you delete your account. Upon account deletion, all financial records are permanently removed within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">7. Contact</h2>
          <p>
            For privacy questions or data requests, please contact us through the in-app feedback form or email support@personal-cfo.app.
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-white/10 text-sm text-slate-400">
        © 2026 PersonalCFO — Sovereign Wealth OS
      </div>
    </div>
  );
}
