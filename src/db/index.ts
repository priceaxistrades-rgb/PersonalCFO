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
 * Connection pool configuration for production scalability.
 * - max: 20 connections (sufficient for most workloads)
 * - idleTimeoutMillis: Close idle connections after 30s
 * - connectionTimeoutMillis: Fail fast if DB is unreachable (5s)
 * - allowExitOnIdle: Let the process exit when pool is idle
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
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
