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
  IconSettings, IconUser, IconLogout, IconSuite, IconLightning, IconSearch
} from "@/components/ui/Icons";

const MOBILE_NAV = [
  { href: "/", label: "Cockpit", icon: IconDashboard },
  { href: "/income", label: "Income", icon: IconIncome },
  { href: "/expenses", label: "Outflow", icon: IconExpenses },
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
      { href: "/investments", label: "Portfolio Assets", icon: IconInvestments },
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

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const openQuickEntry = () => window.dispatchEvent(new CustomEvent("open-quick-action-center"));
  const openSearch = () => window.dispatchEvent(new CustomEvent("open-global-search"));

  const primaryItems = MOBILE_NAV;

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 mobile-tab-bar premium-bottom-nav select-none"
        style={{ background: "var(--header)", borderColor: "var(--border)" }}
        aria-label="Primary mobile navigation"
      >
        <div className="premium-bottom-nav-inner mx-auto grid max-w-[560px] grid-cols-5 items-end gap-1 px-2 pt-2">
          {primaryItems.slice(0, 2).map((item) => {
            const active = isActive(item.href);
            const IconComp = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`mobile-nav-item premium-tab-item flex flex-col items-center justify-center rounded-2xl transition-all duration-200 no-underline ${active ? "premium-tab-active" : ""}`}
                style={{ color: active ? "var(--primary)" : "var(--text-faint)", minHeight: 52 }}
              >
                <span className="mb-1 transition-transform duration-200 flex items-center justify-center" style={{ transform: active ? "translateY(-1px) scale(1.12)" : "scale(1)" }}>
                  <IconComp size={19} />
                </span>
                <span className="text-[10px] font-black tracking-tight leading-none">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={openQuickEntry}
            className="mobile-fab-action mx-auto -mt-5 mb-1 h-14 w-14 rounded-[1.15rem] border text-white shadow-2xl active:scale-95 transition-all duration-200 grid place-items-center cursor-pointer"
            style={{ background: "linear-gradient(135deg, var(--primary), #0ea5e9)", borderColor: "rgba(255,255,255,0.26)" }}
            aria-label="Open quick entry hub"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/15 shadow-inner">
              <IconLightning size={18} />
            </span>
            <span className="sr-only">Quick add</span>
          </button>

          {primaryItems.slice(2, 3).map((item) => {
            const active = isActive(item.href);
            const IconComp = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`mobile-nav-item premium-tab-item flex flex-col items-center justify-center rounded-2xl transition-all duration-200 no-underline ${active ? "premium-tab-active" : ""}`}
                style={{ color: active ? "var(--primary)" : "var(--text-faint)", minHeight: 52 }}
              >
                <span className="mb-1 transition-transform duration-200 flex items-center justify-center" style={{ transform: active ? "translateY(-1px) scale(1.12)" : "scale(1)" }}>
                  <IconComp size={19} />
                </span>
                <span className="text-[10px] font-black tracking-tight leading-none">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setShowMore(true)}
            aria-expanded={showMore}
            aria-controls="mobile-suite-sheet"
            className={`suite-hub-button mobile-nav-item premium-tab-item flex flex-col items-center justify-center rounded-2xl transition-all duration-200 border-none bg-transparent cursor-pointer ${showMore ? "mobile-suite-active premium-tab-active" : ""}`}
            style={{ color: showMore ? "var(--primary)" : "var(--text-faint)", minHeight: 52 }}
          >
            <span className="suite-hub-icon mb-1 w-8 h-8 rounded-2xl flex items-center justify-center">
              <IconSuite size={16} />
            </span>
            <span className="text-[10px] font-black tracking-tight leading-none">Suite</span>
          </button>
        </div>
      </nav>

      {showMore && (
        <div className="lg:hidden fixed inset-0 z-[90] animate-fade-in select-none" role="presentation">
          <div className="absolute inset-0 bg-black/62 backdrop-blur-md" onClick={() => setShowMore(false)} />
          <div
            id="mobile-suite-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Personal CFO suite launchpad"
            className="mobile-more-sheet premium-suite-sheet suite-launchpad absolute left-2 right-2 rounded-[2rem] overflow-y-auto overscroll-contain border shadow-2xl transition-all duration-300"
            style={{ background: "var(--surface)", borderColor: "var(--border-strong)" }}
          >
            <div className="suite-grabber" aria-hidden="true" />

            <div className="suite-hero relative overflow-hidden rounded-[1.65rem] p-4 sm:p-5 m-3 mb-4 border">
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.18em] text-sky-200/85">Launchpad</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight leading-none text-white">Wealth Suite</h3>
                  <p className="mt-2 max-w-xs text-xs font-semibold leading-relaxed text-slate-200/85">
                    Jump into workflows by intent — no sidebar, no hunting through menus.
                  </p>
                </div>
                <button
                  onClick={() => setShowMore(false)}
                  className="h-10 w-10 shrink-0 rounded-2xl border border-white/15 bg-white/10 text-white font-mono font-black backdrop-blur active:scale-95 transition-all"
                  aria-label="Close suite launchpad"
                >
                  ✕
                </button>
              </div>

              <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="suite-stat-pill"><span>{MORE_LINKS_GROUPS.reduce((sum, group) => sum + group.items.length, 0)}</span><small>Modules</small></div>
                <div className="suite-stat-pill"><span>4</span><small>Hubs</small></div>
                <div className="suite-stat-pill"><span>Touch</span><small>First</small></div>
              </div>
            </div>

            <div className="px-3 pb-3">
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <button
                  type="button"
                  onClick={() => { openQuickEntry(); setShowMore(false); }}
                  className="suite-action-card suite-action-primary text-left"
                >
                  <span className="suite-action-icon"><IconLightning size={18} /></span>
                  <span className="suite-action-copy"><strong>Quick Entry</strong><small>Add money movement</small></span>
                </button>
                <button
                  type="button"
                  onClick={() => { openSearch(); setShowMore(false); }}
                  className="suite-action-card text-left"
                >
                  <span className="suite-action-icon"><IconSearch size={18} /></span>
                  <span className="suite-action-copy"><strong>Find Anything</strong><small>Search modules & records</small></span>
                </button>
                <Link href="/health" onClick={() => setShowMore(false)} className="suite-action-card no-underline">
                  <span className="suite-action-icon"><IconHealth size={18} /></span>
                  <span className="suite-action-copy"><strong>Health Check</strong><small>Score & actions</small></span>
                </Link>
                <Link href="/settings" onClick={() => setShowMore(false)} className="suite-action-card no-underline">
                  <span className="suite-action-icon"><IconSettings size={18} /></span>
                  <span className="suite-action-copy"><strong>Settings</strong><small>Accounts & profile</small></span>
                </Link>
              </div>

              <div className="suite-appearance-row mb-5">
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.16em]" style={{ color: "var(--text-faint)" }}>Theme</span>
                <div className="flex gap-1.5">
                  {THEMES.map((t) => {
                    const selected = hydrated && theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`suite-theme-chip ${selected ? "suite-theme-chip-active" : ""}`}
                        aria-pressed={selected}
                      >
                        <span style={{ background: t.color }} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5 pb-2">
                {MORE_LINKS_GROUPS.map((group, groupIndex) => (
                  <section key={group.title} className="suite-rail-section">
                    <div className="flex items-end justify-between gap-3 mb-2 px-1">
                      <div>
                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.16em]" style={{ color: "var(--primary)" }}>
                          {groupIndex === 0 ? "Operate" : groupIndex === 1 ? "Grow" : groupIndex === 2 ? "Think" : "Protect"}
                        </p>
                        <h4 className="text-sm font-black tracking-tight" style={{ color: "var(--text-heading)" }}>{group.title}</h4>
                      </div>
                      <span className="rounded-full px-2 py-1 text-[10px] font-mono font-black" style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}>
                        {group.items.length}
                      </span>
                    </div>

                    <div className="suite-module-rail">
                      {group.items.map((link, index) => {
                        const IconComp = link.icon;
                        const active = isActive(link.href);
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setShowMore(false)}
                            aria-current={active ? "page" : undefined}
                            className={`suite-module-card no-underline ${active ? "suite-module-card-active" : ""}`}
                            style={{ animationDelay: `${index * 24}ms` }}
                          >
                            <span className="suite-module-icon"><IconComp size={18} /></span>
                            <span className="suite-module-title">{link.label}</span>
                            <span className="suite-module-jump">Open →</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              {session && (
                <div className="suite-account-card mt-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center text-sm font-mono font-extrabold ring-2 ring-indigo-500/20 bg-indigo-500/20 text-indigo-400 shrink-0">
                      {session.profileImage ? <img src={session.profileImage} alt="" className="w-full h-full object-cover" /> : <IconUser size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black truncate" style={{ color: "var(--text-heading)" }}>{session.name}</p>
                      <p className="text-[10px] truncate font-mono text-indigo-400">Sovereign Admin · v6.0</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); setShowMore(false); }}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-400 active:scale-95 transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
