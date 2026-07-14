import { catchErr } from "@/lib/catch";
import { createSessionToken, sessionCookieHeader } from "@/lib/server-auth";
import { ensureDemoUserWithData } from "@/lib/demo";
import { getClientIp, rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Demo login endpoint — creates a session for the demo user.
 * Rate-limited to prevent abuse.
 * In production, consider disabling this endpoint entirely.
 */
export async function POST(req: Request) {
  // Rate limit demo login attempts
  const ip = getClientIp(req);
  const limited = await rateLimitAsync(`demo:${ip}`, 3, 60_000); // 3 attempts per minute
  if (!limited.ok) return rateLimitResponse(limited.resetAt);

  try {
    // Ensure demo user exists with sample data
    const user = await ensureDemoUserWithData();

    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    return Response.json(
      { ok: true, session },
      { headers: { "Set-Cookie": sessionCookieHeader(createSessionToken(session), req) } },
    );
  } catch (err) {
    return Response.json({ error: "Demo setup failed" }, { status: 500 });
  }
}
