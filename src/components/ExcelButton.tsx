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
        className={`no-print inline-flex items-center gap-2 rounded-lg font-semibold text-white transition-all ${
          busy ? "opacity-70 cursor-wait" : "hover:opacity-90 hover:-translate-y-0.5"
        } ${compact ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"}`}
        style={{ background: busy ? "var(--text-faint)" : "var(--primary)" }}
        title="Download full financial summary as Excel workbook"
      >
        {busy ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Building…
          </>
        ) : (
          <>📥 Export Excel</>
        )}
      </button>
      {error && (
        <div
          className="absolute top-full mt-2 right-0 text-xs px-3 py-2 rounded-lg max-w-xs z-50"
          style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
