import { getApiSession } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = getApiSession(req);
  if (!session) return Response.json({ ok: false, session: null }, { status: 401 });
  return Response.json({
    ok: true,
    session: {
      userId: session.userId,
      email: session.email,
      name: session.name,
    },
  });
}
