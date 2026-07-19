import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireApiSession, isSession } from "@/lib/server-auth";
import { apiHandler, apiError, apiSuccess } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { writeAuditLog } from "@/lib/audit";
import { clearSessionCookieHeader } from "@/lib/server-auth";

export const POST = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const raw = await req.json();
    
    // Require explicit confirmation phrase for safety
    if (raw.confirm !== "DELETE MY ACCOUNT") {
      return apiError("Confirmation phrase required: DELETE MY ACCOUNT", 400);
    }

    const userId = session.userId;

    logger.warn("Account deletion requested", { userId, email: session.email });

    // Delete user (cascades to all related tables via schema)
    await db.delete(users).where(eq(users.id, userId));

    writeAuditLog({
      userId,
      action: "delete",
      table: "users",
      recordId: userId,
      changes: { action: "account_deletion" },
    });

    // Clear session
    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: "Account and all associated data have been permanently deleted." 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": clearSessionCookieHeader(req),
        },
      }
    );
  } catch (err) {
    log.error("Account deletion failed", err);
    return apiError("Failed to delete account", 500);
  }
});
