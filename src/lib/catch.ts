/**
 * ═══════════════════════════════════════════════════════════════
 * API ERROR CATCH HELPER — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Drop-in replacement for bare `catch` blocks in API routes.
 * Logs the error and returns a structured response.
 *
 * Before:   } catch { return Response.json({ error: "Server error" }, { status: 500 }); }
 * After:    } catch (err) { return catchErr("accounts GET", err, session.userId); }
 * ═══════════════════════════════════════════════════════════════
 */

import { logger } from "./logger";
import { generateRequestId } from "./logger";

export function catchErr(route: string, err: unknown, userId?: number): Response {
  const requestId = generateRequestId();
  logger.error(`API error in ${route}`, err, { userId, requestId });
  return Response.json(
    { ok: false, error: "Server error", requestId },
    { status: 500, headers: { "X-Request-Id": requestId } },
  );
}
