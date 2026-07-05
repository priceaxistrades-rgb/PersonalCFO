import { ReactNode, CSSProperties, MouseEvent } from "react";

export function Card({
  children,
  className = "",
  title,
  subtitle,
  action,
  style,
  onClick,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  style?: CSSProperties;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  variant?: "default" | "3d" | "glass" | "kpi";
}) {
  const baseClass = variant === "glass" ? "card-glass" : "card";

  return (
    <section
      className={`${baseClass} p-4 sm:p-6 fade-in ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={style}
      onClick={onClick}
    >
      {(title || action) && (
        <header className="flex items-start justify-between mb-4 sm:mb-5 gap-3">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-sm font-bold tracking-tight" style={{ color: "var(--text-heading)" }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs mt-1 truncate" style={{ color: "var(--text-faint)" }}>
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
  const cls = `badge badge-${tone}`;
  return <span className={cls}>{children}</span>;
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
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 fade-in-up">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-heading)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1.5 truncate" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
