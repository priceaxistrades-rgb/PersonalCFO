"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { inr } from "@/lib/format";

type Account = { id: number; name: string; type: string; balance: string };
type Transfer = {
  id: number; fromAccountId: number; toAccountId: number; amount: string;
  transferDate: string; note: string | null; createdAt: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export function TransfersClient({ accounts: initialAccounts }: { accounts: Account[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [rows, setRows] = useState<Transfer[]>([]);
  const [fromAccountId, setFromAccountId] = useState(initialAccounts[0]?.id || 0);
  const [toAccountId, setToAccountId] = useState(initialAccounts[1]?.id || 0);
  const [amount, setAmount] = useState("");
  const [transferDate, setTransferDate] = useState(today());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const accountMap = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const source = accountMap.get(fromAccountId);
  const destinationOptions = accounts.filter((account) => account.id !== fromAccountId);

  useEffect(() => {
    if (toAccountId === fromAccountId || !accountMap.has(toAccountId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToAccountId(destinationOptions[0]?.id || 0);
    }
  }, [accountMap, destinationOptions, fromAccountId, toAccountId]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/transfers", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) setRows(payload.data?.rows || []);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory();
  }, [loadHistory]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const numericAmount = Number(amount);
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      setMessage({ tone: "danger", text: "Choose two different accounts." }); return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage({ tone: "danger", text: "Enter a valid positive amount." }); return;
    }
    if (source && numericAmount > Number(source.balance)) {
      setMessage({ tone: "danger", text: "The source account does not have enough balance." }); return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromAccountId, toAccountId, amount, transferDate, note: note.trim() || null }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Transfer failed");

      setAccounts((current) => current.map((account) => {
        if (account.id === fromAccountId) return { ...account, balance: (Number(account.balance) - numericAmount).toFixed(2) };
        if (account.id === toAccountId) return { ...account, balance: (Number(account.balance) + numericAmount).toFixed(2) };
        return account;
      }));
      setAmount(""); setNote("");
      setMessage({ tone: "success", text: "Transfer completed. Income and expense totals were not changed." });
      await loadHistory();
    } catch (error) {
      setMessage({ tone: "danger", text: error instanceof Error ? error.message : "Transfer failed" });
    } finally { setLoading(false); }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card title="Move money" subtitle="Both account balances update together in one secure transaction.">
        {accounts.length < 2 ? (
          <div className="rounded-2xl border p-5 text-sm" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
            Add at least two accounts in Settings before creating a transfer.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block"><span className="transfer-label">From account</span>
              <select className="input" value={fromAccountId} onChange={(e) => setFromAccountId(Number(e.target.value))}>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {inr(Number(account.balance))}</option>)}
              </select>
            </label>
            <label className="block"><span className="transfer-label">To account</span>
              <select className="input" value={toAccountId} onChange={(e) => setToAccountId(Number(e.target.value))}>
                {destinationOptions.map((account) => <option key={account.id} value={account.id}>{account.name} · {inr(Number(account.balance))}</option>)}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="transfer-label">Amount (₹)</span><input className="input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
              <label><span className="transfer-label">Transfer date</span><input className="input" type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required /></label>
            </div>
            <label className="block"><span className="transfer-label">Note (optional)</span><input className="input" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Purpose of this transfer" /></label>
            {message && <p role="status" className="rounded-xl border p-3 text-xs font-bold" style={{ background: message.tone === "success" ? "var(--success-soft)" : "var(--danger-soft)", color: message.tone === "success" ? "var(--success)" : "var(--danger)" }}>{message.text}</p>}
            <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Transferring…" : "Transfer securely →"}</button>
          </form>
        )}
      </Card>

      <Card title="Transfer history" subtitle="Internal movements are intentionally excluded from income and expense reporting.">
        {historyLoading ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading transfers…</p> : rows.length === 0 ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>No transfers recorded yet.</p> : (
          <div className="space-y-2">
            {rows.map((row) => <div key={row.id} className="transfer-row">
              <div className="min-w-0"><p>{accountMap.get(row.fromAccountId)?.name || "Account"} → {accountMap.get(row.toAccountId)?.name || "Account"}</p><span>{new Date(`${row.transferDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{row.note ? ` · ${row.note}` : ""}</span></div>
              <strong>{inr(Number(row.amount))}</strong>
            </div>)}
          </div>
        )}
      </Card>
    </div>
  );
}
