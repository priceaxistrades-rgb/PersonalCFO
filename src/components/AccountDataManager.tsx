"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountDataManager() {
  const router = useRouter();
  const [phrase, setPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetData = async () => {
    setMessage("");
    setError("");
    if (phrase !== "RESET MY DATA") {
      setError('Type "RESET MY DATA" to confirm.');
      return;
    }
    if (!confirm("This will delete your financial records but keep your login account. Continue?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/account/reset-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: phrase }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not reset data.");
        return;
      }
      setPhrase("");
      setMessage("Your financial data has been reset.");
      router.refresh();
    } catch {
      setError("Network error while resetting data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Export your workbook before deleting data. Reset removes your financial records for this account but keeps your login.
        </p>
        {message && <div className="rounded-lg p-3 text-sm" style={{ background: "var(--success-soft)", color: "var(--success)" }}>{message}</div>}
        {error && <div className="rounded-lg p-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>}
      </div>

      <div className="pt-6 border-t" style={{ borderColor: "var(--border)" }}>
        <p className="text-[10px] font-bold uppercase opacity-50 mb-3">Danger Zone</p>
        <div className="grid sm:grid-cols-[1fr_auto] gap-2">
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder='Type RESET MY DATA'
            className="px-3 py-2 rounded-lg text-sm border"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}
          />
          <button
            onClick={resetData}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--danger)", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Resetting..." : "Reset my data"}
          </button>
        </div>
      </div>
    </div>
  );
}
