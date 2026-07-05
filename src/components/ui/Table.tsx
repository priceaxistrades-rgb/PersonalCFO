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
    <div className="table-scroll overflow-x-auto -mx-2 px-2 rounded-xl">
      <table className="w-full min-w-[720px] text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`text-[11px] font-semibold uppercase tracking-wide pb-2 px-2 whitespace-nowrap ${
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
    <tr className="border-t align-middle table-row-hover transition-colors duration-150" style={{ borderColor: "var(--border)" }}>
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
      className={`py-2.5 px-2 whitespace-nowrap ${right ? "text-right tabular-nums" : ""} ${strong ? "font-semibold" : ""}`}
      style={{ color: muted ? "var(--text-muted)" : "var(--text)" }}
    >
      {children}
    </td>
  );
}
