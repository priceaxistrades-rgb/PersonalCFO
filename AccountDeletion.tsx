"use client";

import { useState } from "react";

export function AccountDeletion() {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      setError("Please type exactly: DELETE MY ACCOUNT");
      return;
    }

    if (!confirm("This will permanently delete ALL your financial data. Are you absolutely sure?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete account");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
        <p className="font-bold">Account deleted successfully.</p>
        <p className="text-sm mt-1">You will be redirected to login shortly...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          Type <span className="font-mono text-red-400">DELETE MY ACCOUNT</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="input w-full border-red-500/30 focus:border-red-500"
          placeholder="DELETE MY ACCOUNT"
          disabled={loading}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleDelete}
        disabled={loading || confirmText !== "DELETE MY ACCOUNT"}
        className="btn bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl disabled:opacity-50 w-full"
      >
        {loading ? "Deleting Account..." : "Permanently Delete My Account & All Data"}
      </button>

      <p className="text-xs text-slate-400">
        This action is irreversible. All transactions, investments, goals, and personal data will be permanently removed.
      </p>
    </div>
  );
}
