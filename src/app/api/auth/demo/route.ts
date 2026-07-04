import { createSessionToken, sessionCookieHeader } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = {
    userId: 1,
    email: "temp@personalcfo.app",
    name: "Temporary User",
  };

  return Response.json(
    { ok: true, session },
    { headers: { "Set-Cookie": sessionCookieHeader(createSessionToken(session)) } }
  );
}
