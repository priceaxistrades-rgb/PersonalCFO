import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logger } from "./logger";

export type AppSession = {
  userId: number;
  email: string;
  name: string;
  exp: number;
  iat: number;
};

const COOKIE_NAME = "pcfo_session";
const DEFAULT_SESSION_DAYS = 7;
const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000; // Refresh if > 24h remaining

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret === "dev-only-change-me-personal-cfo-secret") {
    if (process.env.NODE_ENV === "production") {
      logger.fatal("AUTH_SECRET is not set or using default value in production! All sessions are forgeable.");
    }
    logger.warn("AUTH_SECRET not set — using insecure default. Set AUTH_SECRET env var immediately.");
    return "dev-only-change-me-personal-cfo-secret";
  }
  return secret;
}

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(input: Omit<AppSession, "exp" | "iat">, days = DEFAULT_SESSION_DAYS) {
  const now = Date.now();
  const session: AppSession = {
    ...input,
    iat: now,
    exp: now + days * 24 * 60 * 60 * 1000,
  };
  const payload = b64url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string | null): AppSession | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AppSession;
    if (!parsed.userId || !parsed.email || !parsed.name || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Check if session should be refreshed (sliding window).
 * Refreshes if more than 24h remaining and session is valid.
 */
function shouldRefreshSession(session: AppSession): boolean {
  const remaining = session.exp - Date.now();
  // Refresh if session has more than the threshold remaining but less than half the total duration
  return remaining > 0 && remaining < (DEFAULT_SESSION_DAYS * 24 * 60 * 60 * 1000) / 2;
}

export function sessionCookieHeader(token: string) {
  const secure = process.env.NODE_ENV === "production";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DEFAULT_SESSION_DAYS * 24 * 60 * 60}; ${secure ? "Secure; " : ""}`;
}

export function clearSessionCookieHeader() {
  const secure = process.env.NODE_ENV === "production";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${secure ? "Secure; " : ""}`;
}

export async function getServerSession(): Promise<AppSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export async function requireServerSession(): Promise<AppSession> {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return session;
}

export function getApiSession(req: Request): AppSession | null {
  const raw = req.headers.get("cookie") || "";
  const token = raw
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  return verifySessionToken(token);
}

export function requireApiSession(req: Request): AppSession | Response {
  const session = getApiSession(req);
  if (!session) {
    return Response.json(
      { ok: false, error: "Authentication required", requestId: `auth_${Date.now().toString(36)}` },
      { status: 401 },
    );
  }
  return session;
}

export function isSession(value: AppSession | Response): value is AppSession {
  return !(value instanceof Response);
}

/**
 * Get a refresh token if the session should be extended.
 * Returns a Set-Cookie header value, or null if no refresh needed.
 */
export function getSessionRefreshHeader(session: AppSession): string | null {
  if (shouldRefreshSession(session)) {
    const newToken = createSessionToken({
      userId: session.userId,
      email: session.email,
      name: session.name,
    });
    return sessionCookieHeader(newToken);
  }
  return null;
}
