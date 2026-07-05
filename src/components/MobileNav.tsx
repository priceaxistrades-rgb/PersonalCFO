"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const MOBILE_NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/income", label: "Income", icon: "💰" },
  { href: "/expenses", label: "Spent", icon: "🧾" },
  { href: "/markets", label: "Markets", icon: "📈" },
];

const MORE_LINKS = [
  { href: "/budget", label: "Budget", icon: "📊" },
  { href: "/savings", label: "Savings", icon: "🐖" },
  { href: "/investments", label: "Invest", icon: "💎" },
  { href: "/debt", label: "Loans", icon: "🏦" },
  { href: "/networth", label: "Net Worth", icon: "💎" },
  { href: "/bills", label: "Bills", icon: "🔔" },
  { href: "/family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { href: "/tax", label: "Tax", icon: "🧮" },
  { href: "/insurance", label: "Insurance", icon: "🛡️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

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
            className="absolute bottom-20 left-3 right-3 rounded-2xl p-5 max-h-[70vh] overflow-y-auto scale-in"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--text-heading)" }}>All Sections</h3>
              <button onClick={() => setShowMore(false)} className="btn btn-ghost w-9 h-9 rounded-full">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
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
                  <span className="text-2xl mb-1">{link.icon}</span>
                  <span className="text-[11px] font-semibold text-center">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
