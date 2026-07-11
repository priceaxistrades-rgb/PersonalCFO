import crypto from "crypto";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { catchErr } from "@/lib/catch";
import { logger } from "@/lib/logger";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
}).strict();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const RESET_TOKEN_EXPIRY_HOURS = 1;
const MAX_RESET_TOKENS_PER_HOUR = 3;

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const result = validate(forgotPasswordSchema, raw);
    if (!result.ok) return result.error;
    const { email } = result.data;

    // Check if user exists
    const [user] = await db.select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration attacks
    if (!user) {
      logger.info("Password reset requested for non-existent email", { email });
      return Response.json({
        ok: true,
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Rate limit: max 3 reset tokens per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = await db.select({ id: passwordResetTokens.id })
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.userId, user.id),
        gt(passwordResetTokens.createdAt, oneHourAgo),
      ));

    if (recentTokens.length >= MAX_RESET_TOKENS_PER_HOUR) {
      logger.warn("Password reset rate limited", { userId: user.id, email });
      return Response.json({
        ok: true,
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Invalidate any existing unused tokens for this user
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ));

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Store token in database
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Build the reset URL
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    // Send the password reset email (falls back to console if no RESEND_API_KEY)
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiryHours: RESET_TOKEN_EXPIRY_HOURS,
    });

    if (!emailResult.ok) {
      logger.error("Failed to send reset email", new Error(emailResult.error || "Unknown"), { userId: user.id });
      // Don't reveal email failure to user to prevent enumeration
    }

    // In dev mode, also include the reset URL in the response for easy testing
    const isConsoleMode = !process.env.RESEND_API_KEY;

    return Response.json({
      ok: true,
      message: "If an account with that email exists, a reset link has been sent.",
      ...(process.env.NODE_ENV === "development" && {
        devResetUrl: resetUrl,
        devEmailMode: isConsoleMode ? "console" : "resend",
      }),
    });
  } catch (err) {
    catchErr("forgot-password", err);
    // Always return generic success to prevent enumeration
    return Response.json({
      ok: true,
      message: "If an account with that email exists, a reset link has been sent.",
    });
  }
}
