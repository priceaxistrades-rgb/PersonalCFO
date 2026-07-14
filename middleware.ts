/**
 * Compatibility entrypoint for hosts that still discover Next's middleware
 * convention. The implementation lives in proxy.ts so authentication and
 * security-header policy has one source of truth.
 */

import type { NextRequest } from "next/server";
import { proxy } from "./proxy";

export function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
