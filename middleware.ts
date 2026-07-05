import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/api/auth/login", "/api/auth/signup", "/api/auth/demo", "/api/health"];
const SESSION_COOKIE = "pcfo_session";

/**
 * CSRF Protection: Validate Origin header on state-changing requests.
 * Browsers always send the Origin header on cross-origin POST/PATCH/DELETE requests.
 * If Origin is present and doesn't match our host, the request is cross-site → reject.
 * Same-site requests either have no Origin header or a matching one.
 */
function isCsrfSafe(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  // Only check state-changing methods
  if (!["POST", "PATCH", "DELETE", "PUT"].includes(method)) return true;

  const origin = req.headers.get("origin");
  // No Origin header = same-origin navigation (browser behavior) → allow
  if (!origin) return true;

  const host = req.headers.get("host");
  if (!host) return false;

  // Build the expected origin from the request host
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const expectedOrigin = `${protocol}://${host}`;

  return origin === expectedOrigin;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/uploads/")
  ) {
    return NextResponse.next();
  }

  // ─── CSRF Check ────────────────────────────────────────────
  if (!isCsrfSafe(req)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "CSRF check failed — invalid Origin" }, { status: 403 });
    }
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    return NextResponse.redirect(login);
  }

  // ─── Authentication Check ──────────────────────────────────
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
