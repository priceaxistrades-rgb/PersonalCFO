"use client";

import { ProfileUploadModal } from "./ProfileUploadModal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme, Theme } from "@/lib/theme";
import { useMemberFilter } from "@/lib/filters";
import { useSession } from "@/lib/session";

const NAV = [
  { group: "Overview", items: [{ href: "/", label: "Dashboard", icon: "🏠" }] },
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
      { href: "/investments", label: "Investments", icon: "📈" },
      { href: "/markets", label: "Markets", icon: "🛰️" },
      { href: "/debt", label: "Debt", icon: "🏦" },
      { href: "/networth", label: "Net Worth", icon: "💎" },
    ],
  },
  {
    group: "Planning",
    items: [
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

const THEMES: { id: Theme; label: string; color: string; gradient: string }[] = [
  { id: "obsidian", label: "Obsidian", color: "#818cf8", gradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
  { id: "aurora",   label: "Aurora",   color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1, #0ea5e9)" },
  { id: "emerald",  label: "Emerald",  color: "#14b8a6", gradient: "linear-gradient(135deg, #0d9488, #14b8a6)" },
  { id: "royal",    label: "Royal",    color: "#fbbf24", gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
];

function ProfileIndicator() {
  const { hasSelection, activeProfile, selectedIds, clear } = useMemberFilter();
  if (!hasSelection) return null;
  return (
    <div className="px-5 py-3 border-t hidden lg:block" style={{ borderColor: "var(--border)" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Profile</p>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "var(--primary-soft)" }}>
        <span className="text-sm font-medium truncate" style={{ color: "var(--primary)" }}>
          👤 {activeProfile || `${selectedIds.length} selected`}
        </span>
        <button onClick={clear} className="btn btn-ghost text-[11px] px-2 py-1">Reset</button>
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
      <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="h-10 rounded-lg shimmer" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <Link href="/login" className="btn btn-primary w-full py-3">
          🔐 Sign In
        </Link>
        <p className="text-[11px] text-center mt-2" style={{ color: "var(--text-faint)" }}>
          New user? <Link href="/signup" style={{ color: "var(--primary)" }} className="font-semibold">Create account</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-3 mb-3 group cursor-pointer" onClick={() => setShowUpload(true)}>
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full overflow-hidden grid place-items-center text-sm font-bold transition-all duration-200 group-hover:ring-2 group-hover:ring-[var(--primary)]"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {session.profileImage ? (
              <img src={session.profileImage} alt={session.name} className="w-full h-full object-cover" />
            ) : (
              session.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full grid place-items-center text-[8px]" style={{ background: "var(--primary)", color: "#fff" }}>📷</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-heading)" }}>{session.name}</p>
          <p className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>{session.email}</p>
        </div>
      </div>
      <button onClick={logout} className="btn btn-secondary w-full py-2.5 text-sm">
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

      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed lg:sticky top-0 z-40 lg:z-auto h-screen w-[280px] flex flex-col transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)] ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
      >
        {/* ─── Logo ─── */}
        <div className="hidden lg:flex px-6 py-6 items-center gap-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="w-10 h-10 rounded-xl grid place-items-center text-xl shadow-lg" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            📊
          </div>
          <div>
            <p className="font-extrabold tracking-tight text-base" style={{ color: "var(--text-heading)" }}>Personal CFO</p>
            <p className="text-[10px] font-medium" style={{ color: "var(--text-faint)" }}>Family Wealth Suite</p>
          </div>
        </div>

        {/* ─── Close (mobile) ─── */}
        <div className="lg:hidden flex justify-end p-3">
          <button onClick={() => setOpen(false)} className="btn btn-ghost w-9 h-9">✕</button>
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--text-faint)" }}>
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                        active ? "nav-active" : ""
                      }`}
                      style={{
                        color: active ? "var(--primary)" : "var(--text-muted)",
                      }}
                    >
                      <span className="text-[15px]">{item.icon}</span>
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

        {/* ─── Theme Selector ─── */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "var(--text-faint)" }}>Theme</p>
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map((t) => {
              const selected = hydrated && theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                  aria-label={`Switch to ${t.label}`}
                  className="theme-btn h-9 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    background: selected ? t.gradient : "var(--surface-3)",
                    border: selected ? `2px solid ${t.color}` : "2px solid var(--border)",
                    boxShadow: selected ? `0 0 16px ${t.color}33` : "none",
                  }}
                >
                  {selected ? (
                    <span className="text-[11px] font-bold text-white">✓</span>
                  ) : (
                    <span className="block w-2 h-2 rounded-full" style={{ background: t.gradient }} />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-center mt-2 font-semibold" style={{ color: "var(--primary)" }}>
            {THEMES.find((t) => t.id === theme)?.label || "Obsidian"}
          </p>
        </div>
      </aside>
    </>
  );
}
