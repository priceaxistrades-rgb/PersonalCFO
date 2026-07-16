import type { ReactNode } from "react";
import Link from "next/link";
import { Card, SectionTitle, Badge } from "@/components/ui/Card";
import { IconOnboarding, IconDashboard, IconLightning, IconFamily, IconReports, IconSettings, IconHealth, IconInvestments, IconBills, IconAI, IconArrowRight, IconCheck } from "@/components/ui/Icons";

export const dynamic = "force-static";

const quickStart = [
  {
    title: "1. Create your workspace",
    text: "Sign up or launch the demo, then open Settings to add accounts, wallets, family members, loans, policies and goals.",
    href: "/settings",
  },
  {
    title: "2. Add money movement",
    text: "Use the center Quick Entry button on mobile, or the Quick Entry Hub on desktop, to add income, expenses, bills, goals and debts.",
    href: "/expenses",
  },
  {
    title: "3. Review the cockpit",
    text: "The dashboard combines cash flow, net worth, goals, liabilities, bills, health score and insights into one operating view.",
    href: "/",
  },
  {
    title: "4. Export or import data",
    text: "Use Reports to export Excel workbooks or import historical data with the provided template.",
    href: "/reports",
  },
];

const modules = [
  ["Cockpit", "Dashboard, Mission Control, Morning Brief and Health Index for daily decisions."],
  ["Capital Flow", "Income, Expenses, Budgets and Bills for month-to-month control."],
  ["Asset Vault", "Accounts, Net Worth, Investments, Live Markets, Savings and Debt."],
  ["Intelligence", "AI Twin, Coach, Simulator, Opportunities and Stress Telemetry."],
  ["Life Strategy", "Dreams, Wealth Timeline, Tax, Insurance, Annual Plan, Emergency, Family and Reports."],
];

const routines = [
  "Daily: open Dashboard or Morning Brief, check upcoming bills and log new expenses.",
  "Weekly: review Budget, Opportunity Scanner, Wealth Coach and spending allocation.",
  "Monthly: reconcile accounts, export reports, update investments and mark paid bills.",
  "Quarterly: check Tax Planner, Insurance coverage, Emergency Vault and Annual Plan progress.",
];

const tips = [
  "Use Privacy Mode before sharing your screen.",
  "Use Family Scope to isolate a member or view the consolidated household.",
  "Use Command Search to jump to records and modules quickly.",
  "Use Quick Entry for fast add flows; use full module pages for detailed editing.",
  "Use Excel export before major cleanup or reset operations.",
  "Market data can be delayed; verify prices before making financial decisions.",
];

export default function GuidePage() {
  return (
    <div className="space-y-6 guide-page">
      <SectionTitle
        title="Personal CFO User Manual"
        subtitle="A practical guide to using the entire website across desktop, tablet and mobile."
        action={<Badge tone="primary" className="flex items-center gap-1.5"><IconOnboarding size={14} /> Guide</Badge>}
      />

      <Card className="guide-hero !p-5 sm:!p-8 overflow-hidden" style={{ borderColor: "var(--border-strong)" }}>
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-center">
          <div className="space-y-4">
            <Badge tone="primary" className="w-fit">Start here</Badge>
            <div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight" style={{ color: "var(--text-heading)" }}>
                Run your household finances like a premium command center.
              </h2>
              <p className="mt-3 text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-muted)" }}>
                Personal CFO is organized around workflows: set up your financial data, log transactions, monitor the dashboard, then use intelligence modules for decisions and planning.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/settings" className="btn btn-primary no-underline">Set up workspace <IconArrowRight size={14} /></Link>
              <Link href="/reports" className="btn btn-secondary no-underline">Import / Export</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={<IconDashboard size={18} />} label="Cockpit" value="Daily view" />
            <MiniStat icon={<IconLightning size={18} />} label="Quick Entry" value="Fast add" />
            <MiniStat icon={<IconFamily size={18} />} label="Family Scope" value="Profiles" />
            <MiniStat icon={<IconReports size={18} />} label="Reports" value="Excel" />
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStart.map((item) => (
          <Card key={item.title} className="!p-4 guide-step-card">
            <h3 className="text-sm font-black tracking-tight" style={{ color: "var(--text-heading)" }}>{item.title}</h3>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{item.text}</p>
            <Link href={item.href} className="mt-4 inline-flex items-center gap-1 text-xs font-black no-underline" style={{ color: "var(--primary)" }}>
              Open module <IconArrowRight size={13} />
            </Link>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card title="How the website is organized" subtitle="Use the app by intent, not by memorizing screens.">
          <div className="space-y-3">
            {modules.map(([name, text], index) => (
              <div key={name} className="guide-row">
                <span className="guide-row-index">{index + 1}</span>
                <div>
                  <h4 className="text-sm font-black" style={{ color: "var(--text-heading)" }}>{name}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recommended usage routine" subtitle="A simple operating rhythm for the household.">
          <div className="space-y-3">
            {routines.map((routine) => (
              <div key={routine} className="flex items-start gap-3 rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                <span className="mt-0.5 h-6 w-6 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--success-soft)", color: "var(--success)" }}><IconCheck size={13} /></span>
                <p className="text-xs leading-relaxed font-semibold" style={{ color: "var(--text)" }}>{routine}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Module shortcuts" subtitle="Jump directly to the most common workflows.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Shortcut href="/health" icon={<IconHealth size={18} />} title="Health Index" text="Score, weaknesses and next actions." />
          <Shortcut href="/investments" icon={<IconInvestments size={18} />} title="Portfolio" text="Track holdings and live sync." />
          <Shortcut href="/bills" icon={<IconBills size={18} />} title="Bills" text="Due dates and paid status." />
          <Shortcut href="/ai" icon={<IconAI size={18} />} title="AI Twin" text="Ask financial questions." />
        </div>
      </Card>

      <Card title="Best practices and safety notes" subtitle="Keep data clean, private and useful.">
        <div className="grid gap-3 md:grid-cols-2">
          {tips.map((tip) => (
            <div key={tip} className="flex items-start gap-3 rounded-2xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span className="mt-0.5 h-5 w-5 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}><IconCheck size={12} /></span>
              <p className="text-xs font-semibold leading-relaxed" style={{ color: "var(--text)" }}>{tip}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
      <span className="h-9 w-9 rounded-2xl grid place-items-center mb-3" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>{icon}</span>
      <p className="text-[10px] font-mono font-black uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="text-sm font-black" style={{ color: "var(--text-heading)" }}>{value}</p>
    </div>
  );
}

function Shortcut({ href, icon, title, text }: { href: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Link href={href} className="guide-shortcut no-underline rounded-2xl border p-4 transition-all" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
      <span className="h-10 w-10 rounded-2xl grid place-items-center mb-3" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>{icon}</span>
      <h3 className="text-sm font-black" style={{ color: "var(--text-heading)" }}>{title}</h3>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{text}</p>
    </Link>
  );
}
