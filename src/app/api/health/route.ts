import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supplied = req.headers.get("authorization");
  const expected = process.env.HEALTHCHECK_SECRET;
  const detailed = Boolean(expected && supplied === `Bearer ${expected}`);
  const start = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string }> = {};

  // ─── Database connectivity ───
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = { ok: false, detail: "Database unreachable" };
    logger.error("Health check: database unreachable", err);
  }

  // ─── Environment config ───
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET) && process.env.AUTH_SECRET !== "dev-only-change-me-personal-cfo-secret";
  checks.config = {
    ok: hasDbUrl && hasAuthSecret,
    detail: [
      !hasDbUrl && "DATABASE_URL missing",
      !hasAuthSecret && "AUTH_SECRET missing/insecure",
    ].filter(Boolean).join("; ") || "All required env vars set",
  };

  // ─── Memory usage ───
  const mem = process.memoryUsage();
  checks.memory = {
    ok: mem.heapUsed < 500 * 1024 * 1024, // Alert if > 500MB heap
    detail: `heap: ${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(mem.heapTotal / 1024 / 1024).toFixed(1)}MB`,
  };

  // ─── Version ───
  checks.version = { ok: true, detail: "5.5.0 (Production Hardened)" };

  const allOk = Object.values(checks).every((c) => c.ok);
  const totalLatency = Date.now() - start;

  // Public callers receive no infrastructure/configuration reconnaissance.
  if (!detailed) return Response.json({ ok: allOk, status: allOk ? "healthy" : "degraded" }, { status: allOk ? 200 : 503 });
  return Response.json({ ok: allOk, status: allOk ? "healthy" : "degraded", uptime: process.uptime(), latencyMs: totalLatency, checks, timestamp: new Date().toISOString() }, { status: allOk ? 200 : 503 });
}
