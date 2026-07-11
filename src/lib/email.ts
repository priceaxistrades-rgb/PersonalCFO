/**
 * ═══════════════════════════════════════════════════════════════
 * EMAIL SERVICE — PersonalCFO
 * ═══════════════════════════════════════════════════════════════
 *
 * Sends transactional emails via Resend (free 100/day).
 * Falls back to console logging if RESEND_API_KEY is not set.
 *
 * Setup:
 *   1. Go to https://resend.com and create a free account
 *   2. Add and verify your sending domain (or use onboarding domain)
 *   3. Set RESEND_API_KEY in your .env.local / Vercel env vars
 *   4. Set EMAIL_FROM to your verified sender (e.g. "PersonalCFO <noreply@yourdomain.com>")
 *
 * If RESEND_API_KEY is missing, emails are logged to console instead.
 * ═══════════════════════════════════════════════════════════════
 */

import { logger } from "./logger";

type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "PersonalCFO <onboarding@resend.dev>";

/**
 * Send an email. Uses Resend if API key is configured,
 * otherwise logs to console (dev/fallback mode).
 */
export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  // ─── No API key → Console fallback ───────────────────────────
  if (!RESEND_API_KEY) {
    const recipients = Array.isArray(payload.to) ? payload.to.join(", ") : payload.to;
    console.log("\n" + "═".repeat(70));
    console.log("📧 EMAIL (console mode — set RESEND_API_KEY to send real emails)");
    console.log("═".repeat(70));
    console.log(`  From:    ${EMAIL_FROM}`);
    console.log(`  To:      ${recipients}`);
    console.log(`  Subject: ${payload.subject}`);
    console.log(`  Text:    ${payload.text || "(HTML only)"}`);
    console.log("═".repeat(70) + "\n");
    logger.info("Email logged to console (no RESEND_API_KEY)", { to: recipients, subject: payload.subject });
    return { ok: true, id: "console" };
  }

  // ─── Resend API ──────────────────────────────────────────────
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (error) {
      logger.error("Resend email failed", error, { to: payload.to, subject: payload.subject });
      return { ok: false, error: error.message };
    }

    logger.info("Email sent via Resend", { to: payload.to, subject: payload.subject, id: data?.id });
    return { ok: true, id: data?.id };
  } catch (err: any) {
    logger.error("Resend SDK error", err);
    return { ok: false, error: err.message || "Email send failed" };
  }
}

/**
 * Send a password reset email with a branded HTML template.
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
  expiryHours: number;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { to, name, resetUrl, expiryHours } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset Your Password — PersonalCFO</title>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:40px auto;background:#1a1a23;border-radius:16px;overflow:hidden;border:1px solid #2a2a3a;">
    <!-- Header -->
    <tr>
      <td style="padding:32px 32px 0;text-align:center;">
        <div style="width:56px;height:56px;margin:0 auto 16px;background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;">🔐</div>
        <h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:800;">Reset Your Password</h1>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">PersonalCFO</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:24px 32px;">
        <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.6;">
          Hi <strong style="color:#f1f5f9;">${name}</strong>,
        </p>
        <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.6;">
          We received a request to reset your password. Click the button below to set a new password:
        </p>
        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
          <tr>
            <td align="center">
              <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">Reset Password</a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px;color:#94a3b8;font-size:13px;line-height:1.5;">
          Or copy this link to your browser:<br>
          <a href="${resetUrl}" style="color:#818cf8;word-break:break-all;font-size:12px;">${resetUrl}</a>
        </p>
        <p style="margin:16px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">
          ⏰ This link expires in <strong style="color:#fbbf24;">${expiryHours} hour${expiryHours > 1 ? "s" : ""}</strong>.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:0 32px 32px;">
        <div style="border-top:1px solid #2a2a3a;padding-top:20px;">
          <p style="margin:0 0 8px;color:#64748b;font-size:12px;line-height:1.5;">
            If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <p style="margin:0;color:#475569;font-size:11px;">
            — PersonalCFO Team
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${name},\n\nWe received a request to reset your password.\n\nClick here to reset: ${resetUrl}\n\nThis link expires in ${expiryHours} hour${expiryHours > 1 ? "s" : ""}.\n\nIf you didn't request this, ignore this email.\n\n— PersonalCFO Team`;

  return sendEmail({ to, subject: "🔐 Reset Your Password — PersonalCFO", html, text });
}
