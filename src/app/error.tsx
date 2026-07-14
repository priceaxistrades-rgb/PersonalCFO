"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 p-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl grid place-items-center text-3xl"
        style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
      >
        ⚠️
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Something went wrong
        </h2>
        <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
          {error.message || "An unexpected error occurred. This may be a temporary database connectivity issue."}
        </p>
      </div>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
        style={{ background: "var(--primary)", color: "#fff" }}
      >
        Try Again
      </button>
    </div>
  );
}
