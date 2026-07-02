"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BillToggle({ id, paid }: { id: number; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    await fetch("/api/bills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, paid: !paid }),
    });
    setBusy(false);
    router.refresh();
  };
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="px-2.5 py-1 rounded-full text-[11px] font-semibold no-print"
      style={{
        background: paid ? "var(--success-soft)" : "var(--warning-soft)",
        color: paid ? "var(--success)" : "var(--warning)",
      }}
    >
      {paid ? "✓ Paid" : "Mark paid"}
    </button>
  );
}
