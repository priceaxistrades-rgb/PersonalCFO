import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard", "/income", "/expenses", "/investments", "/debt", "/goals", "/bills", "/budget", "/recurring", "/reports", "/settings", "/family", "/tax", "/insurance", "/emergency", "/annual", "/wealth", "/networth", "/savings", "/transfers", "/reconciliation", "/opportunities", "/coach", "/brief", "/ai", "/markets", "/control", "/stress", "/simulator", "/dreams", "/guide", "/health", "/onboarding",
];

function allowedOrigins(request: NextRequest): string[] {
  const configured = process.env.ALLOWED_ORIGINS || process.env.APP_ORIGIN || "https://personal-cfo-snjo.vercel.app";
  // Request origin supports Vercel preview deployments only when explicitly
  // listed above; it is intentionally not trusted by default.
  return configured.split(",").map((value) => value.trim().replace(/\/$/, "")).filter(Boolean);
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Content-Security-Policy-Report-Only", [
    "default-src 'self'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob:", "connect-src 'self' https://api.mfapi.in https://query1.finance.yahoo.com", "base-uri 'self'", "object-src 'none'", "form-action 'self'", "frame-ancestors 'none'",
  ].join("; "));
  if (process.env.NODE_ENV === "production") response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Browser-originated writes must come from an explicitly configured first-
  // party origin. APIs still verify the signed session independently.
  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin")?.replace(/\/$/, "");
    if (!origin || !allowedOrigins(request).includes(origin)) {
      return applySecurityHeaders(NextResponse.json({ ok: false, error: "Invalid request origin" }, { status: 403 }));
    }
  }

  if (pathname.startsWith("/api/")) return applySecurityHeaders(NextResponse.next());

  if (pathname.startsWith("/_next") || pathname.startsWith("/public") || pathname.includes(".") || pathname === "/favicon.ico" || pathname === "/manifest.json") {
    return applySecurityHeaders(NextResponse.next());
  }

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const sessionToken = request.cookies.get("pcfo_session")?.value;
  if (isProtected && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
