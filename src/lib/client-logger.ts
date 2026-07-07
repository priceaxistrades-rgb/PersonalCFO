/**
 * ═══════════════════════════════════════════════════════════════
 * CLIENT ERROR LOGGER — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Captures client-side errors and sends them to a logging endpoint.
 * Also integrates with the global error handler for unhandled errors.
 * ═══════════════════════════════════════════════════════════════
 */

type ClientLogEntry = {
  level: "error" | "warn" | "info";
  message: string;
  stack?: string;
  component?: string;
  url?: string;
  timestamp: string;
  userAgent?: string;
};

/** Queue for batching error reports */
let queue: ClientLogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  flushTimer = null;

  // Fire-and-forget POST to server
  fetch("/api/client-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logs: batch }),
  }).catch(() => {
    // If logging fails, silently drop — never infinite loop
  });
}

function scheduleFlush() {
  if (!flushTimer) {
    flushTimer = setTimeout(flush, 2000); // Batch every 2s
  }
}

/** Log a client-side error */
export function logClientError(message: string, opts?: { stack?: string; component?: string }) {
  const entry: ClientLogEntry = {
    level: "error",
    message,
    stack: opts?.stack,
    component: opts?.component,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };
  queue.push(entry);
  scheduleFlush();

  // Also log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error(`[ClientError] ${message}`, opts);
  }
}

/** Log a client-side warning */
export function logClientWarn(message: string, opts?: { component?: string }) {
  const entry: ClientLogEntry = {
    level: "warn",
    message,
    component: opts?.component,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
  };
  queue.push(entry);
  scheduleFlush();
}

/** Install global error handlers (call once at app init) */
export function installGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    logClientError(event.message, {
      stack: event.error?.stack,
      component: "global:error",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const err = event.reason;
    logClientError(
      err?.message || "Unhandled promise rejection",
      {
        stack: err?.stack,
        component: "global:unhandledrejection",
      }
    );
  });
}
