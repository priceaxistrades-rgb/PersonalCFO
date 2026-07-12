"use client";

import { IconReports } from "@/components/ui/Icons";

export function PrintButton({ label = "Print Report" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors hover:bg-white/[0.06] border border-white/[0.06]"
      style={{ background: "var(--surface-2)", color: "var(--text)" }}
    >
      <IconReports size={14} className="text-slate-400" />
      <span>{label}</span>
    </button>
  );
}
