import { NextResponse, type NextRequest } from "next/server";
import { CONTENT_SECURITY_POLICY } from "@/lib/api-utils";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/api/auth/login", "/api/auth/signup", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/demo"];
const SESSION_COOKIE = "pcfo_session";

/**
 * CSRF Protection: Validate Origin header on state-changing requests.
 */
function isCsrfSafe(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (!["POST", "PATCH", "DELETE", "PUT"].includes(method)) return true;

  const origin = req.headers.get("origin");
  if (!origin) return true;

  const host = req.headers.get("host");
  if (!host) return false;

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || req.nextUrl.protocol.replace(":", "");
  const expectedOrigin = `${protocol}://${host}`;

  return origin === expectedOrigin;
}

/**
 * Add security headers to all responses.
 */
function withSecurityHeaders(response: NextResponse, isHttps: boolean): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  if (isHttps) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const isHttps = forwardedProto === "https" || req.nextUrl.protocol === "https:";

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/uploads/")
  ) {
    return withSecurityHeaders(NextResponse.next(), isHttps);
  }

  // ─── CSRF Check ────────────────────────────────────────────
  if (!isCsrfSafe(req)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "CSRF check failed — invalid Origin", requestId: `csrf_${Date.now().toString(36)}` },
        { status: 403 },
      );
    }
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    return NextResponse.redirect(login);
  }

  // ─── Authentication Check ──────────────────────────────────
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "Authentication required", requestId: `auth_${Date.now().toString(36)}` },
        { status: 401 },
      );
    }
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return withSecurityHeaders(NextResponse.next(), isHttps);
}

export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
