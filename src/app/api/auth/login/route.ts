import { validateUser } from "@/lib/auth";
import { createSessionToken, sessionCookieHeader, getSessionRefreshHeader } from "@/lib/server-auth";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validate, loginSchema } from "@/lib/validation";
import { apiHandler, apiSuccess, apiError } from "@/lib/api-utils";

export const POST = apiHandler(async (req, { log }) => {
  const ip = getClientIp(req);
  // Account lockout: 5 attempts per 15 minutes
  const lockout = rateLimit(`lockout:${ip}`, 5, 15 * 60_000);
  if (!lockout.ok) {
    log.warn("Account lockout triggered — too many failed attempts", { ip });
    return apiError("Too many failed attempts. Please try again in 15 minutes.", 429);
  }
  // General rate limit: 8 per minute
  const limited = rateLimit(`login:${ip}`, 8, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    const raw = await req.json();
    const result = validate(loginSchema, raw);
    if (!result.ok) return result.error;
    const { email, password } = result.data;

    const user = await validateUser(email, password);

    if (!user) {
      log.warn("Login failed — invalid credentials", { email });
      return apiError("Invalid email or password", 401);
    }

    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    const token = createSessionToken(session);
    const headers: Record<string, string> = { "Set-Cookie": sessionCookieHeader(token) };

    // Sliding session refresh
    const refreshHeader = getSessionRefreshHeader({ ...session, exp: Date.now() + 7 * 24 * 60 * 60 * 1000, iat: Date.now() });
    if (refreshHeader) {
      headers["Set-Cookie"] = refreshHeader;
    }

    log.info("Login successful", { userId: user.id });

    return new Response(
      JSON.stringify({ ok: true, session, requestId: `login_${Date.now().toString(36)}` }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...headers,
          "X-Request-Id": `login_${Date.now().toString(36)}`,
        },
      },
    );
  } catch (err) {
    return apiError("Login failed", 500, undefined, err);
  }
});
