"use client";

import { ReactNode } from "react";
import { usePrivacy } from "@/lib/privacy";

export function KpiCard({
  label,
  value,
  sub,
  icon,
  tone = "primary",
  trend,
  onClick,
  active = false,
  privacyMode = "local",
  privacyKey,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "accent";
  trend?: { dir: "up" | "down"; text: string; good?: boolean };
  onClick?: () => void;
  active?: boolean;
  privacyMode?: "local" | "global" | "none";
  privacyKey?: string;
}) {
  const key = privacyKey || label;
  const { isHidden, toggle } = usePrivacy();
  const hidden = isHidden(key, privacyMode);
  const canHide = privacyMode !== "none";

  const toneColors: Record<string, { color: string; soft: string; gradient: string }> = {
    primary: { color: "var(--primary)", soft: "var(--primary-soft)", gradient: "linear-gradient(135deg, var(--primary), var(--accent))" },
    success: { color: "var(--success)", soft: "var(--success-soft)", gradient: "linear-gradient(135deg, var(--success), #059669)" },
    warning: { color: "var(--warning)", soft: "var(--warning-soft)", gradient: "linear-gradient(135deg, var(--warning), #d97706)" },
    danger:  { color: "var(--danger)",  soft: "var(--danger-soft)",  gradient: "linear-gradient(135deg, var(--danger), #e11d48)" },
    accent:  { color: "var(--accent)",  soft: "var(--primary-soft)", gradient: "linear-gradient(135deg, var(--accent), var(--primary))" },
  };

  const t = toneColors[tone];
  const clickable = Boolean(onClick);

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
      }}
      className={`kpi-card card p-4 sm:p-5 fade-in relative ${clickable ? "cursor-pointer" : ""}`}
      style={{
        outline: active ? `2px solid ${t.color}` : "none",
        outlineOffset: active ? 2 : 0,
      }}
    >
      {/* Icon badge */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
          {label}
        </p>
        {icon && (
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl grid place-items-center text-base sm:text-lg shrink-0"
            style={{ background: t.gradient, color: "#fff", boxShadow: `0 4px 12px ${t.soft}` }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate" style={{ color: "var(--text-heading)" }}>
        {hidden ? "••" : value}
      </p>

      {/* Trend + sub */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {trend && !hidden && (
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold"
            style={{
              background: (trend.good ?? trend.dir === "up") ? "var(--success-soft)" : "var(--danger-soft)",
              color: (trend.good ?? trend.dir === "up") ? "var(--success)" : "var(--danger)",
            }}
          >
            {trend.dir === "up" ? "↑" : "↓"} {trend.text}
          </span>
        )}
        {sub && (
          <span className="text-[11px] truncate" style={{ color: "var(--text-faint)" }}>
            {hidden ? (privacyMode === "global" ? "all values hidden" : "value hidden") : sub}
          </span>
        )}
      </div>

      {/* Privacy toggle */}
      {canHide && (
        <button
          type="button"
          aria-label={hidden ? `Show ${label}` : `Hide ${label}`}
          onClick={(e) => { e.stopPropagation(); toggle(key, privacyMode); }}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg grid place-items-center text-xs no-print opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: "var(--surface-3)", color: "var(--text-muted)", ...(clickable ? { opacity: 0.5 } : {}) }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = clickable ? "0.5" : "0"; }}
        >
          {hidden ? "🙈" : "👁️"}
        </button>
      )}
    </div>
  );
}

export function Progress({
  value,
  tone = "primary",
  height = 6,
}: {
  value: number;
  tone?: "primary" | "success" | "warning" | "danger";
  height?: number;
}) {
  const colors: Record<string, string> = {
    primary: "var(--primary)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
  };
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ background: "var(--surface-3)", height }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${v}%`, background: colors[tone] }}
      />
    </div>
  );
}
