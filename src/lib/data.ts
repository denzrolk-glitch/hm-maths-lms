import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClassRow, Enrollment, Lesson, Notice } from "@/lib/types";
import { LIVE_DURATION_MINUTES, LIVE_UNLOCK_MINUTES } from "@/lib/constants";

export type EnrollmentWithClass = Enrollment & { classes: ClassRow | null };

export async function getMyEnrollments(supabase: SupabaseClient, uid: string) {
  const { data } = await supabase.from("enrollments").select("*, classes(*)").eq("student_id", uid).order("month", { ascending: false });
  return (data ?? []) as EnrollmentWithClass[];
}

/** Class + the months this user may open (all lesson months for free classes / admins). */
export async function getClassAccess(supabase: SupabaseClient, uid: string, classId: string, isAdmin: boolean) {
  const { data: cls } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
  if (!cls) return null;
  const c = cls as ClassRow;
  let months: string[];
  if (c.is_free || isAdmin) {
    const { data } = await supabase.from("lessons").select("month").eq("class_id", classId);
    months = [...new Set((data ?? []).map((r) => r.month as string))];
  } else {
    const { data } = await supabase.from("enrollments").select("month").eq("student_id", uid).eq("class_id", classId).eq("status", "approved");
    months = (data ?? []).map((r) => r.month as string);
  }
  months.sort().reverse();
  return { cls: c, months };
}

export async function getNotices(supabase: SupabaseClient, limit = 50, tag?: string) {
  let q = supabase.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
  if (tag) q = q.eq("tag", tag);
  const { data } = await q;
  return (data ?? []) as Notice[];
}

/** Lessons with a live session that has not ended yet (RLS limits to accessible classes/months). */
export async function getUpcomingLive(supabase: SupabaseClient, limit = 10) {
  const since = new Date(Date.now() - LIVE_DURATION_MINUTES * 60 * 1000).toISOString();
  const { data } = await supabase.from("lessons").select("*, classes(title)").not("live_start_time", "is", null)
    .gte("live_start_time", since).order("live_start_time").limit(limit);
  return (data ?? []) as (Lesson & { classes: { title: string } | null })[];
}

/** Hide live_url until the 20-minute pre-join window opens (and after the session ended). */
export function liveWindow(lesson: Pick<Lesson, "live_start_time" | "live_url">, now = Date.now()) {
  if (!lesson.live_start_time) return null;
  const start = new Date(lesson.live_start_time).getTime();
  const unlock = start - LIVE_UNLOCK_MINUTES * 60 * 1000;
  const end = start + LIVE_DURATION_MINUTES * 60 * 1000;
  const open = now >= unlock && now < end;
  return { startISO: new Date(start).toISOString(), endISO: new Date(end).toISOString(), open, ended: now >= end, liveUrl: open ? lesson.live_url : null };
}
