import { ReactNode, CSSProperties } from "react";

export function Card({
  children,
  className = "",
  title,
  subtitle,
  action,
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return (
    <section 
      className={`card p-3 sm:p-5 fade-in ${className}`} 
      style={style}
      onClick={onClick}
    >
      {(title || action) && (
        <header className="flex items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-sm font-semibold tracking-tight truncate" style={{ color: "var(--text)" }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
}) {
  const map: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: "var(--surface-3)", fg: "var(--text-muted)" },
    success: { bg: "var(--success-soft)", fg: "var(--success)" },
    warning: { bg: "var(--warning-soft)", fg: "var(--warning)" },
    danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
    primary: { bg: "var(--primary-soft)", fg: "var(--primary)" },
  };
  const c = map[tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate" style={{ color: "var(--text)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 truncate" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
