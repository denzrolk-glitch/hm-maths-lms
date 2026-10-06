import { CalendarDays, GraduationCap, IdCard, KeyRound, MapPin, School, ShieldCheck, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { StudentIdCard } from "@/components/student-id-card";
import { CopyButton } from "@/components/copy-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { getFormat, getT } from "@/i18n/server";
import { cn, initials } from "@/lib/utils";
import { PasswordForm, ProfileForm } from "./profile-forms";

export async function generateMetadata() {
  return { title: (await getT("portal.nav"))("profile") };
}

export default async function ProfilePage() {
  const { supabase, user, profile } = await requireUser();
  const [t, tc, f] = await Promise.all([getT("portal.profile"), getT("common"), getFormat()]);
  const [{ data: enr }, { data: subs }] = await Promise.all([
    supabase.from("enrollments").select("class_id").eq("student_id", user.id).eq("status", "approved"),
    supabase.from("exam_submissions").select("score, total_marks").eq("student_id", user.id).in("status", ["submitted", "graded"]),
  ]);
  const classes = new Set((enr ?? []).map((e) => e.class_id as string)).size;
  const scored = (subs ?? []).filter((s) => s.score !== null && Number(s.total_marks) > 0);
  const avg = scored.length ? Math.round(scored.reduce((a, s) => a + (Number(s.score) / Number(s.total_marks)) * 100, 0) / scored.length) : null;

  const fields = [profile.full_name, profile.mobile, profile.nic, profile.al_year, profile.school, profile.district];
  const pct = Math.round((fields.filter((v) => v !== null && v !== "").length / fields.length) * 100);

  const chips = [
    profile.al_year ? { icon: GraduationCap, text: tc("alBatch", { year: profile.al_year }) } : null,
    { icon: MapPin, text: tc(`towns.${profile.town}`) },
    profile.school ? { icon: School, text: profile.school } : null,
    { icon: CalendarDays, text: t("joined", { date: f.date(profile.created_at) }) },
  ].filter(Boolean) as { icon: typeof MapPin; text: string }[];

  const stats = [
    { label: t("stats.classes"), value: String(classes) },
    { label: t("stats.papers"), value: String(subs?.length ?? 0) },
    { label: t("stats.average"), value: avg === null ? tc("dash") : `${avg}%` },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {/* ── Hero ── */}
      <Card className="overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-[#17191e] via-[#1d2026] to-[#0f3d3a] sm:h-32">
          <div className="bg-hex absolute inset-0 opacity-70" />
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-teal-500/25 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-32 w-48 rounded-full bg-brand-500/15 blur-3xl" />
          <span className="absolute -bottom-8 right-6 select-none font-display text-[8rem] font-black leading-none text-white/5">∑</span>
        </div>
        <div className="relative px-5 pb-5 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="-mt-12 grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 font-display text-3xl font-bold text-white shadow-xl shadow-teal-900/20 ring-4 ring-card">
                {initials(profile.full_name)}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-display text-2xl font-bold">{profile.full_name}</h2>
                <div className="mt-1 flex items-center gap-1">
                  <span className="font-mono text-sm font-semibold tracking-wider text-teal-700 dark:text-teal-400">{profile.student_id ?? tc("idCard.admin")}</span>
                  {profile.student_id && <CopyButton value={profile.student_id} />}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {chips.map(({ icon: I, text }) => (
                    <span key={text} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <I className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{text}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border bg-muted/30 lg:min-w-[360px]">
              {stats.map((s) => (
                <div key={s.label} className="px-3 py-3 text-center">
                  <p className="font-display text-xl font-bold">{s.value}</p>
                  <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-muted/40 p-3">
            <div className="flex flex-col gap-0.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="font-semibold">{t("completeness", { pct })}</span>
              <span className="text-muted-foreground">{pct === 100 ? t("completeDone") : t("completeHint")}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-success" : "bg-gradient-to-r from-teal-500 to-teal-600")} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
        {/* ── ID card ── */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
          <Card id="id" className="scroll-mt-24">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"><IdCard className="h-4 w-4" /></span>
              <div>
                <CardTitle className="text-base">{t("idTitle")}</CardTitle>
                <CardDescription className="text-xs">{t("idHint", { date: f.date(profile.created_at) })}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <StudentIdCard profile={profile} />
              {profile.student_id && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-teal-500/40 bg-teal-50/50 p-3 dark:bg-teal-500/5">
                  <p className="text-xs text-muted-foreground">{t("idTip")}</p>
                  <CopyButton value={profile.student_id} label className="shrink-0" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Forms ── */}
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0 border-b">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"><UserRound className="h-4 w-4" /></span>
              <div>
                <CardTitle className="text-base">{t("details")}</CardTitle>
                <CardDescription className="text-xs">{t("detailsHint")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-5"><ProfileForm profile={profile} /></CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0 border-b">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"><KeyRound className="h-4 w-4" /></span>
              <div>
                <CardTitle className="text-base">{t("password")}</CardTitle>
                <CardDescription className="text-xs">{t("securityHint")}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 pt-5 xl:grid-cols-[1fr_220px]">
              <PasswordForm />
              <div className="h-fit rounded-xl bg-muted/40 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-success" /> {t("tipsTitle")}</p>
                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  {(t.raw<string[]>("tips") ?? []).map((tip) => (
                    <li key={tip} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />{tip}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
