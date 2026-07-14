import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

const databaseUrl = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";

/**
 * pg v8 currently accepts `prefer`, `require`, and `verify-ca` as aliases for
 * `verify-full`, but emits a warning because that behavior changes in a future
 * major release. Normalize the aliases before pg parses the URL so the intent
 * is explicit and the warning is eliminated without weakening TLS.
 */
function normalizeConnectionString(url: string): string {
  return url.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)(?=(&|$))/i,
    "$1verify-full",
  );
}

const connectionString = normalizeConnectionString(databaseUrl);

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  console.warn("⚠️ DATABASE_URL is not set. Using dummy connection for static evaluation.");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

/**
 * SSL configuration strategy:
 *
 * - If the connection string already has sslmode=, we respect it.
 * - For Neon and other cloud hosts, certificate validation is enabled by default.
 * - For local dev (localhost), SSL is disabled entirely.
 * - An explicit `sslmode=no-verify` is supported only for controlled local or
 *   migration scenarios; production should use `verify-full` or the provider's
 *   normal `require` mode with the platform CA bundle.
 *
 * Do not disable certificate verification as a convenience: this connection
 * carries passwords, financial records, and session-related data.
 */
function resolveSslConfig(): PoolConfig["ssl"] {
  const url = databaseUrl;
  const isLocal = /(?:^|[@/])(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(url);
  if (isLocal) return false;

  const sslModeMatch = url.match(/(?:^|[?&])sslmode=([^&]+)/i);
  const mode = sslModeMatch?.[1].toLowerCase();

  if (mode === "disable") return false;
  if (mode === "no-verify") return { rejectUnauthorized: false };

  // `require`, `prefer`, `verify-ca`, `verify-full`, and an omitted sslmode
  // all use the system CA store. This preserves server certificate validation.
  return { rejectUnauthorized: true };
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
  connectionString,
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
