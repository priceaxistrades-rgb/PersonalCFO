"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const MOBILE_NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/income", label: "Income", icon: "💰" },
  { href: "/expenses", label: "Expenses", icon: "🧾" },
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
      {/* Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-around h-16 safe-area-bottom">
          {MOBILE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                isActive(item.href) ? "active" : ""
              }`}
              style={{ color: isActive(item.href) ? "var(--primary)" : "var(--text-muted)" }}
            >
              <span className="text-xl mb-0.5 transition-transform duration-200" style={{
                transform: isActive(item.href) ? "scale(1.15)" : "scale(1)",
              }}>{item.icon}</span>
              <span className="text-[10px] font-medium" style={{
                fontWeight: isActive(item.href) ? 700 : 500,
              }}>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowMore(true)}
            className={`mobile-nav-item flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
              showMore ? "active" : ""
            }`}
            style={{ color: showMore ? "var(--primary)" : "var(--text-muted)" }}
          >
            <span className="text-xl mb-0.5">☰</span>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Modal */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMore(false)} />

          {/* Modal */}
          <div
            className="absolute bottom-20 left-4 right-4 rounded-2xl p-4 max-h-[70vh] overflow-y-auto shadow-2xl card fade-in-up"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg" style={{ color: "var(--text)" }}>
                All Sections
              </h3>
              <button
                onClick={() => setShowMore(false)}
                className="p-2 rounded-full active:scale-90 transition-transform"
                style={{ background: "var(--surface-3)" }}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {MORE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMore(false)}
                  className="flex flex-col items-center p-3 rounded-xl active:scale-95 transition-all duration-200"
                  style={{
                    background: isActive(link.href) ? "var(--primary-soft)" : "var(--surface-2)",
                    color: isActive(link.href) ? "var(--primary)" : "var(--text)",
                  }}
                >
                  <span className="text-2xl mb-1">{link.icon}</span>
                  <span className="text-xs text-center font-medium">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
