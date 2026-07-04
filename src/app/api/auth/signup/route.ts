import { createUser, normalizeEmail } from "@/lib/auth";
import { createSessionToken, sessionCookieHeader } from "@/lib/server-auth";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`signup:${ip}`, 5, 5 * 60_000);
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    const { email, password, name } = await req.json();
    const cleanEmail = normalizeEmail(email);
    const cleanName = String(name || "").trim();

    if (!cleanEmail || !password || !cleanName) {
      return Response.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (!validEmail(cleanEmail)) {
      return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

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
