import { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  sub,
  icon,
  tone = "primary",
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger" | "accent";
  trend?: { dir: "up" | "down"; text: string; good?: boolean };
}) {
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
  return (
    <div className="card p-3 sm:p-5 fade-in relative overflow-hidden">
      <div className="flex items-start justify-between gap-2">
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
      <p className="text-lg sm:text-2xl font-bold mt-2 sm:mt-3 tracking-tight truncate" style={{ color: "var(--text)" }}>
        {value}
      </p>
      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 flex-wrap">
        {trend && (
          <span
            className="text-[10px] sm:text-xs font-semibold inline-flex items-center gap-0.5"
            style={{
              color: trend.good ?? trend.dir === "up" ? "var(--success)" : "var(--danger)",
            }}
          >
            {trend.dir === "up" ? "▲" : "▼"} {trend.text}
          </span>
        )}
        {sub && (
          <span className="text-[10px] sm:text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {sub}
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
  value: number; // 0-100
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
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ background: "var(--surface-3)", height }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${v}%`, background: colors[tone] }}
      />
    </div>
  );
}
