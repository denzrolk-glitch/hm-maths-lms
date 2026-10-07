import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/db/server";
import type { Profile } from "@/lib/types";

/** Cached per request: the signed-in user + profile (or nulls). */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile: (profile as Profile | null) ?? null };
});

export async function requireUser() {
  const s = await getSession();
  if (!s.user) {
    // Keep the page the user was on so they come straight back after signing in.
    let back = "";
    try { const u = new URL((await headers()).get("referer") ?? ""); back = u.pathname + u.search; } catch { /* no referer */ }
    if (back.startsWith("/login")) back = "";
    redirect(back.startsWith("/") && !back.startsWith("//") ? `/login?next=${encodeURIComponent(back)}` : "/login");
  }
  // Signed in but no profile row → database script not run yet, or profile was deleted.
  if (!s.profile) redirect("/account-issue");
  return { supabase: s.supabase, user: s.user, profile: s.profile };
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.profile.role !== "admin") redirect("/dashboard");
  return s;
}
