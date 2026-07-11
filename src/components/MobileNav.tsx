"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { useTheme, Theme } from "@/lib/theme";

const MOBILE_NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/income", label: "Income", icon: "💰" },
  { href: "/expenses", label: "Spent", icon: "🧾" },
  { href: "/markets", label: "Markets", icon: "📈" },
];

const MORE_LINKS = [
  { href: "/budget", label: "Budget", icon: "📊" },
  { href: "/bills", label: "Bills", icon: "🔔" },
  { href: "/investments", label: "Invest", icon: "📈" },
  { href: "/savings", label: "Savings", icon: "🐖" },
  { href: "/debt", label: "Loans", icon: "🏦" },
  { href: "/networth", label: "Net Worth", icon: "💎" },
  { href: "/ai", label: "AI Twin", icon: "🤖" },
  { href: "/dreams", label: "Dreams", icon: "✨" },
  { href: "/tax", label: "Tax", icon: "🧮" },
  { href: "/insurance", label: "Insurance", icon: "🛡️" },
  { href: "/control", label: "Control", icon: "🚀" },
  { href: "/brief", label: "Brief", icon: "☀️" },
  { href: "/health", label: "Health", icon: "❤️" },
  { href: "/family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { href: "/wealth", label: "Wealth Map", icon: "🗺️" },
  { href: "/simulator", label: "Simulator", icon: "🔬" },
  { href: "/opportunities", label: "Opportunities", icon: "🔍" },
  { href: "/stress", label: "Stress", icon: "😰" },
  { href: "/coach", label: "Coach", icon: "🧠" },
  { href: "/annual", label: "Annual", icon: "🗓️" },
  { href: "/emergency", label: "Emergency", icon: "🚨" },
  { href: "/reports", label: "Reports", icon: "📑" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

const THEMES: { id: Theme; label: string; emoji: string; color: string }[] = [
  { id: "obsidian", label: "Obsidian", emoji: "🌙", color: "#818cf8" },
  { id: "aurora",   label: "Aurora",   emoji: "🌅", color: "#6366f1" },
  { id: "emerald",  label: "Emerald",  emoji: "🌿", color: "#14b8a6" },
  { id: "royal",    label: "Royal",    emoji: "👑", color: "#fbbf24" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const { session, logout } = useSession();
  const { theme, setTheme, hydrated } = useTheme();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* ─── Bottom Tab Bar ─── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t safe-area-bottom"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-around h-16">
          {MOBILE_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-item flex flex-col items-center justify-center flex-1 h-full ${active ? "active" : ""}`}
                style={{ color: active ? "var(--primary)" : "var(--text-faint)" }}
              >
                <span className="text-lg mb-0.5 transition-transform duration-150" style={{ transform: active ? "scale(1.15)" : "scale(1)" }}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-semibold" style={{ fontWeight: active ? 700 : 500 }}>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(true)}
            className={`mobile-nav-item flex flex-col items-center justify-center flex-1 h-full ${showMore ? "active" : ""}`}
            style={{ color: showMore ? "var(--primary)" : "var(--text-faint)" }}
          >
            <span className="text-lg mb-0.5">☰</span>
            <span className="text-[10px] font-semibold">More</span>
          </button>
        </div>
      </nav>

      {/* ─── More Sheet ─── */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMore(false)} />
          <div
            className="absolute bottom-20 left-3 right-3 rounded-2xl p-5 max-h-[75vh] overflow-y-auto scale-in"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: "var(--text-heading)" }}>Menu</h3>
              <button onClick={() => setShowMore(false)} className="btn btn-ghost w-9 h-9 rounded-full">✕</button>
            </div>

            {/* Theme selector — at the top of More sheet */}
            <div className="mb-4 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>🎨 Theme</p>
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map((t) => {
                  const selected = hydrated && theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className="flex flex-col items-center py-2 rounded-lg transition-all active:scale-95"
                      style={{
                        background: selected ? `${t.color}18` : "transparent",
                        border: selected ? `2px solid ${t.color}` : "2px solid transparent",
                      }}
                    >
                      <span className="text-base mb-0.5">{t.emoji}</span>
                      <span className="text-[8px] font-bold" style={{ color: selected ? t.color : "var(--text-faint)" }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick links grid */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {MORE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMore(false)}
                  className="flex flex-col items-center p-3 rounded-xl transition-all duration-150 active:scale-95"
                  style={{
                    background: isActive(link.href) ? "var(--primary-soft)" : "var(--surface-2)",
                    color: isActive(link.href) ? "var(--primary)" : "var(--text)",
                  }}
                >
                  <span className="text-xl mb-1">{link.icon}</span>
                  <span className="text-[10px] font-semibold text-center leading-tight">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Account section — always visible */}
            {session && (
              <div className="border-t pt-3 space-y-2" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2.5 px-2 mb-2">
                  <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                    {session.profileImage ? <img src={session.profileImage} alt="" className="w-full h-full rounded-full object-cover" /> : session.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text-heading)" }}>{session.name}</p>
                    <p className="text-[10px] truncate" style={{ color: "var(--text-faint)" }}>{session.email}</p>
                  </div>
                </div>
                <Link href="/settings" onClick={() => setShowMore(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium w-full"
                  style={{ background: "var(--surface-2)", color: "var(--text)" }}
                >
                  ⚙️ Settings
                </Link>
                <button
                  onClick={() => { logout(); setShowMore(false); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold w-full"
                  style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
