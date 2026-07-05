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
      { href: "/budget", label: "Budget Planner", icon: "📊" },
      { href: "/family", label: "Family Budget", icon: "👨‍👩‍👧‍👦" },
      { href: "/bills", label: "Bill Tracker", icon: "🔔" },
    ],
  },
  {
    group: "Wealth",
    items: [
      { href: "/savings", label: "Savings & Goals", icon: "🐖" },
      { href: "/investments", label: "Investments", icon: "📈" },
      { href: "/markets", label: "Live Markets", icon: "🛰️" },
      { href: "/debt", label: "Debt & Loans", icon: "🏦" },
      { href: "/networth", label: "Net Worth", icon: "💎" },
    ],
  },
  {
    group: "Planning",
    items: [
      { href: "/annual", label: "Annual Planner", icon: "🗓️" },
      { href: "/tax", label: "Tax Planner", icon: "🧮" },
      { href: "/insurance", label: "Insurance", icon: "🛡️" },
      { href: "/emergency", label: "Emergency", icon: "🚨" },
      { href: "/reports", label: "Reports", icon: "📑" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/onboarding", label: "Onboarding", icon: "✅" },
      { href: "/settings", label: "Settings & Data", icon: "⚙️" },
      { href: "/privacy", label: "Privacy", icon: "🔐" },
      { href: "/terms", label: "Terms", icon: "📜" },
    ],
  },
];

const THEMES: { id: Theme; label: string; dot: string }[] = [
  { id: "light", label: "Minimal White", dot: "#ffffff" },
  { id: "dark", label: "Premium Dark", dot: "#131a26" },
  { id: "blue", label: "Professional Blue", dot: "#1e6fd9" },
  { id: "black", label: "Readable Black", dot: "#000000" },
];

function ProfileIndicator() {
  const { hasSelection, activeProfile, selectedIds, clear } = useMemberFilter();

  if (!hasSelection) return null;

  return (
    <div className="px-4 py-3 border-t hidden lg:block" style={{ borderColor: "rgba(128,128,128,0.15)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>
        Active Profile
      </p>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "var(--primary-soft)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <span>👤</span>
          <span className="text-sm font-medium truncate" style={{ color: "var(--primary)" }}>
            {activeProfile || `${selectedIds.length} selected`}
          </span>
        </div>
        <button onClick={clear} className="text-xs px-2 py-1 rounded" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
          Reset
        </button>
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
      <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(128,128,128,0.15)" }}>
        <div className="h-10 rounded-lg animate-pulse" style={{ background: "var(--surface-3)" }} />
        <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-muted)" }}>
          Checking session...
        </p>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(128,128,128,0.15)" }}>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium text-white"
          style={{ background: "var(--primary)" }}
        >
          🔐 Sign In
        </Link>
        <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-muted)" }}>
          New user?{" "}
          <Link href="/signup" style={{ color: "var(--primary)" }}>
            Create account
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(128,128,128,0.15)" }}>
      <div className="flex items-center gap-3 mb-3 group cursor-pointer" onClick={() => setShowUpload(true)}>
        <div className="relative">
          <div 
            className="w-10 h-10 rounded-full overflow-hidden grid place-items-center text-lg font-bold border-2 border-transparent group-hover:border-primary transition-all"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {session.profileImage ? (
              <img src={session.profileImage} alt={session.name} className="w-full h-full object-cover" />
            ) : (
              session.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border shadow-sm flex items-center justify-center text-[8px]" style={{ color: "var(--primary)" }}>
            📷
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate" style={{ color: "var(--text)" }}>{session.name}</p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{session.email}</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg font-medium text-sm"
        style={{ background: "var(--surface-3)", color: "var(--text)" }}
      >
        🚪 Sign Out
      </button>

      {showUpload && (
        <ProfileUploadModal 
          user={session} 
          onUploadSuccess={(path) => {
            setShowUpload(false);
            router.refresh();
          }} 
          onClose={() => setShowUpload(false)}
        />
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
      {/* Mobile Header - Fixed at top */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: "var(--sidebar)", borderColor: "var(--border)" }}
      >
        <Link href="/" className="font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
          <span className="text-lg">📊</span>
          <span className="text-sm">Personal CFO</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 grid place-items-center rounded-lg active:scale-95 transition-transform"
          style={{ background: "var(--surface-3)", color: "var(--text)" }}
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile Overlay */}
      {open && <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} />}

      {/* Sidebar - Hidden on mobile by default, shown when open */}
      <aside
        className={`fixed lg:sticky top-0 z-40 lg:z-auto h-screen w-72 flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo - Hidden on mobile (shown in header), visible on desktop */}
        <div className="hidden lg:block px-5 py-5 border-b" style={{ borderColor: "rgba(128,128,128,0.15)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl grid place-items-center text-xl shadow"
              style={{ background: "linear-gradient(135deg,#6366f1,#0ea5e9)" }}
            >
              📊
            </div>
            <div>
              <p className="font-bold tracking-tight leading-tight" style={{ color: "var(--text)" }}>
                Personal CFO
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Family Wealth Suite
              </p>
            </div>
          </div>
        </div>

        {/* Close button for mobile */}
        <div className="lg:hidden flex justify-end p-3">
          <button onClick={() => setOpen(false)} className="p-2 rounded-lg" style={{ background: "var(--surface-3)" }}>
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                {section.group}
              </p>
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors"
                    style={{
                      background: active ? "var(--primary)" : "transparent",
                      color: active ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <ProfileIndicator />

        <AuthButton />

        {/* Theme Selector */}
        <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(128,128,128,0.15)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>
            Theme
          </p>
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.label}
                aria-label={`Switch to ${t.label}`}
                className="theme-btn h-8 rounded-lg border-2 grid place-items-center transition-all"
                style={{
                  borderColor: theme === t.id ? "var(--primary)" : "var(--border)",
                  background: t.dot,
                }}
              >
                {hydrated && theme === t.id && <span className="text-[10px] font-bold" style={{ color: t.id === "light" ? "#000" : "#fff" }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
