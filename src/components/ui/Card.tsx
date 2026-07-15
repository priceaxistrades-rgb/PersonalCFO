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
  variant?: "default" | "3d" | "glass" | "kpi" | "bento";
}) {
  let baseClass = "card";
  if (variant === "glass") baseClass = "card-glass";
  if (variant === "bento") baseClass = "bento-card";

  return (
    <section
      className={`${baseClass} mobile-card p-4 sm:p-6 fade-in relative group transition-all duration-300 rounded-[1.25rem] sm:rounded-3xl border overflow-hidden ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-2xl hover:border-indigo-500/50" : "hover:border-white/15 dark:hover:border-white/15"
      } ${className}`}
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow)",
        ...style,
      }}
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/50 via-purple-500/40 to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {(title || action) && (
        <header className="mobile-card-header flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 border-b pb-3.5 sm:pb-4 -mx-0.5 px-0.5 relative z-10" style={{ borderColor: "var(--border)" }}>
          <div className="min-w-0 flex-1 w-full sm:w-auto">
            {title && (
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight text-balance" style={{ color: "var(--text-heading)" }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm mt-1 font-medium leading-relaxed line-clamp-2" style={{ color: "var(--text-faint)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="mobile-card-actions shrink-0 flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">{action}</div>}
        </header>
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
  className?: string;
}) {
  const cls = `badge badge-${tone} font-semibold tracking-wide px-2.5 py-1 text-xs sm:text-[11px] rounded-full transition-transform duration-200 ${className}`;
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
    <div className="section-title mobile-page-title flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 sm:mb-8 fade-in-up pb-4 border-b" style={{ borderColor: "var(--border)" }}>
      <div className="min-w-0 flex-1">
        <p className="hidden sm:block text-[10px] font-mono font-black uppercase tracking-[0.18em] mb-1" style={{ color: "var(--primary)" }}>
          Personal CFO Workspace
        </p>
        <h1 className="text-[clamp(1.55rem,7vw,2.15rem)] sm:text-3xl font-black tracking-tight leading-[1.05] text-balance" style={{ color: "var(--text-heading)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-2 font-medium leading-relaxed max-w-3xl" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="section-title-actions shrink-0 flex items-center gap-2.5 overflow-x-auto sm:flex-wrap lg:flex-nowrap pb-1 sm:pb-0">{action}</div>}
    </div>
  );
}
