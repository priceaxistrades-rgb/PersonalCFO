"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { usePrivacy } from "@/lib/privacy";
import { IconEye, IconEyeOff } from "@/components/ui/Icons";

const KPI_DETAIL_ROUTES: Array<[RegExp, string]> = [
  [/projected net worth|wealth velocity/i, "/wealth"],
  [/net worth|gross assets|net growth/i, "/networth"],
  [/income|revenue/i, "/income"],
  [/expense|spend|outflow/i, "/expenses"],
  [/budget|ceiling|allocation/i, "/budget"],
  [/bill|overdue|due within|cleared this cycle|^outstanding$/i, "/bills"],
  [/portfolio|investment|invested|holding|unrealized|valuation change|cagr|yield/i, "/investments"],
  [/debt|liabilit|emi|capital repaid|weighted rate|total outstanding/i, "/debt"],
  [/emergency/i, "/emergency"],
  [/insurance|coverage|polic|premium|renewal/i, "/insurance"],
  [/preparedness|key contacts/i, "/emergency"],
  [/goal|vault|milestone|total saved reserves|overall progress/i, "/savings"],
  [/family|member|top spender|per member/i, "/family"],
  [/health/i, "/health"],
  [/annual|total goals|completed|in progress|avg progress/i, "/annual"],
  [/dream/i, "/dreams"],
  [/tax/i, "/tax"],
  [/savings rate|monthly savings|6-mo|six-month/i, "/reports"],
];

function inferKpiDetailsRoute(label: string): string | undefined {
  return KPI_DETAIL_ROUTES.find(([pattern]) => pattern.test(label))?.[1];
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  tone = "primary",
  trend,
  onClick,
  detailsHref,
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
  detailsHref?: string | false;
  active?: boolean;
  privacyMode?: "local" | "global" | "none";
  privacyKey?: string;
}) {
  const router = useRouter();
  const key = privacyKey || label;
  const { isHidden, toggle } = usePrivacy();
  const hidden = isHidden(key, privacyMode);
  const canHide = privacyMode !== "none";
  const inferredHref = detailsHref === false ? undefined : (detailsHref || inferKpiDetailsRoute(label));
  const activate = onClick || (inferredHref ? () => router.push(inferredHref) : undefined);
  const clickable = Boolean(activate);

  // Semantic color accents for top border & trend badges
  const toneMap: Record<string, { border: string; badgeBg: string; badgeText: string }> = {
    primary: { border: "var(--primary)", badgeBg: "var(--primary-soft)", badgeText: "var(--primary)" },
    success: { border: "var(--success)", badgeBg: "var(--success-soft)", badgeText: "var(--success)" },
    warning: { border: "var(--warning)", badgeBg: "var(--warning-soft)", badgeText: "var(--warning)" },
    danger:  { border: "var(--danger)",  badgeBg: "var(--danger-soft)",  badgeText: "var(--danger)" },
    accent:  { border: "var(--accent)",  badgeBg: "var(--accent-soft)",  badgeText: "var(--accent)" },
  };
  const t = toneMap[tone] || toneMap.primary;

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={activate}
      onKeyDown={(e) => {
        if (!activate) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
      }}
      aria-label={clickable ? `${label}: open detailed view` : undefined}
      data-tone={tone}
      className={`kpi-card mobile-kpi-card p-4 sm:p-5 relative group overflow-hidden transition-all duration-300 rounded-[1.15rem] sm:rounded-3xl border shadow-lg ${
        clickable ? "cursor-pointer" : ""
      }`}
      style={{
        background: active ? "var(--surface)" : "var(--surface)",
        borderColor: active ? t.border : "var(--border)",
        boxShadow: active ? `0 12px 32px -8px ${t.badgeBg}` : "var(--shadow)",
        outline: active ? `2px solid ${t.border}` : "none",
        outlineOffset: active ? 2 : 0,
      }}
    >
      {/* Top indicator track */}
      <div 
        className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-300 opacity-60 group-hover:opacity-100"
        style={{ background: t.border }}
      />

      {/* Top Label & Icon Strip */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pt-0.5">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className="kpi-card-icon w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-white/5 dark:bg-white/5 text-slate-400">
              {icon}
            </span>
          )}
          <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.14em] text-slate-400 truncate">
            {label}
          </span>
        </div>

        {/* Privacy Eye Toggle */}
        {canHide && (
          <button
            type="button"
            aria-label={hidden ? `Show ${label}` : `Hide ${label}`}
            title={hidden ? "Click to reveal value" : "Click to shield value (privacy mode)"}
            onClick={(e) => { e.stopPropagation(); toggle(key, privacyMode); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center no-print transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-surface-3"
            style={{ color: hidden ? "var(--warning)" : "var(--text-muted)" }}
          >
            {hidden ? <IconEyeOff size={14} /> : <IconEye size={14} />}
          </button>
        )}
      </div>

      {/* Primary Numerical Readout */}
      <div className="mt-1.5">
        <p className="kpi-card-value text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight truncate leading-tight" style={{ color: "var(--text-heading)" }}>
          {hidden ? "••••••" : value}
        </p>
      </div>

      {/* Micro-Telemetry Sparkline Track */}
      <div className="w-full h-1 rounded-full overflow-hidden mt-3.5 mb-2 bg-surface-3/60">
        <div 
          className="h-full rounded-full transition-all duration-700"
          style={{ 
            width: trend ? (trend.dir === "up" ? "88%" : "38%") : "64%", 
            background: trend ? ((trend.good ?? trend.dir === "up") ? "var(--success)" : "var(--danger)") : t.border 
          }} 
        />
      </div>

      {/* Bottom Trend & Subtitle Strip */}
      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap min-h-[20px]">
        {trend && !hidden ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0"
            style={{
              background: (trend.good ?? trend.dir === "up") ? "var(--success-soft)" : "var(--danger-soft)",
              color: (trend.good ?? trend.dir === "up") ? "var(--success)" : "var(--danger)",
            }}
          >
            <span>{trend.dir === "up" ? "↗" : "↘"}</span>
            <span>{trend.text}</span>
          </span>
        ) : <span />}
        {sub && (
          <span className="text-[11px] font-medium truncate flex-1 text-right" style={{ color: "var(--text-faint)" }}>
            {hidden ? (privacyMode === "global" ? "shielded" : "hidden") : sub}
          </span>
        )}
      </div>
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
        style={{ width: `${v}%`, background: colors[tone] || colors.primary }}
      />
    </div>
  );
}
