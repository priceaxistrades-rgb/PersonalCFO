"use client";

import { ProfileUploadModal } from "./ProfileUploadModal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme, Theme } from "@/lib/theme";
import { useMemberFilter } from "@/lib/filters";
import { useSession } from "@/lib/session";

const NAV = [
  { group: "Overview", items: [{ href: "/", label: "Dashboard", icon: "🏠" }, { href: "/control", label: "Mission Control", icon: "🚀" }, { href: "/brief", label: "Morning Brief", icon: "☀️" }, { href: "/health", label: "Health Score", icon: "❤️" }] },
  {
    group: "Money Flow",
    items: [
      { href: "/income", label: "Income", icon: "💰" },
      { href: "/expenses", label: "Expenses", icon: "🧾" },
      { href: "/budget", label: "Budget", icon: "📊" },
      { href: "/family", label: "Family", icon: "👨‍👩‍👧‍👦" },
      { href: "/bills", label: "Bills", icon: "🔔" },
    ],
  },
  {
    group: "Wealth",
    items: [
      { href: "/savings", label: "Savings", icon: "🐖" },
      { href: "/wealth", label: "Wealth Timeline", icon: "🗺️" },
      { href: "/investments", label: "Investments", icon: "📈" },
      { href: "/markets", label: "Markets", icon: "🛰️" },
      { href: "/debt", label: "Debt", icon: "🏦" },
      { href: "/networth", label: "Net Worth", icon: "💎" },
    ],
  },
  {
    group: "Planning",
    items: [
      { href: "/ai", label: "AI Twin", icon: "🤖" },
      { href: "/simulator", label: "Life Simulator", icon: "🔬" },
      { href: "/opportunities", label: "Opportunities", icon: "🔍" },
      { href: "/stress", label: "Stress Meter", icon: "😰" },
      { href: "/coach", label: "Wealth Coach", icon: "🧠" },
      { href: "/dreams", label: "Dream Planner", icon: "✨" },
      { href: "/annual", label: "Annual", icon: "🗓️" },
      { href: "/tax", label: "Tax", icon: "🧮" },
      { href: "/insurance", label: "Insurance", icon: "🛡️" },
      { href: "/emergency", label: "Emergency", icon: "🚨" },
      { href: "/reports", label: "Reports", icon: "📑" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/onboarding", label: "Onboarding", icon: "✅" },
      { href: "/settings", label: "Settings", icon: "⚙️" },
      { href: "/privacy", label: "Privacy", icon: "🔐" },
      { href: "/terms", label: "Terms", icon: "📜" },
    ],
  },
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
      <div className="flex items-center gap-2 mb-2 group cursor-pointer" onClick={() => setShowUpload(true)}>
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full overflow-hidden grid place-items-center text-xs font-bold transition-all duration-200 group-hover:ring-2 group-hover:ring-[var(--primary)]"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {session.profileImage ? (
              <img src={session.profileImage} alt={session.name} className="w-full h-full object-cover" />
            ) : (
              session.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full grid place-items-center text-[6px]" style={{ background: "var(--primary)", color: "#fff" }}>📷</div>
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

/** Theme selector — compact for sidebar bottom (desktop) */
function ThemeSelectorDesktop({ hydrated, theme, setTheme }: { hydrated: boolean; theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: "var(--text-faint)" }}>Theme</p>
      <div className="grid grid-cols-4 gap-1.5">
        {THEMES.map((t) => {
          const selected = hydrated && theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.label}
              aria-label={`Switch to ${t.label}`}
              className="theme-btn h-7 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                background: selected ? t.gradient : "var(--surface-3)",
                border: selected ? `2px solid ${t.color}` : "2px solid var(--border)",
                boxShadow: selected ? `0 0 12px ${t.color}33` : "none",
              }}
            >
              {selected ? (
                <span className="text-[10px] font-bold text-white">✓</span>
              ) : (
                <span className="block w-1.5 h-1.5 rounded-full" style={{ background: t.gradient }} />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-center mt-1.5 font-semibold" style={{ color: "var(--primary)" }}>
        {THEMES.find((t) => t.id === theme)?.label || "Obsidian"}
      </p>
    </div>
  );
}

/** Theme selector — inline above Net Worth (mobile sidebar) */
function ThemeSelectorMobile({ hydrated, theme, setTheme }: { hydrated: boolean; theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div className="px-2.5 py-2.5 rounded-xl mb-1" style={{ background: "var(--surface-2)" }}>
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] mb-2 flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
        🎨 Theme
      </p>
      <div className="grid grid-cols-4 gap-1.5">
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
                background: selected ? `${t.color}18` : "transparent",
                border: selected ? `2px solid ${t.color}` : "2px solid transparent",
                boxShadow: selected ? `0 0 10px ${t.color}22` : "none",
              }}
            >
              <span className="text-sm leading-none mb-0.5">{t.emoji}</span>
              <span className="text-[7px] font-bold" style={{ color: selected ? t.color : "var(--text-faint)" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, hydrated } = useTheme();
  const [open, setOpen] = useState(false);

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
        <button onClick={() => setOpen(!open)} className="btn btn-ghost w-10 h-10 text-lg" aria-label="Menu">
          {open ? "✕" : "☰"}
        </button>
      </header>

      {/* ─── Mobile Overlay ─── */}
      {open && <div className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP: Compact sticky sidebar — 220px, no animation
          ═══════════════════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex flex-col sticky top-0 z-40 h-screen w-[220px] flex-shrink-0"
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
      >
        {/* ─── Logo ─── */}
        <div className="px-4 py-4 flex items-center gap-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="w-8 h-8 rounded-lg grid place-items-center text-sm shadow-md flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            📊
          </div>
          <div>
            <p className="font-extrabold tracking-tight text-sm" style={{ color: "var(--text-heading)" }}>Personal CFO</p>
            <p className="text-[8px] font-medium" style={{ color: "var(--text-faint)" }}>Family Wealth Suite</p>
          </div>
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--text-faint)" }}>
                {section.group}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] font-medium transition-colors duration-150 ${
                        active ? "nav-active" : ""
                      }`}
                      style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}
                    >
                      <span className="text-[13px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <ProfileIndicator />
        <AuthButton />
        <ThemeSelectorDesktop hydrated={hydrated} theme={theme} setTheme={setTheme} />
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE: Hamburger sidebar with theme above Net Worth
          ═══════════════════════════════════════════════════════════ */}
      <aside
        className={`lg:hidden fixed top-0 z-40 h-screen w-[260px] flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
      >
        <div className="flex justify-end p-3">
          <button onClick={() => setOpen(false)} className="btn btn-ghost w-9 h-9">✕</button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--text-faint)" }}>
                {section.group}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors duration-150 ${
                        active ? "nav-active" : ""
                      }`}
                      style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}
                    >
                      <span className="text-[14px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              {/* Theme selector above Net Worth — mobile only */}
              {section.group === "Wealth" && (
                <div className="mt-2">
                  <ThemeSelectorMobile hydrated={hydrated} theme={theme} setTheme={setTheme} />
                </div>
              )}
            </div>
          ))}
        </nav>

        <AuthButton />
      </aside>
    </>
  );
}
