import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Signs the user out and sends them to the home page with a plain 303 redirect
 *  (a full page load, so no dashboard state or server-action rendering is involved). */
async function logout(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet: CookieToSet[]) => toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore — we still clear the auth cookies below
  }
  // Belt & braces: drop every Supabase auth cookie even if signOut failed (e.g. expired session).
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-")) response.cookies.set(c.name, "", { path: "/", maxAge: 0 });
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const POST = logout;
export const GET = logout;
