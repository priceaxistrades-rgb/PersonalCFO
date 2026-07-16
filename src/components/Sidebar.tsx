"use client";

import { ProfileUploadModal } from "./ProfileUploadModal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme, Theme } from "@/lib/theme";
import { useMemberFilter } from "@/lib/filters";
import { useSession } from "@/lib/session";
import {
  IconDashboard, IconMission, IconBrief, IconHealth, IconIncome,
  IconExpenses, IconBudgets, IconBills, IconNetWorth, IconInvestments,
  IconMarkets, IconSavings, IconDebt, IconAI, IconCoach, IconSimulator,
  IconOpportunities, IconStress, IconDreams, IconTimeline, IconTax,
  IconInsurance, IconAnnual, IconEmergency, IconFamily, IconReports,
  IconOnboarding, IconUser, IconSettings, IconLogout, IconSearch, IconLightning
} from "@/components/ui/Icons";

const NAV_GROUPS = [
  {
    group: "Cockpit",
    icon: IconDashboard,
    items: [
      { href: "/", label: "Dashboard", icon: IconDashboard, desc: "Sovereign consolidated wealth & cash flow deck" },
      { href: "/control", label: "Mission Control", icon: IconMission, desc: "Dual diagnostic gauges & stress telemetry" },
      { href: "/brief", label: "Morning Brief", icon: IconBrief, desc: "Daily prioritized financial intelligence feed" },
      { href: "/health", label: "Health Index", icon: IconHealth, desc: "4-pillar capital structure diagnostics" },
    ],
  },
  {
    group: "Capital Flow",
    icon: IconIncome,
    items: [
      { href: "/income", label: "Income Streams", icon: IconIncome, desc: "Salary, dividends & freelance revenue logs" },
      { href: "/expenses", label: "Expenditures", icon: IconExpenses, desc: "Categorized outflows & spend leak telemetry" },
      { href: "/budget", label: "Budget Ceilings", icon: IconBudgets, desc: "Monitored category allocation limits" },
      { href: "/bills", label: "Scheduled Bills", icon: IconBills, desc: "Upcoming payables & subscription reminders" },
    ],
  },
  {
    group: "Asset Vault",
    icon: IconInvestments,
    items: [
      { href: "/settings#accounts", label: "Bank Accounts & Wallets", icon: IconSavings, desc: "Bank accounts, cash balances, credit cards & digital wallets" },
      { href: "/networth", label: "Net Worth Deck", icon: IconNetWorth, desc: "Consolidated asset vs liability valuation" },
      { href: "/investments", label: "Portfolio Assets", icon: IconInvestments, desc: "Equities, mutual funds & capital holdings" },
      { href: "/markets", label: "Live Market Tickers", icon: IconMarkets, desc: "Real-time NSE stocks & AMFI scheme NAVs" },
      { href: "/savings", label: "Milestone Vaults", icon: IconSavings, desc: "Goal reserves and target completion tracking" },
      { href: "/debt", label: "Loans & Debt", icon: IconDebt, desc: "EMI obligations & amortization tracking" },
    ],
  },
  {
    group: "Intelligence",
    icon: IconAI,
    items: [
      { href: "/ai", label: "AI Financial Twin", icon: IconAI, desc: "Autonomous wealth advisory & instant QA" },
      { href: "/coach", label: "Strategic Coach", icon: IconCoach, desc: "Weekly actionable wealth management steps" },
      { href: "/simulator", label: "Scenario Simulator", icon: IconSimulator, desc: "Model salary shocks, property & inflation" },
      { href: "/opportunities", label: "Optimization Scanner", icon: IconOpportunities, desc: "Automated detection of savings potential" },
      { href: "/stress", label: "Stress Telemetry", icon: IconStress, desc: "Real-time debt buffers & resilience factors" },
    ],
  },
  {
    group: "Life Strategy",
    icon: IconTimeline,
    items: [
      { href: "/dreams", label: "Dream Planner", icon: IconDreams, desc: "Feasibility modeling for major aspirations" },
      { href: "/wealth", label: "Wealth Roadmap", icon: IconTimeline, desc: "Compounding timeline & financial freedom path" },
      { href: "/tax", label: "Tax Shield Planner", icon: IconTax, desc: "Old vs New regime comparative marginal engine" },
      { href: "/insurance", label: "Insurance Policies", icon: IconInsurance, desc: "Monitored sum assured & renewal alerts" },
      { href: "/annual", label: "Annual Target Map", icon: IconAnnual, desc: "Yearly progress towards capital milestones" },
      { href: "/emergency", label: "Emergency Vault", icon: IconEmergency, desc: "Crisis checklist, contacts & secure notes" },
      { href: "/family", label: "Household Profiles", icon: IconFamily, desc: "Manage multi-member isolation scope" },
      { href: "/reports", label: "Analytics Reports", icon: IconReports, desc: "Historical inflow vs outflow breakdowns" },
      { href: "/guide", label: "User Manual", icon: IconOnboarding, desc: "How to use the complete Personal CFO website" },
      { href: "/onboarding", label: "Setup Checklist", icon: IconOnboarding, desc: "Complete guide to initializing workspace" },
    ],
  },
];

const THEMES: { id: Theme; label: string; color: string; desc: string }[] = [
  { id: "obsidian", label: "Obsidian", color: "#6366f1", desc: "Dark Slate" },
  { id: "aurora",   label: "Aurora",   color: "#0ea5e9", desc: "Light Canvas" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, hydrated } = useTheme();
  const [open, setOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { session, logout, loading: authLoading } = useSession();
  const { hasSelection, activeProfile, clear } = useMemberFilter();

  // Smart Accordion Expansion: automatically open active hub by default
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const activeGroup = NAV_GROUPS.find((g) => g.items.some((item) => pathname === item.href))?.group || "Cockpit";
    return {
      Cockpit: activeGroup === "Cockpit",
      "Capital Flow": activeGroup === "Capital Flow",
      "Asset Vault": activeGroup === "Asset Vault",
      Intelligence: activeGroup === "Intelligence",
      "Life Strategy": activeGroup === "Life Strategy",
    };
  });

  useEffect(() => {
    NAV_GROUPS.forEach((g) => {
      if (g.items.some((item) => pathname === item.href)) {
        setExpandedGroups((prev) => ({ ...prev, [g.group]: true }));
      }
    });
  }, [pathname]);

  useEffect(() => {
    if (!open && !userDropdownOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      setUserDropdownOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, userDropdownOpen]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const closeSidebar = () => setOpen(false);

  return (
    <>
      {/* ─── Mobile / Tablet Header (< 1024px) ─── */}
      <header
        className="mobile-top-bar lg:hidden sticky top-0 z-50 flex items-center justify-between gap-3 px-3 sm:px-5 h-14 backdrop-blur-2xl border-b select-none premium-mobile-header"
        style={{ background: "var(--header)", borderColor: "var(--border)" }}
      >
        <div className="mobile-brand-cluster flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => { setOpen(true); setUserDropdownOpen(false); }}
            aria-label="Open navigation menu"
            aria-expanded={open}
            className="mobile-brand-menu w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 cursor-pointer border border-white/10 active:scale-95 transition-all"
          >
            <span className="relative grid place-items-center">
              <IconDashboard size={17} />
              <span className="mobile-brand-menu-lines" aria-hidden="true" />
            </span>
          </button>
          <Link href="/" className="font-extrabold tracking-tight text-base no-underline truncate" style={{ color: "var(--text-heading)" }}>
            Personal CFO
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="hidden sm:inline-flex h-10 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black shadow-sm active:scale-95 transition-all text-white bg-gradient-to-br from-indigo-500 to-sky-500"
            style={{ borderColor: "rgba(255,255,255,0.18)" }}
            aria-label="Open quick entry hub"
          >
            <IconLightning size={15} />
            <span>Quick Add</span>
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-global-search"))}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-mono font-bold border cursor-pointer hover:bg-surface-3 transition-colors text-indigo-400 shrink-0"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            aria-label="Search"
            title="Search workspace (⌘F)"
          >
            <IconSearch size={17} />
          </button>
          {session && !authLoading && (
            <button
              onClick={() => { setUserDropdownOpen(!userDropdownOpen); setOpen(false); }}
              aria-expanded={userDropdownOpen}
              aria-label="Open user menu"
              className="w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center text-xs font-mono font-bold ring-1 ring-white/10 shadow-sm bg-indigo-500/20 text-indigo-400 shrink-0 cursor-pointer"
            >
              {session.profileImage ? (
                <img src={session.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                session.name.charAt(0).toUpperCase()
              )}
            </button>
          )}

        </div>
      </header>

      {/* ─── Mobile Overlay & Popovers ─── */}
      {(open || userDropdownOpen) && (
        <div
          className="lg:hidden fixed inset-0 z-[70] bg-black/70 backdrop-blur-md transition-opacity"
          onClick={() => { closeSidebar(); setUserDropdownOpen(false); }}
        />
      )}

      {userDropdownOpen && (
        <div
          className="lg:hidden fixed top-16 right-3 w-64 rounded-2xl p-4 border shadow-2xl space-y-3 z-[100] animate-scale-in"
          style={{ background: "var(--surface)", borderColor: "var(--border-strong)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-sm font-mono font-extrabold bg-indigo-500/20 text-indigo-400 shrink-0">
              {session?.profileImage ? <img src={session.profileImage} alt="" className="w-full h-full object-cover" /> : session?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black truncate" style={{ color: "var(--text-heading)" }}>{session?.name || "Sovereign Admin"}</p>
              <p className="text-[10px] font-mono text-indigo-400 truncate">Sovereign OS · v5.6</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/settings"
              onClick={() => setUserDropdownOpen(false)}
              className="btn btn-secondary py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-white/[0.08] no-underline"
            >
              <IconSettings size={14} /> <span>Settings</span>
            </Link>
            <button
              onClick={() => { logout(); setUserDropdownOpen(false); }}
              className="btn btn-ghost py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 hover:bg-red-500/15 text-red-400 border border-transparent cursor-pointer"
            >
              <IconLogout size={14} /> <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP: CANONICAL SOVEREIGN EXECUTIVE LEFT VERTICAL SIDEBAR (`w-[260px]`)
          High-contrast collapsible accordion design.
          ═══════════════════════════════════════════════════════════════════════ */}
      <aside
        className="app-sidebar hidden lg:flex flex-col w-[260px] shrink-0 sticky top-0 h-screen overflow-y-auto overflow-x-hidden select-none border-r transition-colors no-scrollbar"
        style={{ background: "var(--sidebar)", borderColor: "var(--border)" }}
      >
        {/* Top Brand & Scope Strip */}
        <div className="p-4 border-b space-y-3 shrink-0" style={{ borderColor: "var(--border)" }}>
          <Link href="/" className="flex items-center gap-3 no-underline group">
            <div className="sidebar-brand-mark w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
              <IconDashboard size={18} />
            </div>
            <div className="min-w-0">
              <span className="block leading-tight text-[15px] font-black tracking-tight" style={{ color: "var(--text-heading)" }}>
                Personal CFO
              </span>
              <span className="block text-[9px] font-mono font-extrabold tracking-widest text-indigo-400 uppercase mt-0.5">
                Sovereign OS v5.6
              </span>
            </div>
          </Link>

          {/* Scope Badge / Filter Link */}
          <Link
            href="/family"
            className="sidebar-scope-link flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-200 text-xs font-bold no-underline"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-indigo-400 flex items-center justify-center shrink-0"><IconFamily size={15} /></span>
              <span className="font-mono text-[11px] tracking-tight truncate">{activeProfile || "Family Members"}</span>
            </div>
            {hasSelection ? (
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" title="Scope filtered" />
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">All</span>
            )}
          </Link>

          {/* Universal Search Box Trigger */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-global-search"))}
            className="sidebar-search-trigger w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-200 text-xs font-bold cursor-pointer"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-indigo-400 flex items-center justify-center shrink-0"><IconSearch size={15} /></span>
              <span className="truncate tracking-tight font-medium text-slate-400">Search workspace…</span>
            </div>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 dark:bg-black/30 text-slate-400 shrink-0">⌘F</span>
          </button>
        </div>

        {/* Scrollable Navigation Deck — Collapsible Executive Hubs */}
        <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto">
          {NAV_GROUPS.map((section) => {
            const GroupIcon = section.icon;
            const isGroupActive = section.items.some((item) => pathname === item.href);
            const isOpenGroup = expandedGroups[section.group] ?? isGroupActive;

            return (
              <div key={section.group} className="space-y-1">
                {/* Section Header Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleGroup(section.group)}
                  aria-expanded={isOpenGroup}
                  className={`sidebar-group-toggle w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-extrabold uppercase tracking-[0.14em] rounded-xl transition-all duration-200 cursor-pointer border border-transparent ${
                    isOpenGroup
                      ? "text-indigo-400 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/20 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-white/5 dark:bg-white/5">
                      <GroupIcon size={14} />
                    </span>
                    <span className="truncate">{section.group}</span>
                  </span>
                  <span className="text-[9px] font-mono opacity-80 shrink-0 px-1.5 py-0.5 rounded bg-white/10 dark:bg-white/10">
                    {isOpenGroup ? "▲" : "▼"}
                  </span>
                </button>

                {/* Vertical Links List */}
                {isOpenGroup && (
                  <div className="sidebar-nav-list space-y-1 pt-1 pb-1.5 pl-3 border-l-2 border-indigo-500/30 dark:border-indigo-500/30 ml-3 animate-fade-in">
                    {section.items.map((item) => {
                      const active = pathname === item.href;
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`sidebar-nav-link flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 no-underline border ${
                            active
                              ? "sidebar-nav-link-active bg-indigo-600 dark:bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border-indigo-500/40"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-surface-2 hover:translate-x-1 border-transparent"
                          }`}
                          style={{ minHeight: 38 }}
                        >
                          <span
                            className={`sidebar-nav-icon w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              active ? "bg-white/20 text-white" : "bg-white/[0.03] text-slate-400 group-hover:text-white"
                            }`}
                          >
                            <ItemIcon size={15} />
                          </span>
                          <span className="truncate tracking-tight flex-1">{item.label}</span>
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Executive Dock & Settings */}
        <div className="p-3 border-t space-y-2.5 shrink-0 bg-surface-2/40" style={{ borderColor: "var(--border)" }}>
          {/* Universal Quick Add Command Button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-quick-action-center"))}
            className="sidebar-quick-add btn btn-primary w-full py-2.5 px-3 text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-between gap-2 cursor-pointer border border-indigo-400/30"
            style={{ minHeight: 40 }}
          >
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-white text-xs">+</span>
              <span>Quick Entry Hub</span>
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-white">⌘K</span>
          </button>

          {/* Theme Selector (High contrast 2-pill toggle) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
            {THEMES.map((t) => {
              const selected = hydrated && theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.desc}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    selected ? "bg-indigo-600 text-white shadow-sm border-indigo-500/40" : "text-slate-400 hover:text-white border-transparent hover:bg-surface-3"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ background: t.color }} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Account / Profile Row */}
          <div className="pt-1">
            {session && !authLoading ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1" onClick={() => setShowUpload(true)} title="Update Avatar">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-xs font-mono font-extrabold bg-indigo-500/20 text-indigo-400 shrink-0 shadow-sm ring-1 ring-white/10">
                      {session.profileImage ? (
                        <img src={session.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        session.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black truncate leading-tight" style={{ color: "var(--text-heading)" }}>{session.name}</p>
                      <p className="text-[10px] font-mono text-indigo-400 dark:text-indigo-300 truncate leading-tight">Sovereign Admin</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    href="/settings"
                    className="btn btn-secondary py-2 px-2.5 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 border border-white/[0.06] hover:border-indigo-500/40 no-underline"
                  >
                    <IconSettings size={13} /> <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="btn btn-ghost py-2 px-2.5 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-red-500/15 hover:text-red-400 border border-transparent hover:border-red-500/20 cursor-pointer"
                  >
                    <IconLogout size={13} /> <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary w-full py-2.5 text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 no-underline"
              >
                <IconUser size={15} /> <span>Sign In to OS</span>
              </Link>
            )}
          </div>
        </div>

        {showUpload && session && (
          <ProfileUploadModal
            user={session}
            onUploadSuccess={() => { setShowUpload(false); router.refresh(); }}
            onClose={() => setShowUpload(false)}
          />
        )}
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE & TABLET: Slide-over Drawer (< 1024px)
          ═══════════════════════════════════════════════════════════ */}
      <aside
        className={`app-sidebar mobile-suite-drawer lg:hidden fixed top-0 left-0 z-[80] h-[100dvh] w-[min(420px,92vw)] flex flex-col safe-area-top transition-transform duration-300 cubic-bezier(.16, 1, .3, 1) border-r shadow-2xl ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-xs font-mono font-extrabold shrink-0 shadow-sm bg-indigo-500/20 text-indigo-400">
              {session && !authLoading ? (
                session.profileImage ? <img src={session.profileImage} alt="" className="w-full h-full object-cover" /> : session.name.charAt(0).toUpperCase()
              ) : <IconUser size={18} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black truncate" style={{ color: "var(--text-heading)" }}>
                {session && !authLoading ? session.name : "Personal CFO"}
              </p>
              <p className="text-[10px] truncate text-indigo-400 dark:text-indigo-300 font-mono">
                Sovereign Admin · v5.6
              </p>
            </div>
          </div>
          <button onClick={closeSidebar} className="btn btn-ghost w-9 h-9 rounded-xl shrink-0 font-mono font-bold border" style={{ borderColor: "var(--border)" }}>✕</button>
        </div>

        <div className="p-3 border-b space-y-3" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { window.dispatchEvent(new CustomEvent("open-global-search")); closeSidebar(); }}
              className="flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-black transition-colors text-indigo-400 bg-surface-2"
              style={{ borderColor: "var(--border)" }}
            >
              <IconSearch size={15} /> Search
            </button>
            <button
              type="button"
              onClick={() => { window.dispatchEvent(new CustomEvent("open-quick-action-center")); closeSidebar(); }}
              className="flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-black text-white bg-gradient-to-br from-indigo-500 to-sky-500"
              style={{ borderColor: "rgba(255,255,255,0.18)" }}
            >
              <IconLightning size={15} /> Quick Add
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl border bg-surface-2" style={{ borderColor: "var(--border)" }}>
            {THEMES.map((t) => {
              const selected = hydrated && theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                    selected ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-3">
          {NAV_GROUPS.map((section) => {
            const GroupIcon = section.icon;
            const isOpenGroup = expandedGroups[section.group] ?? true;
            return (
              <div key={section.group} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(section.group)}
                  aria-expanded={isOpenGroup}
                  className="sidebar-group-toggle w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-extrabold uppercase tracking-[0.14em] text-slate-500 rounded-xl transition-colors cursor-pointer border border-transparent"
                >
                  <span className="flex items-center gap-2">
                    <GroupIcon size={14} className="text-slate-500" />
                    <span>{section.group}</span>
                  </span>
                  <span className="text-[9px] font-mono opacity-70">{isOpenGroup ? "▲" : "▼"}</span>
                </button>
                {isOpenGroup && (
                  <div className="space-y-1 pt-0.5 border-l-2 border-indigo-500/30 ml-3 pl-3">
                    {section.items.map((item) => {
                      const active = pathname === item.href;
                      const IconComp = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeSidebar}
                          className={`sidebar-mobile-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all no-underline ${
                            active ? "sidebar-mobile-link-active bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-surface-2"
                          }`}
                          style={{ minHeight: 44 }}
                        >
                          <span className={`flex items-center justify-center shrink-0 ${active ? "text-white scale-110" : "text-slate-400"}`}><IconComp size={18} /></span>
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t p-4 pb-6 space-y-2.5 bg-surface-2/40 shrink-0 safe-area-bottom" style={{ borderColor: "var(--border)" }}>
          {session && !authLoading ? (
            <>
              <Link href="/settings" onClick={closeSidebar}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold w-full border hover:bg-surface-3 no-underline"
                style={{ background: "var(--surface)", color: "var(--text-heading)", borderColor: "var(--border)", minHeight: 44 }}
              >
                <IconSettings size={15} /> <span>Settings & Accounts</span>
              </Link>
              <button
                onClick={() => { logout(); closeSidebar(); }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold w-full transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer"
                style={{ minHeight: 44 }}
              >
                <IconLogout size={15} /> <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link href="/login" onClick={closeSidebar} className="btn btn-primary w-full py-2.5 text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 no-underline"><IconUser size={15} /> <span>Sign In</span></Link>
          )}
        </div>
      </aside>
    </>
  );
}
