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
  /** local = hide only this card, global = parent hide/show all, none = no eye */
  privacyMode?: "local" | "global" | "none";
  /** Stable id for syncing KPI value with drawer values */
  privacyKey?: string;
}) {
  const key = privacyKey || label;
  const { isHidden, toggle } = usePrivacy();
  const hidden = isHidden(key, privacyMode);
  const canHide = privacyMode !== "none";

  const toneColor: Record<string, string> = {
    primary: "var(--primary)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    accent: "var(--accent)",
  };
  const toneSoft: Record<string, string> = {
    primary: "var(--primary-soft)",
    success: "var(--success-soft)",
    warning: "var(--warning-soft)",
    danger: "var(--danger-soft)",
    accent: "var(--primary-soft)",
  };

  const clickable = Boolean(onClick);

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`card p-3 sm:p-5 fade-in relative overflow-hidden ${clickable ? "cursor-pointer transition-transform active:scale-[0.99] hover:opacity-95" : ""}`}
      style={{
        outline: active ? `2px solid ${toneColor[tone]}` : "none",
        outlineOffset: active ? 2 : 0,
      }}
    >
      <div className={canHide ? "flex items-start justify-between gap-2 pr-8" : "flex items-start justify-between gap-2"}>
        <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide truncate" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        {icon && (
          <span
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl grid place-items-center text-base sm:text-lg shrink-0"
            style={{ background: toneSoft[tone], color: toneColor[tone] }}
          >
            {icon}
          </span>
        )}
      </div>

      {canHide && (
        <button
          type="button"
          aria-label={hidden ? `Show ${label}` : `Hide ${label}`}
          title={privacyMode === "global" ? (hidden ? "Show all values" : "Hide all values") : hidden ? "Show only this value" : "Hide only this value"}
          onClick={(e) => {
            e.stopPropagation();
            toggle(key, privacyMode);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg grid place-items-center text-xs no-print"
          style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
        >
          {hidden ? "🙈" : "👁️"}
        </button>
      )}

      <p className="text-lg sm:text-2xl font-bold mt-2 sm:mt-3 tracking-tight truncate" style={{ color: "var(--text)" }}>
        {hidden ? "**" : value}
      </p>
      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 flex-wrap">
        {trend && !hidden && (
          <span
            className="text-[10px] sm:text-xs font-semibold inline-flex items-center gap-0.5"
            style={{ color: trend.good ?? trend.dir === "up" ? "var(--success)" : "var(--danger)" }}
          >
            {trend.dir === "up" ? "▲" : "▼"} {trend.text}
          </span>
        )}
        {sub && (
          <span className="text-[10px] sm:text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {hidden ? (privacyMode === "global" ? "all values hidden" : "value hidden") : sub}
          </span>
        )}
      </div>
    </div>
  );
}

export function Progress({
  value,
  tone = "primary",
  height = 8,
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
      <div className="h-full rounded-full transition-all" style={{ width: `${v}%`, background: colors[tone] }} />
    </div>
  );
}
