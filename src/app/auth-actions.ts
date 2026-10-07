"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/db/server";
import { createAdminClient } from "@/lib/db/admin";
import { AL_YEARS, TOWNS } from "@/lib/constants";
import { createCaptcha, verifyCaptcha } from "@/lib/captcha";
import type { ActionState } from "@/lib/types";
import { getT } from "@/i18n/server";
import type { T } from "@/i18n/translate";
import { mobileToEmail, normalizeMobile, normalizeNic } from "@/lib/utils";

const registerSchema = (t: T) =>
  z
    .object({
      first_name: z.string().trim().min(1, t("auth.firstName")).max(60),
      last_name: z.string().trim().min(1, t("auth.lastName")).max(60),
      mobile: z.string().transform((v, ctx) => {
        const n = normalizeMobile(v);
        if (!n) ctx.addIssue({ code: "custom", message: t("auth.mobile") });
        return n ?? "";
      }),
      nic: z.string().transform((v, ctx) => {
        const n = normalizeNic(v);
        if (!n) ctx.addIssue({ code: "custom", message: t("auth.nic") });
        return n ?? "";
      }),
      al_year: z.coerce.number().refine((y) => (AL_YEARS as readonly number[]).includes(y), t("auth.alYear")),
      town: z.enum(TOWNS, { errorMap: () => ({ message: t("auth.town") }) }),
      school: z.string().trim().min(2, t("auth.school")).max(120),
      district: z.string().trim().min(2, t("auth.district")).max(60),
      address: z.string().trim().min(8, t("auth.address")).max(300),
      city: z.string().trim().min(2, t("auth.city")).max(80),
      postal_code: z.string().trim().regex(/^(\d{5})?$/, t("auth.postal")).optional(),
      password: z.string().min(8, t("auth.password")).max(72),
      confirm: z.string(),
      captcha: z.string().optional(),
      captcha_token: z.string().optional(),
    })
    .refine((d) => d.password === d.confirm, { path: ["confirm"], message: t("auth.mismatch") });

function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

/** Fresh security question for the register form ("refresh" button / after a failed attempt). */
export async function newCaptchaAction() {
  return createCaptcha();
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getT("errors");
  const parsed = registerSchema(t).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t("generic.fixFields"), fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (!verifyCaptcha(d.captcha_token ?? "", d.captcha ?? "")) {
    return { error: t("generic.fixFields"), fieldErrors: { captcha: t("auth.captcha") } };
  }
  const full_name = `${d.first_name} ${d.last_name}`.replace(/\s+/g, " ").trim();

  const admin = createAdminClient();
  const { data: dup, error: dupErr } = await admin
    .from("profiles").select("mobile, nic").or(`mobile.eq.${d.mobile},nic.eq.${d.nic}`).limit(2);
  if (dupErr) return { error: t("generic.dbNotReady") };
  if (dup?.length) {
    const fe: Record<string, string> = {};
    if (dup.some((r) => r.mobile === d.mobile)) fe.mobile = t("auth.mobileTaken");
    if (dup.some((r) => r.nic === d.nic)) fe.nic = t("auth.nicTaken");
    return { error: t("auth.exists"), fieldErrors: fe };
  }

  // Students sign in with their mobile number; we map it to an internal e-mail so no SMS/e-mail
  // provider is needed (zero cost). The account is confirmed immediately via the service role.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: mobileToEmail(d.mobile),
    password: d.password,
    email_confirm: true,
    user_metadata: {
      full_name, mobile: d.mobile, nic: d.nic, al_year: String(d.al_year),
      town: d.town, school: d.school, district: d.district,
      address: d.address, city: d.city, postal_code: d.postal_code ?? "",
    },
  });
  if (createErr || !created?.user) {
    return { error: createErr && /already/i.test(createErr.message) ? t("auth.mobileTaken") : t("auth.createFailed") };
  }
  // Belt & braces: make sure the delivery address lands on the profile even if the signup trigger predates it.
  await admin.from("profiles").update({ address: d.address, city: d.city, postal_code: d.postal_code || null }).eq("id", created.user.id);

  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email: mobileToEmail(d.mobile), password: d.password });
  if (signInErr) return { ok: true, message: t("auth.created") };
  redirect("/dashboard?welcome=1");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getT("errors.auth");
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!identifier || !password) return { error: t("missingCredentials") };

  let email = identifier.toLowerCase();
  if (!identifier.includes("@")) {
    const mobile = normalizeMobile(identifier);
    if (!mobile) return { error: t("badIdentifier") };
    email = mobileToEmail(mobile);
  }

  const supabase = await createClient();
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });
  // Copy-pasted passwords often carry stray spaces: retry once with the trimmed value.
  if (error && password.trim() !== password && password.trim()) {
    ({ data, error } = await supabase.auth.signInWithPassword({ email, password: password.trim() }));
  }
  if (error || !data.user) {
    const invalid = error?.code === "invalid_credentials" || /invalid login credentials/i.test(error?.message ?? "");
    if (error && !invalid) console.error("[login] Supabase auth error:", error.status, error.code, error.message);
    return { error: invalid || !error ? t("badCredentials") : t("serviceError") };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : null;
  if (profile?.role === "admin") redirect(safeNext?.startsWith("/admin") ? safeNext : "/admin");
  redirect(safeNext ?? "/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
