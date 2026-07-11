"use client";

import { ProfileUploadModal } from "./ProfileUploadModal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme, Theme } from "@/lib/theme";
import { useMemberFilter } from "@/lib/filters";
import { useSession } from "@/lib/session";

// ─── Streamlined Nav — only the essentials ──────────────────────
const NAV = [
  {
    group: "Home",
    items: [
      { href: "/", label: "Dashboard", icon: "🏠" },
    ],
  },
  {
    group: "Money",
    items: [
      { href: "/income", label: "Income", icon: "💰" },
      { href: "/expenses", label: "Expenses", icon: "🧾" },
      { href: "/budget", label: "Budget", icon: "📊" },
      { href: "/bills", label: "Bills", icon: "🔔" },
    ],
  },
  {
    group: "Wealth",
    items: [
      { href: "/investments", label: "Investments", icon: "📈" },
      { href: "/markets", label: "Markets", icon: "🛰️" },
      { href: "/savings", label: "Savings", icon: "🐖" },
      { href: "/debt", label: "Debt", icon: "🏦" },
      { href: "/networth", label: "Net Worth", icon: "💎" },
    ],
  },
  {
    group: "Planning",
    items: [
      { href: "/ai", label: "AI Twin", icon: "🤖" },
      { href: "/dreams", label: "Dream Planner", icon: "✨" },
      { href: "/tax", label: "Tax", icon: "🧮" },
      { href: "/insurance", label: "Insurance", icon: "🛡️" },
    ],
  },
];

// ─── Everything else goes in "More" ────────────────────────────
const MORE_LINKS = [
  { href: "/control", label: "Mission Control", icon: "🚀" },
  { href: "/brief", label: "Morning Brief", icon: "☀️" },
  { href: "/health", label: "Health Score", icon: "❤️" },
  { href: "/family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { href: "/wealth", label: "Wealth Timeline", icon: "🗺️" },
  { href: "/simulator", label: "Life Simulator", icon: "🔬" },
  { href: "/opportunities", label: "Opportunities", icon: "🔍" },
  { href: "/stress", label: "Stress Meter", icon: "😰" },
  { href: "/coach", label: "Wealth Coach", icon: "🧠" },
  { href: "/annual", label: "Annual Plans", icon: "🗓️" },
  { href: "/emergency", label: "Emergency", icon: "🚨" },
  { href: "/reports", label: "Reports", icon: "📑" },
  { href: "/onboarding", label: "Onboarding", icon: "✅" },
];

const THEMES: { id: Theme; label: string; emoji: string; color: string; gradient: string }[] = [
  { id: "obsidian", label: "Obsidian", emoji: "🌙", color: "#818cf8", gradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
  { id: "aurora",   label: "Aurora",   emoji: "🌅", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1, #0ea5e9)" },
  { id: "emerald",  label: "Emerald",  emoji: "🌿", color: "#14b8a6", gradient: "linear-gradient(135deg, #0d9488, #14b8a6)" },
  { id: "royal",    label: "Royal",    emoji: "👑", color: "#fbbf24", gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
];

function ProfileIndicator() {
  const { hasSelection, activeProfile, selectedIds, clear } = useMemberFilter();
  if (!hasSelection) return null;
  return (
    <div className="px-4 py-3 border-t hidden lg:block" style={{ borderColor: "var(--border)" }}>
      <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Profile</p>
      <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "var(--primary-soft)" }}>
        <span className="text-xs font-medium truncate" style={{ color: "var(--primary)" }}>
          👤 {activeProfile || `${selectedIds.length} selected`}
        </span>
        <button onClick={clear} className="btn btn-ghost text-[10px] px-1.5 py-0.5">Reset</button>
      </div>
    </div>
  );
}

/** Theme selector */
function ThemeSelector({ hydrated, theme, setTheme, inline = false }: { hydrated: boolean; theme: Theme; setTheme: (t: Theme) => void; inline?: boolean }) {
  return (
    <div className={inline ? "px-3 py-3" : "px-4 py-3 border-t"} style={!inline ? { borderColor: "var(--border)" } : undefined}>
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "var(--text-faint)" }}>🎨 Theme</p>
      <div className="grid grid-cols-4 gap-2">
        {THEMES.map((t) => {
          const selected = hydrated && theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.label}
              aria-label={`Switch to ${t.label}`}
              className="flex flex-col items-center py-1.5 rounded-lg transition-all duration-200 active:scale-95"
              style={{
                background: selected ? `${t.color}18` : "var(--surface-3)",
                border: selected ? `2px solid ${t.color}` : "2px solid transparent",
              }}
            >
              <span className="text-sm leading-none mb-0.5">{t.emoji}</span>
              <span className="text-[8px] font-bold" style={{ color: selected ? t.color : "var(--text-faint)" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AuthButton() {
  const { session, logout, loading } = useSession();
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  if (loading) {
    return (
      <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="h-8 rounded-lg shimmer" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
        <Link href="/login" className="btn btn-primary w-full py-2 text-xs">
          🔐 Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2.5 mb-2.5 group cursor-pointer" onClick={() => setShowUpload(true)}>
        <div className="relative">
          <div
            className="w-9 h-9 rounded-full overflow-hidden grid place-items-center text-sm font-bold transition-all duration-200 group-hover:ring-2 group-hover:ring-[var(--primary)]"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {session.profileImage ? (
              <img src={session.profileImage} alt={session.name} className="w-full h-full object-cover" />
            ) : (
              session.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full grid place-items-center text-[7px]" style={{ background: "var(--primary)", color: "#fff" }}>📷</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-heading)" }}>{session.name}</p>
          <p className="text-[10px] truncate" style={{ color: "var(--text-faint)" }}>{session.email}</p>
        </div>
      </div>
      <button onClick={logout} className="btn btn-secondary w-full py-1.5 text-xs">
        🚪 Sign Out
      </button>
      {showUpload && (
        <ProfileUploadModal user={session} onUploadSuccess={() => { setShowUpload(false); router.refresh(); }} onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, hydrated } = useTheme();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { session, logout, loading: authLoading } = useSession();

  const closeSidebar = () => setOpen(false);

  return (
    <>
      {/* ─── Mobile Header ─── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ background: "var(--sidebar)", borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/" className="font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--text-heading)" }}>
          <span className="w-8 h-8 rounded-lg grid place-items-center text-sm" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>📊</span>
          Personal CFO
        </Link>
        <div className="flex items-center gap-2">
          {session && !authLoading && (
            <Link
              href="/settings"
              className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              {session.profileImage ? (
                <img src={session.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                session.name.charAt(0).toUpperCase()
              )}
            </Link>
          )}
          <button onClick={() => setOpen(!open)} className="btn btn-ghost w-10 h-10 text-lg" aria-label="Menu">
            {open ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* ─── Mobile Overlay ─── */}
      {open && <div className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={closeSidebar} />}

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP: Compact sticky sidebar — 220px, no animation
          ═══════════════════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex flex-col sticky top-0 z-40 h-screen w-[220px] flex-shrink-0"
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
      >
        <div className="px-4 py-4 flex items-center gap-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="w-8 h-8 rounded-lg grid place-items-center text-sm shadow-md flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>📊</div>
          <div>
            <p className="font-extrabold tracking-tight text-sm" style={{ color: "var(--text-heading)" }}>Personal CFO</p>
            <p className="text-[8px] font-medium" style={{ color: "var(--text-faint)" }}>Family Wealth Suite</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--text-faint)" }}>{section.group}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] font-medium transition-colors duration-150 ${active ? "nav-active" : ""}`} style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}>
                      <span className="text-[13px]">{item.icon}</span><span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <ProfileIndicator />
        <AuthButton />
        <ThemeSelector hydrated={hydrated} theme={theme} setTheme={setTheme} />
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE: Hamburger sidebar
          Layout: Profile → Theme → Nav → [More] → Sign Out (fixed bottom)
          ═══════════════════════════════════════════════════════════ */}
      <aside
        className={`lg:hidden fixed top-0 z-40 h-screen w-[280px] flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
      >
        {/* 1. Profile + Close */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden grid place-items-center text-sm font-bold flex-shrink-0" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              {session && !authLoading ? (
                session.profileImage ? <img src={session.profileImage} alt="" className="w-full h-full object-cover" /> : session.name.charAt(0).toUpperCase()
              ) : "👤"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--text-heading)" }}>
                {session && !authLoading ? session.name : "Personal CFO"}
              </p>
              <p className="text-[10px] truncate" style={{ color: "var(--text-faint)" }}>
                {session && !authLoading ? session.email : "Family Wealth Suite"}
              </p>
            </div>
          </div>
          <button onClick={closeSidebar} className="btn btn-ghost w-9 h-9 flex-shrink-0">✕</button>
        </div>

        {/* 2. Theme — RIGHT at the top */}
        <ThemeSelector hydrated={hydrated} theme={theme} setTheme={setTheme} inline />

        {/* 3. Nav links (scrollable middle) */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="px-2 mb-1 text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--text-faint)" }}>{section.group}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={closeSidebar}
                      className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${active ? "nav-active" : ""}`}
                      style={{ color: active ? "var(--primary)" : "var(--text-muted)", minHeight: 44 }}
                    >
                      <span className="text-[15px]">{item.icon}</span><span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* More — collapsible */}
          <div>
            <button
              className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] font-medium w-full"
              style={{ color: "var(--text-muted)", minHeight: 44 }}
              onClick={() => setMoreOpen(!moreOpen)}
            >
              <span className="text-[15px]">📑</span>
              <span className="flex-1 text-left">More</span>
              <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>{moreOpen ? "▲" : "▼"}</span>
            </button>
            {moreOpen && (
              <div className="space-y-0.5 mt-0.5">
                {MORE_LINKS.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={closeSidebar}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors duration-150 ${active ? "nav-active" : ""}`}
                      style={{ color: active ? "var(--primary)" : "var(--text-faint)", minHeight: 40 }}
                    >
                      <span className="text-[14px]">{item.icon}</span><span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* 4. Sign Out — ALWAYS pinned at bottom */}
        <div className="border-t p-4 space-y-2" style={{ borderColor: "var(--border)" }}>
          {session && !authLoading ? (
            <>
              <Link href="/settings" onClick={closeSidebar}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium w-full"
                style={{ background: "var(--surface-2)", color: "var(--text)", minHeight: 44 }}
              >
                <span>⚙️</span> Settings
              </Link>
              <button
                onClick={() => { logout(); closeSidebar(); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold w-full"
                style={{ background: "var(--danger-soft)", color: "var(--danger)", minHeight: 44 }}
              >
                <span>🚪</span> Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={closeSidebar} className="btn btn-primary w-full py-2.5 text-sm">🔐 Sign In</Link>
          )}
        </div>
      </aside>
    </>
  );
}
