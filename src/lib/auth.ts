import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  if (!s.user) redirect("/login");
  // Signed in but no profile row → database script not run yet, or profile was deleted.
  if (!s.profile) redirect("/account-issue");
  return { supabase: s.supabase, user: s.user, profile: s.profile };
}

export async function requireAdmin() {
  const s = await requireUser();
  if (s.profile.role !== "admin") redirect("/dashboard");
  return s;
}
