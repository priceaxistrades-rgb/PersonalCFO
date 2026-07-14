import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { eq, and, gt, isNull, or } from "drizzle-orm";
import { validate, resetPasswordSchema } from "@/lib/validation";
import { catchErr } from "@/lib/catch";
import { logger } from "@/lib/logger";
import { hashPassword } from "@/lib/auth";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { clearSessionCookieHeader } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const result = validate(resetPasswordSchema, raw);
    if (!result.ok) return result.error;
    const { token, password } = result.data;
    const tokenDigest = hashPasswordResetToken(token);

    // New tokens are stored as digests. The raw-token branch is retained for
    // the short transition window so tokens issued by the previous release do
    // not fail unexpectedly.
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(and(
        or(
          eq(passwordResetTokens.token, tokenDigest),
          eq(passwordResetTokens.token, token),
        ),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ))
      .limit(1);

    if (!resetToken) {
      return Response.json(
        { ok: false, error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Verify user still exists
    const [user] = await db.select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, resetToken.userId))
      .limit(1);

    if (!user) {
      return Response.json(
        { ok: false, error: "User account not found." },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(password);
    const now = new Date();

    // Claim the token and update the password atomically. A conditional update
    // prevents two concurrent requests from replaying the same reset token.
    await db.transaction(async (tx) => {
      const [claimed] = await tx.update(passwordResetTokens)
        .set({ usedAt: now })
        .where(and(
          eq(passwordResetTokens.id, resetToken.id),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now),
        ))
        .returning({ id: passwordResetTokens.id });

      if (!claimed) throw new Error("Reset token was already used or expired");

      await tx.update(users)
        .set({ password: hashedPassword, updatedAt: now })
        .where(eq(users.id, user.id));

      // Remove all remaining reset tokens for this account.
      await tx.delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id));
    });

    logger.info("Password reset successful", { userId: user.id });

    return Response.json(
      {
        ok: true,
        message: "Password has been reset successfully. You can now sign in with your new password.",
      },
      { headers: { "Set-Cookie": clearSessionCookieHeader(req) } },
    );
  } catch (err) {
    catchErr("reset-password POST", err);
    return Response.json(
      { ok: false, error: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}

/** GET — validate if a token is still valid (for the UI to check before showing the form) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token || token.length > 256) {
      return Response.json({ ok: false, valid: false, error: "No valid token provided" }, { status: 400 });
    }

    const tokenDigest = hashPasswordResetToken(token);
    const [resetToken] = await db.select({
      id: passwordResetTokens.id,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
    })
      .from(passwordResetTokens)
      .where(or(
        eq(passwordResetTokens.token, tokenDigest),
        eq(passwordResetTokens.token, token),
      ))
      .limit(1);

    if (!resetToken) {
      return Response.json({ ok: true, valid: false, reason: "not_found" });
    }

    if (resetToken.usedAt) {
      return Response.json({ ok: true, valid: false, reason: "already_used" });
    }

    if (resetToken.expiresAt < new Date()) {
      return Response.json({ ok: true, valid: false, reason: "expired" });
    }

    return Response.json({ ok: true, valid: true });
  } catch (err) {
    catchErr("reset-password GET", err);
    return Response.json({ ok: false, valid: false, error: "Validation failed" }, { status: 500 });
  }
}
