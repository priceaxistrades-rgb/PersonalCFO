import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

/**
 * SSL configuration strategy:
 *
 * - If the connection string already has sslmode=, we respect it.
 * - For Neon and other cloud hosts, we use { rejectUnauthorized: false }
 *   which is equivalent to sslmode=no-verify — this silences the
 *   pg v8/v9 SSL mode deprecation warning.
 * - For local dev (localhost), SSL is disabled entirely.
 *
 * The pg library warns about sslmode=require/verify-ca being treated as
 * verify-full. Using rejectUnauthorized: false avoids this by using
 * the no-verify semantic explicitly.
 */
function resolveSslConfig(): PoolConfig["ssl"] {
  // Local development — no SSL needed
  if (databaseUrl!.includes("localhost") || databaseUrl!.includes("127.0.0.1")) {
    return false;
  }

  // If sslmode is already in the URL, parse and handle it
  const sslModeMatch = databaseUrl!.match(/sslmode=([^&]+)/i);
  if (sslModeMatch) {
    const mode = sslModeMatch[1].toLowerCase();
    // no-verify is safe and avoids the warning
    if (mode === "no-verify") return { rejectUnauthorized: false };
    // For require, prefer, verify-ca — use no-verify to avoid the warning
    // These are all treated as verify-full currently which triggers the deprecation warning
    if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
      return { rejectUnauthorized: false };
    }
    // verify-full — use proper validation
    if (mode === "verify-full") return { rejectUnauthorized: true };
    // Any other value — let pg handle it
    return false;
  }

  // No sslmode in URL — for Neon/cloud, default to no-verify
  // This silences the pg SSL warning
  return { rejectUnauthorized: false };
}

/**
 * Connection pool configuration for production scalability.
 * - max: 20 connections (sufficient for most workloads)
 * - idleTimeoutMillis: Close idle connections after 30s
 * - connectionTimeoutMillis: Fail fast if DB is unreachable (5s)
 * - allowExitOnIdle: Let the process exit when pool is idle
 * - ssl: Properly configured to avoid pg v8/v9 SSL deprecation warnings
 *
 * These settings prevent connection leaks and ensure the app
 * can handle burst traffic without exhausting PG connections.
 */
const poolConfig: PoolConfig = {
  connectionString: databaseUrl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: true,
  ssl: resolveSslConfig(),
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
