/**
 * ═══════════════════════════════════════════════════════════════
 * STRUCTURED LOGGING — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Provides leveled, structured logging for all API routes and
 * server-side code. In production, logs are JSON for machine parsing.
 * In development, logs are human-readable with colors.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("Transaction created", { userId, txnId });
 *   logger.error("DB query failed", err, { route: "/api/transactions" });
 *   logger.warn("Rate limit approached", { ip, remaining });
 * ═══════════════════════════════════════════════════════════════
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const shouldLog = (level: LogLevel) =>
  LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
  error?: unknown,
): string {
  const ts = formatTimestamp();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;

  if (process.env.NODE_ENV === "production") {
    // JSON format for production (machine-parseable)
    const entry: Record<string, unknown> = {
      timestamp: ts,
      level,
      message,
      ...meta,
    };
    if (error instanceof Error) {
      entry.error = error.message;
      entry.stack = error.stack;
    } else if (error) {
      entry.error = String(error);
    }
    return JSON.stringify(entry);
  }

  // Human-readable format for development
  const colors: Record<LogLevel, string> = {
    debug: "\x1b[36m", // cyan
    info: "\x1b[32m",  // green
    warn: "\x1b[33m",  // yellow
    error: "\x1b[31m", // red
    fatal: "\x1b[35m", // magenta
  };
  const reset = "\x1b[0m";
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  const errStr = error instanceof Error ? `\n  ${error.stack || error.message}` : error ? `\n  ${String(error)}` : "";
  return `${prefix} ${colors[level]}${message}${reset}${metaStr}${errStr}`;
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("debug")) console.debug(formatMessage("debug", message, meta));
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("info")) console.info(formatMessage("info", message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("warn")) console.warn(formatMessage("warn", message, meta));
  },
  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    if (shouldLog("error")) console.error(formatMessage("error", message, meta, error));
  },
  fatal(message: string, error?: unknown, meta?: Record<string, unknown>) {
    if (shouldLog("fatal")) console.error(formatMessage("fatal", message, meta, error));
  },
};

/**
 * Generate a unique request ID for tracing.
 * Attach to every API route's response header.
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a scoped logger for a specific API route.
 * Automatically includes requestId and route in every log entry.
 */
export function routeLogger(route: string, requestId: string) {
  const baseMeta = { route, requestId };
  return {
    debug(message: string, meta?: Record<string, unknown>) {
      logger.debug(message, { ...baseMeta, ...meta });
    },
    info(message: string, meta?: Record<string, unknown>) {
      logger.info(message, { ...baseMeta, ...meta });
    },
    warn(message: string, meta?: Record<string, unknown>) {
      logger.warn(message, { ...baseMeta, ...meta });
    },
    error(message: string, error?: unknown, meta?: Record<string, unknown>) {
      logger.error(message, error, { ...baseMeta, ...meta });
    },
  };
}
