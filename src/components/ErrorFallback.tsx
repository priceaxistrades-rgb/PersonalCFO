"use client";

import { useEffect } from "react";

type ErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
};

export function ErrorFallback({ error, reset, title }: ErrorFallbackProps) {
  useEffect(() => {
    console.error(`[ErrorBoundary${title ? `: ${title}` : ""}]`, error);
  }, [error, title]);

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      style={{ minHeight: "300px" }}
    >
      <div
        className="inline-flex w-16 h-16 rounded-2xl grid place-items-center text-3xl mb-4 shadow-lg"
        style={{ background: "var(--danger-soft)" }}
      >
        ⚠️
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: "var(--danger)" }}>
        {title || "Something went wrong"}
      </h2>
      <p className="text-sm mb-1 max-w-md" style={{ color: "var(--text-muted)" }}>
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      {error.digest && (
        <p className="text-[10px] mb-4" style={{ color: "var(--text-faint)" }}>
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="btn btn-primary px-6 mt-2"
        style={{ minHeight: "44px" }}
      >
        🔄 Try Again
      </button>
    </div>
  );
}
