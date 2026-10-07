import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyJwt } from "./jwt";

// Behind Nginx request.url carries the internal host (127.0.0.1:3000) — build the public URL
// from the forwarded headers instead (middleware responses need an absolute Location).
function redirectTo(request: NextRequest, location: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const proto = (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
  return NextResponse.redirect(new URL(location, `${proto}://${host}`));
}

const PROTECTED = ["/dashboard", "/admin"];
const AUTH_PAGES = ["/login", "/register"];

/** Edge-safe gate: verifies the session token signature/expiry (no DB call, nothing to refresh). */
export async function updateSession(request: NextRequest) {
  const claims = await verifyJwt(request.cookies.get(SESSION_COOKIE)?.value);
  const signedIn = claims?.role === "authenticated" && !!claims.sub;
  const path = request.nextUrl.pathname;
  // Only redirect page loads. A server-action POST that gets redirected would be re-sent to
  // /login with the original action id → "Server Action was not found". The action's
  // requireUser()/requireAdmin() redirects to /login properly instead.
  const isPageLoad = request.method === "GET" || request.method === "HEAD";

  if (!signedIn && isPageLoad && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    return redirectTo(request, `/login?next=${encodeURIComponent(path + request.nextUrl.search)}`);
  }
  if (signedIn && isPageLoad && AUTH_PAGES.includes(path)) {
    return redirectTo(request, "/dashboard");
  }
  return NextResponse.next();
}
