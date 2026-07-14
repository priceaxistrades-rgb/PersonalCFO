/**
 * Rate limiting with an optional distributed Upstash Redis backend.
 *
 * Local development and single-process deployments use the in-memory fallback.
 * Production deployments with multiple instances should configure:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * The in-memory fallback is intentionally retained for local development and
 * degraded operation, but health/deployment checks should alert when Redis is
 * not configured for a horizontally scaled deployment.
 */

import { logger } from "./logger";

type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const CLEANUP_INTERVAL = 60_000;
const CLEANUP_MAX_AGE = 120_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt + CLEANUP_MAX_AGE < now) buckets.delete(key);
    }
  }, CLEANUP_INTERVAL);

  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

startCleanup();

function rateLimitMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (bucket.count >= limit) {
    logger.warn("Rate limit exceeded", { key, count: bucket.count, limit });
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { ok: true, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function rateLimitRedis(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const config = redisConfig();
  if (!config) return rateLimitMemory(key, limit, windowMs);

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, windowSeconds],
    ]),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Rate-limit store returned HTTP ${response.status}`);
  const results = (await response.json()) as Array<{ result?: number }>;
  const count = Number(results[0]?.result);
  if (!Number.isFinite(count)) throw new Error("Rate-limit store returned an invalid counter");

  const resetAt = Date.now() + windowMs;
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

/** Prefer distributed limiting when configured, with a safe local fallback. */
export async function rateLimitAsync(key: string, limit = 10, windowMs = 60_000): Promise<RateLimitResult> {
  if (!redisConfig()) return rateLimitMemory(key, limit, windowMs);

  try {
    return await rateLimitRedis(key, limit, windowMs);
  } catch (error) {
    // Availability is preferable to taking authentication down if Redis is
    // temporarily unavailable. The warning is observable in production logs.
    logger.error("Distributed rate limiter unavailable; using local fallback", error);
    return rateLimitMemory(key, limit, windowMs);
  }
}

/** Synchronous compatibility helper for non-critical local callers. */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  return rateLimitMemory(key, limit, windowMs);
}

export function getClientIp(req: Request) {
  // Prefer the single-value header set by common managed proxies. X-Forwarded-For
  // is only trustworthy when the edge proxy strips client-supplied values.
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return Response.json(
    {
      ok: false,
      error: `Too many attempts. Please try again in ${retryAfter} seconds.`,
      requestId: `rl_${Date.now().toString(36)}`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
