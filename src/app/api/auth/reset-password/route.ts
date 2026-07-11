import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { users } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { catchErr } from "@/lib/catch";
import { logger } from "@/lib/logger";
import { updateUserPassword } from "@/lib/auth";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).strict().refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const result = validate(resetPasswordSchema, raw);
    if (!result.ok) return result.error;
    const { token, password } = result.data;

    // Find the reset token
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
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

    // Mark token as used FIRST (prevent replay attacks)
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    // Update the password
    await updateUserPassword(user.id, password);

    // Clean up all expired and used tokens for this user
    await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    logger.info("Password reset successful", { userId: user.id, email: user.email });

    return Response.json({
      ok: true,
      message: "Password has been reset successfully. You can now sign in with your new password.",
    });
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

    if (!token) {
      return Response.json({ ok: false, valid: false, error: "No token provided" }, { status: 400 });
    }

    const [resetToken] = await db.select({
      id: passwordResetTokens.id,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
    })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
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
