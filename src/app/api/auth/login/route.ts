import { validateUser } from "@/lib/auth";
import { createSessionToken, sessionCookieHeader } from "@/lib/server-auth";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validate, loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`login:${ip}`, 8, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    const raw = await req.json();
    const result = validate(loginSchema, raw);
    if (!result.ok) return result.error;
    const { email, password } = result.data;

    const user = await validateUser(email, password);
    
    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    return Response.json(
      { ok: true, session },
      { headers: { "Set-Cookie": sessionCookieHeader(createSessionToken(session)) } }
    );
  } catch {
    return Response.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
