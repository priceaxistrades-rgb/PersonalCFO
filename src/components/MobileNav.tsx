"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useTheme, Theme } from "@/lib/theme";
import {
  IconDashboard, IconIncome, IconExpenses, IconInvestments,
  IconMission, IconBrief, IconBudgets, IconBills, IconHealth,
  IconNetWorth, IconMarkets, IconSavings, IconDebt, IconAI,
  IconCoach, IconSimulator, IconOpportunities, IconStress,
  IconDreams, IconTimeline, IconTax, IconInsurance, IconAnnual,
  IconEmergency, IconFamily, IconReports, IconOnboarding,
  IconSettings, IconUser, IconLogout, IconSuite
} from "@/components/ui/Icons";

const MOBILE_NAV = [
  { href: "/", label: "Cockpit", icon: IconDashboard },
  { href: "/income", label: "Income", icon: IconIncome },
  { href: "/expenses", label: "Outflow", icon: IconExpenses },
  { href: "/investments", label: "Vault", icon: IconInvestments },
];

const MORE_LINKS_GROUPS = [
  {
    title: "Cockpit & Capital Flow",
    items: [
      { href: "/control", label: "Mission Control", icon: IconMission },
      { href: "/brief", label: "Morning Brief", icon: IconBrief },
      { href: "/budget", label: "Budget Ceilings", icon: IconBudgets },
      { href: "/bills", label: "Scheduled Bills", icon: IconBills },
      { href: "/health", label: "Health Index", icon: IconHealth },
    ],
  },
  {
    title: "Asset Vault & Markets",
    items: [
      { href: "/settings#accounts", label: "Accounts & Wallets", icon: IconSavings },
      { href: "/networth", label: "Net Worth Deck", icon: IconNetWorth },
      { href: "/markets", label: "Live Market Tickers", icon: IconMarkets },
      { href: "/savings", label: "Milestone Vaults", icon: IconSavings },
      { href: "/debt", label: "Loans & Debt", icon: IconDebt },
    ],
  },
  {
    title: "AI & Intelligence",
    items: [
      { href: "/ai", label: "AI Twin", icon: IconAI },
      { href: "/coach", label: "Strategic Coach", icon: IconCoach },
      { href: "/simulator", label: "Life Simulator", icon: IconSimulator },
      { href: "/opportunities", label: "Optimization Scanner", icon: IconOpportunities },
      { href: "/stress", label: "Stress Telemetry", icon: IconStress },
    ],
  },
  {
    title: "Life Strategy & Suite",
    items: [
      { href: "/dreams", label: "Dream Planner", icon: IconDreams },
      { href: "/wealth", label: "Wealth Roadmap", icon: IconTimeline },
      { href: "/tax", label: "Tax Shield Planner", icon: IconTax },
      { href: "/insurance", label: "Insurance Policies", icon: IconInsurance },
      { href: "/annual", label: "Annual Target Map", icon: IconAnnual },
      { href: "/emergency", label: "Emergency Vault", icon: IconEmergency },
      { href: "/family", label: "Household Profiles", icon: IconFamily },
      { href: "/reports", label: "Analytics Reports", icon: IconReports },
      { href: "/onboarding", label: "Setup Checklist", icon: IconOnboarding },
      { href: "/settings", label: "Settings & Accounts", icon: IconSettings },
    ],
  },
];

const THEMES: { id: Theme; label: string; color: string }[] = [
  { id: "obsidian", label: "Obsidian", color: "#6366f1" },
  { id: "aurora",   label: "Aurora",   color: "#0ea5e9" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const { session, logout } = useSession();
  const { theme, setTheme, hydrated } = useTheme();

  useEffect(() => {
    if (!showMore) return;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowMore(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showMore]);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* ─── Bottom Tab Bar (< 1024px) ─── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t mobile-tab-bar backdrop-blur-2xl shadow-2xl select-none"
        style={{ background: "var(--header)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-around min-h-16 px-1">
          {MOBILE_NAV.map((item) => {
            const active = isActive(item.href);
            const IconComp = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-item flex flex-col items-center justify-center flex-1 py-1 mx-0.5 rounded-xl transition-all duration-200 no-underline ${active ? "bg-white/[0.04]" : ""}`}
                style={{ color: active ? "var(--primary)" : "var(--text-faint)", minHeight: 48 }}
              >
                <span className="mb-1 transition-transform duration-200 flex items-center justify-center" style={{ transform: active ? "scale(1.15)" : "scale(1)" }}>
                  <IconComp size={18} />
                </span>
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(true)}
            aria-expanded={showMore}
            className={`mobile-suite-button mobile-nav-item flex flex-col items-center justify-center flex-1 py-1 mx-0.5 rounded-xl transition-all duration-200 border-none bg-transparent cursor-pointer ${showMore ? "mobile-suite-active bg-white/[0.04]" : ""}`}
            style={{ color: showMore ? "var(--primary)" : "var(--text-faint)", minHeight: 48 }}
          >
            <span className="mobile-suite-icon mb-1 w-7 h-7 rounded-xl flex items-center justify-center">
              <IconSuite size={17} />
            </span>
            <span className="text-[10px] font-bold tracking-tight">Suite</span>
          </button>
        </div>
      </nav>

      {/* ─── More Sheet Drawer ─── */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-[90] animate-fade-in select-none">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowMore(false)} />
          <div
            className="mobile-more-sheet absolute left-2 right-2 rounded-3xl p-5 overflow-y-auto overscroll-contain border shadow-2xl transition-all duration-300"
            style={{ background: "var(--surface)", borderColor: "var(--border-strong)" }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <IconSuite size={16} />
                </span>
                <h3 className="font-black text-lg tracking-tight" style={{ color: "var(--text-heading)" }}>Sovereign Wealth Suite</h3>
              </div>
              <button onClick={() => setShowMore(false)} className="btn btn-ghost w-9 h-9 rounded-xl font-bold font-mono border" style={{ borderColor: "var(--border)" }}>✕</button>
            </div>

            <div className="mb-5 p-3 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400">Appearance</span>
                <span className="text-[10px] font-mono text-indigo-400 font-bold capitalize">{hydrated ? theme : "obsidian"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl border bg-surface-3/50" style={{ borderColor: "var(--border)" }}>
                {THEMES.map((t) => {
                  const selected = hydrated && theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                        selected ? "bg-indigo-600 text-white shadow-md scale-[1.02]" : "text-slate-400 hover:text-white bg-transparent"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: t.color }} />
                      <span className="tracking-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {MORE_LINKS_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.14em] mb-2 px-1 text-slate-500">{group.title}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((link) => {
                      const IconComp = link.icon;
                      const active = isActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setShowMore(false)}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-150 active:scale-95 border no-underline ${
                            active ? "bg-indigo-600 text-white shadow-sm border-indigo-500/40" : "bg-surface-2 hover:bg-surface-3 text-slate-300 border-transparent"
                          }`}
                          style={{ minHeight: 46 }}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-white/20 text-white" : "bg-white/5 text-indigo-400"}`}>
                            <IconComp size={16} />
                          </span>
                          <span className={`text-xs font-bold tracking-tight truncate ${active ? "text-white" : "text-text-heading"}`}>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {session && (
              <div className="border-t pt-4 space-y-3" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3 px-2 mb-2">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-sm font-mono font-extrabold ring-2 ring-indigo-500/20 bg-indigo-500/20 text-indigo-400">
                    {session.profileImage ? <img src={session.profileImage} alt="" className="w-full h-full object-cover" /> : <IconUser size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black truncate" style={{ color: "var(--text-heading)" }}>{session.name}</p>
                    <p className="text-[10px] truncate font-mono text-indigo-400">Sovereign Admin · v5.6</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/settings" onClick={() => setShowMore(false)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors bg-surface-2 hover:bg-surface-3 border text-text-heading no-underline"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <IconSettings size={15} /> <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => { logout(); setShowMore(false); }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer"
                  >
                    <IconLogout size={15} /> <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
