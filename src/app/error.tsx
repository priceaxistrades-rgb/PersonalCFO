"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Keep the production UI safe while retaining the digest for server logs.
    console.error("Application render failure", { digest: error.digest });
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16 pb-[calc(7rem+env(safe-area-inset-bottom))]" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <section className="w-full max-w-md text-center rounded-3xl border p-7 sm:p-9 shadow-2xl" style={{ background: "var(--surface)", borderColor: "var(--border)" }} role="alert">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl grid place-items-center text-3xl" style={{ background: "var(--danger-soft)", color: "var(--danger)" }} aria-hidden="true">
          ⚠️
        </div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-heading)" }}>
          Financial workspace unavailable
        </h1>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
          The navigation is available, but the dashboard data could not be loaded. Check the database connection and confirm that the latest schema has been applied.
        </p>
        <div className="mt-5 rounded-2xl border p-4 text-left text-xs leading-5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
          <p className="font-bold" style={{ color: "var(--text-heading)" }}>Operator checklist</p>
          <ol className="mt-2 list-decimal pl-4 space-y-1" style={{ color: "var(--text-muted)" }}>
            <li>Confirm <code>DATABASE_URL</code> is configured.</li>
            <li>Run <code>npm run db:push</code> from a trusted deployment environment.</li>
            <li>Check <code>/api/health</code>, then redeploy.</li>
          </ol>
        </div>
        <button type="button" onClick={() => reset()} className="btn btn-primary mt-6 w-full py-3 font-bold">
          Try Again
        </button>
      </section>
    </main>
  );
}
