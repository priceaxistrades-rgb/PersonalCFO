import { createUser, normalizeEmail } from "@/lib/auth";
import { createSessionToken, sessionCookieHeader } from "@/lib/server-auth";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validate, signupSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`signup:${ip}`, 5, 5 * 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    const raw = await req.json();
    const result = validate(signupSchema, raw);
    if (!result.ok) return result.error;
    const { email, password, name } = result.data;

    const cleanEmail = normalizeEmail(email);
    const cleanName = name;

    const user = await createUser(cleanEmail, password, cleanName);
    const session = { userId: user.id, email: user.email, name: user.name };

    return Response.json(
      { ok: true, user: session, session },
      { headers: { "Set-Cookie": sessionCookieHeader(createSessionToken(session)) } }
    );
  } catch (error: unknown) {
    console.error("Signup failed:", error);
    const message = error instanceof Error ? error.message : "Failed to create account";

    if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("duplicate")) {
      return Response.json(
        { error: "Email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Could not create account. Please check database migration and try again." },
      { status: 500 }
    );
  }
}
