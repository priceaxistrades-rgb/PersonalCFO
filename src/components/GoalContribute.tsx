"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GoalContribute({ id }: { id: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!amount) return;
    setBusy(true);
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, amount: Number(amount) }),
    });
    setBusy(false);
    setAmount("");
    setOpen(false);
    router.refresh();
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold no-print px-2.5 py-1 rounded-lg"
        style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
      >
        + Contribute
      </button>
    );

  return (
    <div className="flex items-center gap-1.5 no-print">
      <input
        type="number"
        autoFocus
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="₹"
        className="w-20 px-2 py-1 rounded-lg text-xs outline-none border"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
      />
      <button
        onClick={add}
        disabled={busy}
        className="text-xs font-semibold px-2 py-1 rounded-lg text-white"
        style={{ background: "var(--success)" }}
      >
        ✓
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-xs px-2 py-1 rounded-lg"
        style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
      >
        ✕
      </button>
    </div>
  );
}
