import { ReactNode } from "react";

export function Table({
  headers,
  children,
  right = [],
}: {
  headers: string[];
  children: ReactNode;
  right?: number[];
}) {
  return (
    <div className="table-scroll border rounded-2xl overflow-x-auto shadow-xl transition-all" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <table className="w-full min-w-[720px] text-sm border-collapse">
        <thead>
          <tr className="border-b transition-colors" style={{ background: "var(--surface-2)", borderColor: "var(--border-strong)" }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-4 whitespace-nowrap text-[10px] font-mono font-extrabold uppercase tracking-[0.14em] select-none ${
                  right.includes(i) ? "text-right" : "text-left"
                }`}
                style={{ color: "var(--text-faint)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <tr className={`group transition-all duration-150 hover:bg-slate-100 dark:hover:bg-white/[0.04] ${className}`} style={{ borderColor: "var(--border)" }}>
      {children}
    </tr>
  );
}

export function Td({
  children,
  right = false,
  strong = false,
  muted = false,
  className = "",
}: {
  children: ReactNode;
  right?: boolean;
  strong?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-4 whitespace-nowrap transition-colors ${right ? "text-right tabular-nums font-mono font-bold" : ""} ${strong ? "font-extrabold text-sm text-text-heading" : "font-medium text-xs"} ${className}`}
      style={{ color: muted ? "var(--text-muted)" : "var(--text)" }}
    >
      {children}
    </td>
  );
}
