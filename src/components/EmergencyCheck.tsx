"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EmergencyCheck({
  id,
  done,
  label,
  detail,
}: {
  id: number;
  done: boolean;
  label: string;
  detail?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    await fetch("/api/emergency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done: !done }),
    });
    setBusy(false);
    router.refresh();
  };
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors"
      style={{ background: "var(--surface-2)" }}
    >
      <span
        className="w-5 h-5 rounded-md border grid place-items-center shrink-0 mt-0.5 text-[11px] text-white"
        style={{
          background: done ? "var(--success)" : "transparent",
          borderColor: done ? "var(--success)" : "var(--border)",
        }}
      >
        {done && "✓"}
      </span>
      <span className="min-w-0">
        <span
          className="text-sm font-medium block"
          style={{ color: "var(--text)", textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}
        >
          {label}
        </span>
        {detail && (
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            {detail}
          </span>
        )}
      </span>
    </button>
  );
}
