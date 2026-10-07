"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomInt } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/db/admin";
import { CLASS_TYPES, NOTICE_TAGS, TOWNS } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { colomboLocalToISO, currentMonth, normalizeMobile } from "@/lib/utils";
import { youtubeId } from "@/lib/youtube";
import { getT } from "@/i18n/server";

const m = async (k: string, v?: Record<string, string | number>) => (await getT("errors.admin"))(k, v);

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optStr = (fd: FormData, k: string) => str(fd, k) || null;
const optInt = (fd: FormData, k: string) => { const v = str(fd, k); return v ? Number.parseInt(v, 10) : null; };
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const fail = (e: { message: string } | null, fallback: string): ActionState => ({ error: e?.message ? `${fallback}: ${e.message}` : fallback });
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const minutesOrNull = (fd: FormData, k: string) => { const n = optInt(fd, k); return n === null || Number.isNaN(n) ? null : n; };
const isHttps = (u: string) => /^https:\/\/\S+$/.test(u);

// ───────────────────────────── Classes ─────────────────────────────
export async function saveClassAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = optStr(fd, "id");
  const class_type = str(fd, "class_type");
  const town = optStr(fd, "town");
  const is_free = bool(fd, "is_free") || class_type === "Free Seminar";
  const fee = is_free ? 0 : Number(str(fd, "fee") || 0);
  const row = {
    title: str(fd, "title"),
    description: optStr(fd, "description"),
    class_type,
    target_year: optInt(fd, "target_year"),
    town,
    fee,
    schedule: optStr(fd, "schedule"),
    schedule_days: [...new Set(fd.getAll("schedule_days").map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort(),
    start_time: optStr(fd, "start_time"),
    duration_minutes: minutesOrNull(fd, "duration_minutes") ?? 120,
    banner_url: optStr(fd, "banner_url"),
    is_active: bool(fd, "is_active"),
    is_free,
  };
  if (row.title.length < 3) return { error: await m("titleRequired") };
  if (!(CLASS_TYPES as readonly string[]).includes(class_type)) return { error: await m("classType") };
  if (town && !(TOWNS as readonly string[]).includes(town)) return { error: await m("invalidCenter") };
  if (!Number.isFinite(fee) || fee < 0) return { error: await m("fee") };
  if (row.start_time && !TIME_RE.test(row.start_time)) return { error: await m("time") };
  if (row.duration_minutes < 15 || row.duration_minutes > 600) return { error: await m("durationRange") };
  if (row.schedule_days.length && !row.start_time) return { error: await m("startTimeRequired") };
  const defaultLink = optStr(fd, "default_live_url");
  if (defaultLink && !isHttps(defaultLink)) return { error: await m("liveHttps") };
  const saveLink = async (classId: string) => defaultLink
    ? supabase.from("class_live_defaults").upsert({ class_id: classId, live_url: defaultLink, updated_at: new Date().toISOString() })
    : supabase.from("class_live_defaults").delete().eq("class_id", classId);

  if (id) {
    const { error } = await supabase.from("classes").update(row).eq("id", id);
    if (error) return fail(error, await m("fail.saveClass"));
    const { error: linkErr } = await saveLink(id);
    if (linkErr) return fail(linkErr, await m("fail.saveClass"));
    revalidatePath("/admin/classes", "layout");
    revalidatePath("/", "layout");
    return { ok: true, message: await m("classSaved") };
  }
  const { data, error } = await supabase.from("classes").insert(row).select("id").single();
  if (error) return fail(error, await m("fail.createClass"));
  await saveLink(data.id);
  revalidatePath("/", "layout");
  redirect(`/admin/classes/${data.id}`);
}

export async function deleteClassAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("classes").delete().eq("id", str(fd, "id"));
  if (error) return fail(error, await m("fail.deleteClass"));
  revalidatePath("/", "layout");
  redirect("/admin/classes");
}

// ───────────────────────────── Lessons ─────────────────────────────
export async function saveLessonAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = optStr(fd, "id");
  const youtube_url = optStr(fd, "youtube_url");
  const live_url = optStr(fd, "live_url");
  const liveDate = optStr(fd, "live_date");
  const liveTime = optStr(fd, "live_time");
  const session_type = str(fd, "session_type") === "extra" ? "extra" : "regular";
  const classId = str(fd, "class_id");
  if ((liveDate && !DATE_RE.test(liveDate)) || (liveTime && !TIME_RE.test(liveTime))) return { error: await m("time") };
  if (!!liveDate !== !!liveTime) return { error: await m("dateAndTime") };
  const live_start_time = liveDate && liveTime ? colomboLocalToISO(`${liveDate}T${liveTime}`) : null;
  // A dated session belongs to the month it happens in (that is the month students pay for).
  const month = liveDate ? liveDate.slice(0, 7) : str(fd, "month") || currentMonth();
  const row = {
    class_id: classId,
    month,
    week_number: liveDate ? Math.min(6, Math.ceil(Number(liveDate.slice(8, 10)) / 7)) : Number(str(fd, "week_number") || 1),
    title: str(fd, "title"),
    description: optStr(fd, "description"),
    youtube_url,
    tute_pdf_url: optStr(fd, "tute_pdf_url"),
    live_start_time,
    session_type,
    duration_minutes: minutesOrNull(fd, "duration_minutes"),
    is_cancelled: bool(fd, "is_cancelled"),
    sort_order: liveDate ? Number(liveDate.slice(8, 10)) : Number(str(fd, "sort_order") || 0),
  };
  if (!row.title) return { error: await m("lessonTitle") };
  if (!MONTH_RE.test(row.month)) return { error: await m("month") };
  if (row.week_number < 1 || row.week_number > 6) return { error: await m("week") };
  if (row.duration_minutes !== null && (row.duration_minutes < 15 || row.duration_minutes > 600)) return { error: await m("durationRange") };
  if (youtube_url && !youtubeId(youtube_url)) return { error: await m("youtube") };
  if (live_url && !isHttps(live_url)) return { error: await m("liveHttps") };
  if (live_url && !live_start_time) return { error: await m("liveNeedsTime") };
  if (row.tute_pdf_url && !row.tute_pdf_url.startsWith(`${row.class_id}/`)) return { error: await m("tuteFile") };

  const res = id
    ? await supabase.from("lessons").update(row).eq("id", id).select("id").single()
    : await supabase.from("lessons").insert(row).select("id").single();
  if (res.error) return fail(res.error, await m("fail.saveLesson"));
  const lessonId = res.data.id as string;
  const { error: linkErr } = live_url
    ? await supabase.from("lesson_live_links").upsert({ lesson_id: lessonId, live_url, updated_at: new Date().toISOString() })
    : await supabase.from("lesson_live_links").delete().eq("lesson_id", lessonId);
  if (linkErr) return fail(linkErr, await m("fail.saveLesson"));
  revalidatePath(`/admin/classes/${row.class_id}`);
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: id ? await m("lessonUpdated") : session_type === "extra" ? await m("extraAdded") : await m("lessonAdded") };
}

/** Create every weekly session of a month from the class timetable (database function, skips existing days). */
export async function generateSessionsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const classId = str(fd, "class_id");
  const month = str(fd, "month");
  if (!MONTH_RE.test(month)) return { error: await m("month") };
  const { data, error } = await supabase.rpc("generate_class_sessions", { p_class: classId, p_month: month, p_title: optStr(fd, "title") });
  if (error) return fail(error, await m("fail.generate"));
  revalidatePath(`/admin/classes/${classId}`);
  revalidatePath("/dashboard", "layout");
  const n = Number(data ?? 0);
  return { ok: true, message: n ? await m("generated", { n }) : await m("generatedNone") };
}

/** Cancel / restore a single session (students see "Cancelled" and the link stays hidden). */
export async function toggleCancelAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const cancel = str(fd, "cancel") === "1";
  const { data, error } = await supabase.from("lessons").update({ is_cancelled: cancel }).eq("id", str(fd, "id")).select("class_id").single();
  if (error) return fail(error, await m("fail.update"));
  revalidatePath(`/admin/classes/${data.class_id}`);
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: cancel ? await m("sessionCancelled") : await m("sessionRestored") };
}

export async function deleteLessonAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("lessons").delete().eq("id", str(fd, "id")).select("class_id, tute_pdf_url").maybeSingle();
  if (data?.tute_pdf_url) await supabase.storage.from("tute-pdfs").remove([data.tute_pdf_url]);
  revalidatePath(`/admin/classes/${data?.class_id ?? ""}`);
  return { ok: true, message: await m("lessonDeleted") };
}

// ─────────────────────────── Enrollments ───────────────────────────
export async function reviewEnrollmentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const decision = str(fd, "decision");
  if (decision !== "approved" && decision !== "rejected") return { error: await m("decision") };
  const note = optStr(fd, "admin_note") ?? (decision === "rejected" ? "Slip unclear or amount incorrect. Please re-upload." : null);
  const { error } = await supabase.from("enrollments").update({ status: decision, admin_note: note }).eq("id", str(fd, "id"));
  if (error) return fail(error, await m("fail.update"));
  revalidatePath("/admin", "layout");
  return { ok: true, message: decision === "approved" ? await m("approved") : await m("rejected") };
}

/** Grant access without a slip (cash payments at physical centers). */
export async function grantAccessAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const who = str(fd, "student").toUpperCase();
  const classId = str(fd, "class_id");
  const month = str(fd, "month");
  if (!MONTH_RE.test(month)) return { error: await m("month") };
  const mobile = normalizeMobile(who);
  const { data: student } = await supabase.from("profiles").select("id, full_name")
    .or(mobile ? `mobile.eq.${mobile}` : `student_id.eq.${who},nic.eq.${who}`).maybeSingle();
  if (!student) return { error: await m("noStudent") };
  const { data: cls } = await supabase.from("classes").select("fee").eq("id", classId).maybeSingle();
  const { error } = await supabase.from("enrollments").upsert(
    { student_id: student.id, class_id: classId, month, status: "approved", amount: cls?.fee ?? null, admin_note: "Paid at class (cash)" },
    { onConflict: "student_id,class_id,month" },
  );
  if (error) return fail(error, await m("fail.grant"));
  revalidatePath("/admin", "layout");
  return { ok: true, message: await m("granted", { name: student.full_name }) };
}

// ───────────────────────────── Notices ─────────────────────────────
export async function createNoticeAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();
  const tag = str(fd, "tag");
  const row = {
    title: str(fd, "title"), content: str(fd, "content"), tag,
    is_pinned: bool(fd, "is_pinned"), class_id: optStr(fd, "class_id"), target_year: optInt(fd, "target_year"), created_by: user.id,
  };
  if (!row.title || !row.content) return { error: await m("noticeRequired") };
  if (!(NOTICE_TAGS as readonly string[]).includes(tag)) return { error: await m("tag") };
  const { error } = await supabase.from("notices").insert(row);
  if (error) return fail(error, await m("fail.publish"));
  revalidatePath("/admin/notices");
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: await m("noticePublished") };
}

export async function updateNoticeAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const op = str(fd, "op");
  const { error } = op === "delete"
    ? await supabase.from("notices").delete().eq("id", id)
    : await supabase.from("notices").update({ is_pinned: op === "pin" }).eq("id", id);
  if (error) return fail(error, await m("fail.updateNotice"));
  revalidatePath("/admin/notices");
  return { ok: true, message: op === "delete" ? await m("noticeDeleted") : op === "pin" ? await m("pinned") : await m("unpinned") };
}

// ────────────────────────────── Exams ──────────────────────────────
export async function saveExamAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = optStr(fd, "id");
  const exam_type = str(fd, "exam_type") === "structured" ? "structured" : "mcq";
  const row = {
    class_id: str(fd, "class_id"), title: str(fd, "title"), description: optStr(fd, "description"), exam_type,
    duration_minutes: Number(str(fd, "duration_minutes") || 60), paper_pdf_url: optStr(fd, "paper_pdf_url"),
    opens_at: colomboLocalToISO(optStr(fd, "opens_at")), closes_at: colomboLocalToISO(optStr(fd, "closes_at")),
    is_published: bool(fd, "is_published"),
  };
  if (!row.title || !row.class_id) return { error: await m("examRequired") };
  if (row.duration_minutes < 1 || row.duration_minutes > 600) return { error: await m("duration") };
  if (row.opens_at && row.closes_at && row.closes_at <= row.opens_at) return { error: await m("closeAfterOpen") };
  if (id) {
    const { error } = await supabase.from("exams").update(row).eq("id", id);
    if (error) return fail(error, await m("fail.saveExam"));
    revalidatePath(`/admin/exams/${id}`);
    return { ok: true, message: await m("examSaved") };
  }
  const { data, error } = await supabase.from("exams").insert(row).select("id").single();
  if (error) return fail(error, await m("fail.createExam"));
  redirect(`/admin/exams/${data.id}`);
}

export async function deleteExamAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("exams").delete().eq("id", str(fd, "id"));
  if (error) return fail(error, await m("fail.deleteExam"));
  redirect("/admin/exams");
}

export async function addQuestionAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const exam_id = str(fd, "exam_id");
  const options = [1, 2, 3, 4, 5].map((i) => str(fd, `option_${i}`)).filter(Boolean);
  const correct = Number(str(fd, "correct_answer")) - 1;
  if (!str(fd, "question_text")) return { error: await m("questionText") };
  if (options.length < 2) return { error: await m("twoOptions") };
  if (!(correct >= 0 && correct < options.length)) return { error: await m("correctOption") };
  const { count } = await supabase.from("exam_questions").select("id", { count: "exact", head: true }).eq("exam_id", exam_id);
  const { error } = await supabase.from("exam_questions").insert({
    exam_id, question_text: str(fd, "question_text"), options_json: options, correct_answer: correct,
    marks: Number(str(fd, "marks") || 1), explanation: optStr(fd, "explanation"), sort_order: (count ?? 0) + 1,
  });
  if (error) return fail(error, await m("fail.addQuestion"));
  revalidatePath(`/admin/exams/${exam_id}`);
  return { ok: true, message: await m("questionAdded") };
}

export async function deleteQuestionAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("exam_questions").delete().eq("id", str(fd, "id")).select("exam_id").maybeSingle();
  revalidatePath(`/admin/exams/${data?.exam_id ?? ""}`);
  return { ok: true, message: await m("questionDeleted") };
}

export async function gradeSubmissionAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const score = Number(str(fd, "score"));
  const total = Number(str(fd, "total_marks") || 100);
  if (!Number.isFinite(score) || score < 0 || score > total) return { error: await m("score") };
  const { data, error } = await supabase.from("exam_submissions")
    .update({ score, total_marks: total, feedback: optStr(fd, "feedback"), status: "graded", graded_at: new Date().toISOString() })
    .eq("id", str(fd, "id")).select("exam_id").single();
  if (error) return fail(error, await m("fail.saveMarks"));
  revalidatePath(`/admin/exams/${data.exam_id}`);
  return { ok: true, message: await m("marksSaved") };
}

// ───────────────────────────── Students ─────────────────────────────
export async function resetPasswordAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const temp = Array.from({ length: 10 }, () => alphabet[randomInt(alphabet.length)]).join("");
  const { error } = await createAdminClient().auth.admin.updateUserById(id, { password: temp });
  if (error) return fail(error, await m("fail.resetPassword"));
  return { ok: true, message: await m("tempPassword", { temp }) };
}

export async function setRoleAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireAdmin();
  const id = str(fd, "id");
  const role = str(fd, "role") === "admin" ? "admin" : "student";
  if (id === user.id) return { error: await m("ownRole") };
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) return fail(error, await m("fail.changeRole"));
  revalidatePath("/admin/students");
  return { ok: true, message: await m("roleSet", { role }) };
}

// ────────────────────────────── Store ──────────────────────────────
export async function saveProductAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = optStr(fd, "id");
  const row = {
    title: str(fd, "title"), description: optStr(fd, "description"), price: Number(str(fd, "price") || 0),
    image_url: optStr(fd, "image_url"), is_active: bool(fd, "is_active"), product_type: "tute_book",
  };
  if (!row.title) return { error: await m("titleRequired") };
  const { error } = id ? await supabase.from("products").update(row).eq("id", id) : await supabase.from("products").insert(row);
  if (error) return fail(error, await m("fail.saveProduct"));
  revalidatePath("/admin/store");
  revalidatePath("/store");
  return { ok: true, message: await m("productSaved") };
}

export async function deleteProductAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", str(fd, "id"));
  if (error) return { error: await m("productHasOrders") };
  revalidatePath("/admin/store");
  return { ok: true, message: await m("productDeleted") };
}

export async function reviewOrderAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const status = str(fd, "decision");
  if (!["approved", "rejected", "shipped"].includes(status)) return { error: await m("invalidStatus") };
  const { error } = await supabase.from("orders").update({ status, admin_note: optStr(fd, "admin_note") }).eq("id", str(fd, "id"));
  if (error) return fail(error, await m("fail.updateOrder"));
  revalidatePath("/admin", "layout");
  return { ok: true, message: await m(`order.${status}`) };
}
