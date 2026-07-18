import { z } from "zod";
import { apiError, apiHandler, apiSuccess } from "@/lib/api-utils";
import { sendEmail } from "@/lib/email";
import { getClientIp, rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { isSession, requireApiSession } from "@/lib/server-auth";

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  category: z.enum(["bug", "idea", "usability", "performance", "other"]),
  message: z.string().trim().min(10).max(2000),
  pageUrl: z.string().url().max(1000),
  userAgent: z.string().max(500).optional(),
}).strict();

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

export const POST = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  const destination = process.env.FEEDBACK_TO_EMAIL?.trim();
  if (!destination) return apiError("Feedback delivery is not configured", 503);

  const limited = await rateLimitAsync(`feedback:${session.userId}:${getClientIp(req)}`, 5, 60 * 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  const parsed = feedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("Please check your feedback and try again", 400);
  }

  const { rating, category, message, pageUrl, userAgent } = parsed.data;
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const safeName = escapeHtml(session.name);
  const safeEmail = escapeHtml(session.email);
  const safePage = escapeHtml(pageUrl);
  const safeAgent = escapeHtml(userAgent || "Not provided");

  const result = await sendEmail({
    to: destination,
    subject: `[PersonalCFO Feedback] ${category.toUpperCase()} · ${rating}/5 · ${session.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#25231f">
        <h1 style="font-size:22px;margin:0 0 20px">New PersonalCFO tester feedback</h1>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Rating</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${rating}/5</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Category</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(category)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Tester</strong></td><td style="padding:8px;border-bottom:1px solid #ddd">${safeName} (${safeEmail})</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #ddd"><strong>Page</strong></td><td style="padding:8px;border-bottom:1px solid #ddd"><a href="${safePage}">${safePage}</a></td></tr>
        </table>
        <div style="padding:16px;border-radius:12px;background:#f5f3ee;line-height:1.6">${safeMessage}</div>
        <p style="margin-top:20px;color:#777;font-size:12px">Device: ${safeAgent}</p>
      </div>`,
    text: `New PersonalCFO tester feedback\n\nRating: ${rating}/5\nCategory: ${category}\nTester: ${session.name} (${session.email})\nPage: ${pageUrl}\nDevice: ${userAgent || "Not provided"}\n\n${message}`,
  });

  if (!result.ok) {
    log.error("Feedback email delivery failed", new Error(result.error || "Unknown email error"), { userId: session.userId });
    return apiError("Feedback could not be delivered. Please try again later.", 502);
  }

  log.info("Tester feedback delivered", { userId: session.userId, category, rating });
  return apiSuccess({ delivered: true });
});
