"use client";

import { usePrivacy } from "@/lib/privacy";
import { IconLock, IconEye } from "@/components/ui/Icons";

export function PrivacyToggle() {
  const { globalHidden, toggle } = usePrivacy();

  return (
    <button
      onClick={() => toggle("global", "global")}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 select-none cursor-pointer border group"
      style={{
        background: globalHidden ? "var(--warning-soft)" : "var(--surface-2)",
        borderColor: globalHidden ? "var(--warning)" : "var(--border)",
        color: globalHidden ? "var(--warning)" : "var(--text)",
        minHeight: 40,
      }}
      title={globalHidden ? "Reveal all household financial figures" : "Shield and mask all financial values on screen"}
      aria-label={globalHidden ? "Show values — currently shielded" : "Hide values — currently visible"}
      aria-pressed={globalHidden}
    >
      <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
        {globalHidden ? <IconLock size={15} /> : <IconEye size={15} />}
      </span>
      <span className="tracking-tight font-mono">
        {globalHidden ? "Shield Active" : "Privacy Shield"}
      </span>
      {globalHidden && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
      )}
    </button>
  );
}
