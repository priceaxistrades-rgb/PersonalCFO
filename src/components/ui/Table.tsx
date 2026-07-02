import { ReactNode } from "react";

export function Table({
  headers,
  children,
  right = [],
}: {
  headers: string[];
  children: ReactNode;
  right?: number[]; // indices right-aligned
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`text-[11px] font-semibold uppercase tracking-wide pb-2 px-2 ${
                  right.includes(i) ? "text-right" : "text-left"
                }`}
                style={{ color: "var(--text-faint)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return (
    <tr className="border-t" style={{ borderColor: "var(--border)" }}>
      {children}
    </tr>
  );
}

export function Td({
  children,
  right = false,
  strong = false,
  muted = false,
}: {
  children: ReactNode;
  right?: boolean;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      className={`py-2.5 px-2 ${right ? "text-right tabular-nums" : ""} ${
        strong ? "font-semibold" : ""
      }`}
      style={{ color: muted ? "var(--text-muted)" : "var(--text)" }}
    >
      {children}
    </td>
  );
}
