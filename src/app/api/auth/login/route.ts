import { validateUser } from "@/lib/auth";
import { createSessionToken, sessionCookieHeader } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

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
