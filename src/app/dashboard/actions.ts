"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/db/admin";
import { TOWNS } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { getT } from "@/i18n/server";
import { currentMonth, shiftMonth } from "@/lib/utils";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function submitEnrollmentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const t = await getT("errors.student");
  const classId = String(fd.get("class_id") ?? "");
  const month = String(fd.get("month") ?? "");
  const slip = String(fd.get("slip_url") ?? "");
  const bankRef = String(fd.get("bank_ref") ?? "").trim().slice(0, 80) || null;

  if (!MONTH_RE.test(month)) return { error: t("selectMonth") };
  const cur = currentMonth();
  if (month > shiftMonth(cur, 1) || month < shiftMonth(cur, -36)) return { error: t("monthUnavailable") };
  if (!slip.startsWith(`${user.id}/`)) return { error: t("slipFirst") };

  const { data: cls } = await supabase.from("classes").select("id, is_free, is_active").eq("id", classId).maybeSingle();
  if (!cls || !cls.is_active) return { error: t("classUnavailable") };
  if (cls.is_free) return { error: t("classFree") };

  // One slip at a time per class: a pending slip must be reviewed or withdrawn first.
  const { data: pending } = await supabase.from("enrollments").select("id")
    .eq("student_id", user.id).eq("class_id", classId).eq("status", "pending").limit(1);
  if (pending?.length) return { error: t("pendingExists") };

  const { data: existing } = await supabase.from("enrollments").select("id, status")
    .eq("student_id", user.id).eq("class_id", classId).eq("month", month).maybeSingle();
  if (existing?.status === "approved") return { error: t("alreadyAccess") };

  const { error } = existing
    ? await supabase.from("enrollments").update({ slip_url: slip, bank_ref: bankRef, status: "pending", admin_note: null }).eq("id", existing.id)
    : await supabase.from("enrollments").insert({ student_id: user.id, class_id: classId, month, slip_url: slip, bank_ref: bankRef, status: "pending" });
  if (error) return { error: t("slipFailed") };

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: t("slipSubmitted") };
}

/** Student withdraws their own pending slip so they can send a new one. */
export async function withdrawEnrollmentAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const t = await getT("errors.student");
  const id = String(fd.get("id") ?? "");
  const { data, error } = await supabase.from("enrollments").delete()
    .eq("id", id).eq("student_id", user.id).eq("status", "pending").select("slip_url");
  if (error || !data?.length) return { error: t("withdrawFailed") };
  const slip = data[0].slip_url as string | null;
  if (slip?.startsWith(`${user.id}/`)) await createAdminClient().storage.from("bank-slips").remove([slip]);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: t("withdrawn") };
}

export async function createOrderAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const t = await getT("errors.student");
  const productId = String(fd.get("product_id") ?? "");
  const quantity = Math.max(1, Math.min(20, Number(fd.get("quantity") ?? 1) || 1));
  const address = String(fd.get("delivery_address") ?? "").trim();
  const slip = String(fd.get("slip_url") ?? "");
  if (address.length < 10) return { error: t("address") };
  if (!slip.startsWith(`${user.id}/`)) return { error: t("slipFirst") };
  const { data: product } = await supabase.from("products").select("id, is_active").eq("id", productId).maybeSingle();
  if (!product?.is_active) return { error: t("itemUnavailable") };
  const { error } = await supabase.from("orders").insert({ student_id: user.id, product_id: productId, quantity, delivery_address: address.slice(0, 500), slip_url: slip });
  if (error) return { error: t("orderFailed") };
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: t("orderPlaced") };
}

const profileSchema = z.object({
  full_name: z.string().trim().min(3).max(120),
  school: z.string().trim().max(120).optional().default(""),
  district: z.string().trim().max(60).optional().default(""),
  town: z.enum(TOWNS),
  address: z.string().trim().min(8).max(300),
  city: z.string().trim().min(2).max(80),
  postal_code: z.string().trim().regex(/^(\d{5})?$/).optional().default(""),
});

export async function updateProfileAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const t = await getT("errors.student");
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: t("profileInvalid") };
  const { error } = await supabase.from("profiles")
    .update({
      full_name: parsed.data.full_name, school: parsed.data.school || null, district: parsed.data.district || null, town: parsed.data.town,
      address: parsed.data.address, city: parsed.data.city, postal_code: parsed.data.postal_code || null,
    })
    .eq("id", user.id);
  if (error) return { error: t("profileFailed") };
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: t("profileSaved") };
}

export async function changePasswordAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const t = await getT("errors.student");
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (next.length < 8) return { error: t("passwordShort") };
  if (next !== confirm) return { error: t("passwordMismatch") };
  const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email!, password: current });
  if (authErr) return { error: t("passwordWrong") };
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: /different|same/i.test(error.message) ? t("passwordSame") : t("passwordFailed") };
  return { ok: true, message: t("passwordChanged") };
}
