"use client";

import { usePrivacy } from "@/lib/privacy";

export function PrivacyToggle() {
  const { globalHidden, toggle } = usePrivacy();

  return (
    <button
      onClick={() => toggle("global", "global")}
      className="relative p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        background: globalHidden ? "var(--warning-soft)" : "var(--surface-2)",
        border: globalHidden ? "1.5px solid var(--warning)" : "1.5px solid var(--border)",
        color: globalHidden ? "var(--warning)" : "var(--text-muted)",
        minWidth: 44,
        minHeight: 44,
      }}
      title={globalHidden ? "Show all financial values" : "Hide all financial values"}
      aria-label={globalHidden ? "Show values — currently hidden" : "Hide values — currently visible"}
      aria-pressed={globalHidden}
    >
      <span className="text-lg" aria-hidden="true">{globalHidden ? "🙈" : "👁️"}</span>
      {globalHidden && (
        <span className="sr-only">Values are currently hidden</span>
      )}
    </button>
  );
}
