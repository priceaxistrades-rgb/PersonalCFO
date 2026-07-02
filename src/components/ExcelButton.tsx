"use client";

import { useState } from "react";

export function ExcelButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/export/excel");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      if (blob.size < 1000) throw new Error("File too small - possible error");
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Personal-CFO-Planner-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
      console.error("Excel export error:", e);
    }
    setBusy(false);
  };

  return (
    <div className="relative">
      <button
        onClick={download}
        disabled={busy}
        className={`no-print inline-flex items-center gap-2 rounded-lg font-semibold text-white transition-all ${
          busy ? "opacity-70 cursor-wait" : "hover:opacity-90"
        } ${compact ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"}`}
        style={{ background: busy ? "var(--text-faint)" : "var(--success)" }}
        title="Download full workbook with all sheets and formulas"
      >
        {busy ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Building…
          </>
        ) : (
          <>
            ⬇️ Export to Excel
          </>
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-2 right-0 text-xs text-red-600 bg-red-50 px-2 py-1 rounded whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
}
