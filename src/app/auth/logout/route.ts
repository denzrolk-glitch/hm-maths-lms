import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/db/jwt";

/** Signs the user out (clears the session cookie) with a plain 303 to the home page. */
function logout() {
  const response = new NextResponse(null, { status: 303, headers: { Location: "/", "Cache-Control": "no-store" } });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
export const POST = logout;
export const GET = logout;
