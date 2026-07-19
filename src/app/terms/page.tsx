import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-bg text-white py-12 px-6 max-w-4xl mx-auto">
      <div className="mb-10">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to PersonalCFO</Link>
        <h1 className="text-4xl font-black tracking-tight mt-4">Terms of Service</h1>
        <p className="text-slate-400 mt-2">Last updated: July 19, 2026</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-slate-300">
        <section>
          <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
          <p>By accessing or using PersonalCFO (&quot;the Service&quot;), you agree to be bound by these Terms of Service.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">2. Description of Service</h2>
          <p>PersonalCFO is a personal financial planning and tracking tool for Indian households. It helps users manage income, expenses, investments, debts, goals, and taxes.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">3. User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You must provide accurate financial information</li>
            <li>You must not use the service for illegal activities</li>
            <li>You are solely responsible for any financial decisions made using the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">4. No Financial Advice</h2>
          <p className="font-semibold text-amber-400">
            PersonalCFO is a tracking and planning tool only. It does not provide personalized financial, investment, tax, or legal advice. Always consult qualified professionals before making financial decisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">5. Data &amp; Privacy</h2>
          <p>Your use of the Service is also governed by our <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">6. Account Termination</h2>
          <p>You may delete your account at any time. We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">7. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, PersonalCFO and its creators shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Service.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white">8. Changes to Terms</h2>
          <p>We may update these terms. Continued use of the Service after changes constitutes acceptance of the new terms.</p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-white/10 text-sm text-slate-400">
        © 2026 PersonalCFO — Sovereign Wealth OS
      </div>
    </div>
  );
}
