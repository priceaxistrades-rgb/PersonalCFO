import { catchErr } from "@/lib/catch";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validate } from "@/lib/validation";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
}).strict();

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const result = validate(forgotPasswordSchema, raw);
    if (!result.ok) return result.error;
    const { email } = result.data;

    // Check if user exists
    const user = await db.select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration attacks
    // In production, you would send an actual email here
    return Response.json({
      ok: true,
      message: "If an account with that email exists, a reset link has been sent.",
      // Dev mode: indicate if user was found (remove in production)
      ...(process.env.NODE_ENV === "development" && { devHint: user.length > 0 ? "User found" : "No user found" }),
    });
  } catch (err) {
    return Response.json({ ok: true, message: "If an account with that email exists, a reset link has been sent." });
  }
}
