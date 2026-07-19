import { createUser, normalizeEmail } from "@/lib/auth";
import { createSessionToken, sessionCookieHeader } from "@/lib/server-auth";
import { getClientIp, rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { validate, signupSchema } from "@/lib/validation";
import { apiHandler, apiSuccess, apiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export const POST = apiHandler(async (req, { log }) => {
  const ip = getClientIp(req);
  const limited = await rateLimitAsync(`signup:${ip}`, 5, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    const raw = await req.json();
    const result = validate(signupSchema, raw);
    if (!result.ok) return result.error;
    const { email, password, name } = result.data;

    const normalizedEmail = normalizeEmail(email);
    const user = await createUser(normalizedEmail, password, name);
    if (!user) {
      log.warn("Signup failed — email may already exist", { email: normalizedEmail });
      return apiError("An account with this email already exists", 409);
    }

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    log.info("User signed up", { userId: user.id, email: normalizedEmail });

    return new Response(
      JSON.stringify({ ok: true, session: { userId: user.id, email: user.email, name: user.name }, requestId: `signup_${Date.now().toString(36)}` }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": sessionCookieHeader(token, req),
          "X-Request-Id": `signup_${Date.now().toString(36)}`,
        },
      },
    );
  } catch (err) {
    // Handle unique email constraint violation
    if (err instanceof Error && (err.message.includes("unique") || err.message.includes("duplicate"))) {
      return apiError("An account with this email already exists", 409);
    }
    return apiError("Signup failed", 500, undefined, err);
  }
});
