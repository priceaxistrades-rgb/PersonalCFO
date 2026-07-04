import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AppSession = {
  userId: number;
  email: string;
  name: string;
  exp: number;
};

const COOKIE_NAME = "pcfo_session";
const DEFAULT_SESSION_DAYS = 7;

function getSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-change-me-personal-cfo-secret";
}

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(input: Omit<AppSession, "exp">, days = DEFAULT_SESSION_DAYS) {
  const session: AppSession = {
    ...input,
    exp: Date.now() + days * 24 * 60 * 60 * 1000,
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
  if (!session) return Response.json({ error: "Authentication required" }, { status: 401 });
  return session;
}

export function isSession(value: AppSession | Response): value is AppSession {
  return !(value instanceof Response);
}
