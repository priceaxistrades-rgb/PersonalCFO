import { catchErr } from "@/lib/catch";
import { clearSessionCookieHeader } from "@/lib/server-auth";

export async function POST(req: Request) {
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": clearSessionCookieHeader(req) } }
  );
}
