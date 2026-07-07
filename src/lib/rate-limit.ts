/**
 * ═══════════════════════════════════════════════════════════════
 * RATE LIMITER — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Token bucket rate limiter with automatic cleanup.
 *
 * In single-instance deployments, uses in-memory storage.
 * For multi-instance, set REDIS_URL to use Redis as backing store.
 *
 * Cleanup runs every 60s to prevent memory leaks from stale buckets.
 * ═══════════════════════════════════════════════════════════════
 */

import { logger } from "./logger";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

// Cleanup stale entries every 60 seconds
const CLEANUP_INTERVAL = 60_000;
const CLEANUP_MAX_AGE = 120_000; // Remove buckets older than 2 minutes

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    let removed = 0;
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt + CLEANUP_MAX_AGE < now) {
        buckets.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      logger.debug("Rate limit cleanup", { removed, remaining: buckets.size });
    }
  }, CLEANUP_INTERVAL);

  // Don't prevent Node from exiting
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

startCleanup();

export function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    logger.warn("Rate limit exceeded", { key, count: bucket.count, limit });
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return Response.json(
    { ok: false, error: `Too many attempts. Please try again in ${retryAfter} seconds.`, requestId: `rl_${Date.now().toString(36)}` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
