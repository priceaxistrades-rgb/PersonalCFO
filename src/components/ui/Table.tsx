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
    <div className="table-scroll -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-3 py-3 whitespace-nowrap ${
                  right.includes(i) ? "text-right" : "text-left"
                }`}
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
  return <tr>{children}</tr>;
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
      className={`px-3 py-3 whitespace-nowrap ${right ? "text-right tabular-nums" : ""} ${strong ? "font-semibold" : ""}`}
      style={{ color: muted ? "var(--text-muted)" : "var(--text)" }}
    >
      {children}
    </td>
  );
}
