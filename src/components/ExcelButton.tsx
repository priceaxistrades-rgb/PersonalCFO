"use client";

import { useState } from "react";
import { IconReports } from "@/components/ui/Icons";

export function ExcelButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/export/excel");
      if (!res.ok) {
        let msg = `Export failed (HTTP ${res.status})`;
        try {
          const data = await res.json();
          msg = data.error || msg;
        } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      if (blob.size < 500) throw new Error("File too small — export may have failed");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PersonalCFO-Summary-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
    setBusy(false);
  };

  return (
    <div className="relative">
      <button
        onClick={download}
        disabled={busy}
        className={`no-print inline-flex items-center justify-center gap-2 rounded-xl font-bold text-white transition-all shadow-md ${
          busy ? "opacity-70 cursor-wait" : "hover:bg-indigo-600 hover:-translate-y-0.5"
        } ${compact ? "px-3.5 py-2 text-xs" : "px-4 py-2.5 text-xs"}`}
        style={{ background: busy ? "var(--surface-4)" : "var(--primary)", minHeight: 40 }}
        title="Download full household financial summary as multi-sheet Excel workbook (.xlsx)"
      >
        {busy ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
            <span>Exporting…</span>
          </>
        ) : (
          <>
            <IconReports size={15} className="shrink-0" />
            <span className="tracking-tight font-mono">Export Workbook (.xlsx)</span>
          </>
        )}
      </button>
      {error && (
        <div
          className="absolute top-full mt-2 right-0 text-xs px-3 py-2 rounded-xl max-w-xs z-50 shadow-xl border border-red-500/40 bg-red-500/10 text-red-400 font-bold animate-fade-in"
        >
          {error}
        </div>
      )}
    </div>
  );
}
