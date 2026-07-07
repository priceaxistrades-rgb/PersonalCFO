/**
 * ═══════════════════════════════════════════════════════════════
 * API UTILITIES — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Shared utilities for API route handlers:
 *   - Structured error responses with request IDs
 *   - Pagination helpers
 *   - Request logging wrapper
 *   - Security headers
 * ═══════════════════════════════════════════════════════════════
 */

import { routeLogger, generateRequestId } from "./logger";
import type { PaginatedResponse } from "./types";

// ─── Error Response Builder ────────────────────────────────────

/**
 * Build a structured API error response with a unique request ID
 * for debugging. Every error is logged server-side.
 */
export function apiError(
  message: string,
  status: number = 500,
  details?: Record<string, string>,
  error?: unknown,
): Response {
  const requestId = generateRequestId();
  const log = routeLogger("api-error", requestId);

  if (status >= 500) {
    log.error(message, error, { status, details });
  } else {
    log.warn(message, { status, details });
  }

  return Response.json(
    {
      ok: false,
      error: message,
      details,
      requestId,
    },
    {
      status,
      headers: { "X-Request-Id": requestId },
    },
  );
}

/**
 * Build a structured API success response with request ID.
 */
export function apiSuccess<T>(data?: T, meta?: Record<string, unknown>): Response {
  const requestId = generateRequestId();
  return Response.json(
    {
      ok: true,
      ...(data !== undefined ? { data } : {}),
      ...meta,
      requestId,
    },
    {
      headers: { "X-Request-Id": requestId },
    },
  );
}

// ─── Pagination ────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export interface PaginationInput {
  page?: string | number | null;
  limit?: string | number | null;
}

export function parsePagination(input: PaginationInput) {
  const page = Math.max(1, Number(input.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(input.limit) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function paginatedResponse<T>(
  rows: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}

// ─── Request Handler Wrapper ───────────────────────────────────

type HandlerFn = (req: Request, ctx: { requestId: string; log: ReturnType<typeof routeLogger> }) => Promise<Response>;

/**
 * Wrap an API route handler with logging, request ID, and error boundary.
 *
 * Usage:
 * ```ts
 * export const GET = apiHandler(async (req, { log, requestId }) => {
 *   log.info("Fetching transactions");
 *   const data = await getTransactions();
 *   return apiSuccess(data);
 * });
 * ```
 */
export function apiHandler(handler: HandlerFn) {
  return async (req: Request): Promise<Response> => {
    const requestId = generateRequestId();
    const url = new URL(req.url);
    const log = routeLogger(url.pathname, requestId);

    log.info(`${req.method} ${url.pathname}`, {
      method: req.method,
      path: url.pathname,
      search: url.search,
    });

    const startTime = Date.now();
    try {
      const response = await handler(req, { requestId, log });
      const duration = Date.now() - startTime;
      log.info(`${req.method} ${url.pathname} → ${response.status}`, {
        status: response.status,
        duration,
      });
      // Add request ID and security headers to every response
      response.headers.set("X-Request-Id", requestId);
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      return response;
    } catch (err) {
      const duration = Date.now() - startTime;
      log.error(`Unhandled error in ${req.method} ${url.pathname}`, err, { duration });
      return apiError("Internal server error", 500, undefined, err);
    }
  };
}

// ─── Security Headers ──────────────────────────────────────────

/**
 * CSP header value — strict but allows inline styles (needed for CSS variables)
 * and the app's own scripts.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://api.mfapi.in https://query1.finance.yahoo.com",
  "frame-ancestors 'none'",
].join("; ");
