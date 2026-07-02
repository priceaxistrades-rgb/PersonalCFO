"use client";

export function PrintButton({ label = "Print / PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
      style={{ background: "var(--surface-3)", color: "var(--text)" }}
    >
      🖨️ {label}
    </button>
  );
}
