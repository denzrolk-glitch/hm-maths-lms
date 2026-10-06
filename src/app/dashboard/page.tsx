import Link from "next/link";
import {
  BookOpen, CalendarClock, ClipboardList, CreditCard, HelpCircle, MessageCircle, PlayCircle, Radio, ShoppingBag, Truck, Users,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyEnrollments, getNotices, getUpcomingLive } from "@/lib/data";
import { NoticeTagBadge, StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { NoticesRealtime } from "@/components/notices-realtime";
import { BannerCarousel } from "@/components/portal/banner-carousel";
import { Gauge, ResultsChart } from "@/components/portal/charts";
import { getFormat, getT } from "@/i18n/server";
import { SITE } from "@/content/site";
import { currentMonth, whatsappLink } from "@/lib/utils";

export async function generateMetadata() {
  return { title: (await getT("portal.nav"))("dashboard") };
}

function MoreLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200">{label}</Link>;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const { supabase, user, profile } = await requireUser();
  const [t, tc, f] = await Promise.all([getT("portal.dashboard"), getT("common"), getFormat()]);
  const month = currentMonth();
  const [enrollments, notices, live, subs, orders] = await Promise.all([
    getMyEnrollments(supabase, user.id),
    getNotices(supabase, 3),
    getUpcomingLive(supabase, 4),
    supabase.from("exam_submissions").select("score, total_marks, status, submitted_at, exams(title)")
      .eq("student_id", user.id).in("status", ["submitted", "graded"]).order("submitted_at", { ascending: false }).limit(8),
    supabase.from("orders").select("id, status, created_at, products(title)").eq("student_id", user.id).order("created_at", { ascending: false }).limit(3),
  ]);
  const thisMonth = enrollments.filter((e) => e.month === month && e.status === "approved" && e.classes);
  const pending = enrollments.filter((e) => e.status !== "approved").slice(0, 3);
  const firstName = profile.full_name.split(" ")[0];

  type Sub = { score: number | null; total_marks: number | null; submitted_at: string | null; exams: { title: string } | null };
  const results = ((subs.data ?? []) as unknown as Sub[])
    .filter((s) => s.score !== null && s.total_marks)
    .map((s) => ({ title: s.exams?.title ?? "", value: Math.round((Number(s.score) / Number(s.total_marks)) * 100) }))
    .reverse()
    .map((r, i) => ({ ...r, label: t("paperN", { n: i + 1 }) }));
  const avg = results.length ? results.reduce((a, r) => a + r.value, 0) / results.length : 0;
  type Ord = { id: string; status: string; created_at: string; products: { title: string } | null };
  const ords = (orders.data ?? []) as unknown as Ord[];

  const tiles: { href: string; label: string; icon: LucideIcon; tone: string }[] = [
    { href: "/dashboard/classes", label: t("tiles.classes"), icon: BookOpen, tone: "text-teal-600 bg-teal-50" },
    { href: "/dashboard/exams", label: t("tiles.exams"), icon: ClipboardList, tone: "text-orange-600 bg-orange-50" },
    { href: "/dashboard/payments", label: t("tiles.payments"), icon: CreditCard, tone: "text-violet-600 bg-violet-50" },
    { href: "/dashboard/store", label: t("tiles.store"), icon: ShoppingBag, tone: "text-pink-600 bg-pink-50" },
  ];
  const wa = whatsappLink(SITE.contact.whatsapp, t("support.waText", { id: profile.student_id ?? "" })) ?? "#";
  const support: { href: string; label: string; icon: LucideIcon; cls: string; external?: boolean }[] = [
    { href: SITE.channels[0]?.url ?? wa, label: t("support.channel"), icon: Users, cls: "bg-amber-50 text-amber-700 hover:bg-amber-100", external: true },
    { href: "/#support", label: t("support.faq"), icon: HelpCircle, cls: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
    { href: "/dashboard/free-zone", label: t("support.tutorials"), icon: PlayCircle, cls: "bg-pink-50 text-pink-700 hover:bg-pink-100" },
    { href: wa, label: t("support.contact"), icon: MessageCircle, cls: "bg-violet-50 text-violet-700 hover:bg-violet-100", external: true },
  ];

  return (
    <div className="space-y-5">
      <NoticesRealtime />
      <PageHeader title={t("welcome", { name: firstName })}
        description={[profile.student_id ?? tc("idCard.admin"), tc(`towns.${profile.town}`), profile.al_year ? tc("alBatch", { year: profile.al_year }) : null].filter(Boolean).join(" · ")} />
      {welcome && <Alert variant="success" className="bg-white">{t("welcomeNew", { name: firstName, id: profile.student_id ?? "" })}</Alert>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.55fr]">
        <div className="grid grid-cols-2 gap-4">
          {tiles.map(({ href, label, icon: Icon, tone }) => (
            <Link key={href} href={href} className="group flex min-h-[112px] flex-col justify-between rounded-2xl bg-card border border-border p-5 shadow-[0_3px_4px_rgba(0,0,0,.03)] transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
              <span className="mt-3 font-display text-[15px] font-semibold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400">{label}</span>
            </Link>
          ))}
        </div>
        <BannerCarousel />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.55fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-4 w-4 text-teal-600" /> {t("upcoming")}</CardTitle>
              <MoreLink href="/dashboard/classes" label={tc("actions.more")} />
            </CardHeader>
            <CardContent className="space-y-2">
              {live.length ? live.map((l) => (
                <Link key={l.id} href={`/dashboard/classes/${l.class_id}?month=${l.month}#live`} className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-white/10 p-3 transition hover:border-teal-500/40 hover:bg-teal-50/40 dark:hover:bg-teal-950/20">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500"><Radio className="h-4 w-4" /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{l.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{l.classes?.title} · {f.dateTime(l.live_start_time)}</span>
                  </span>
                </Link>
              )) : <p className="py-2 text-sm text-muted-foreground">{t("noUpcoming")}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-teal-600" /> {t("paymentStatus")}</CardTitle>
              <MoreLink href="/dashboard/payments" label={tc("actions.more")} />
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.length || ords.length ? (
                <>
                  {pending.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-sm">
                      <span className="min-w-0 truncate">{e.classes?.title} · {f.month(e.month)}</span><StatusBadge status={e.status} />
                    </div>
                  ))}
                  {ords.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-white/5 p-3 text-sm">
                      <span className="min-w-0 truncate">{o.products?.title ?? t("order")}</span><StatusBadge status={o.status} />
                    </div>
                  ))}
                </>
              ) : <p className="py-2 text-sm text-muted-foreground">{t("noPending")}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-teal-600" /> {t("thisMonth", { month: f.month(month) })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {thisMonth.length ? thisMonth.map((e) => (
                <Link key={e.id} href={`/dashboard/classes/${e.class_id}?month=${e.month}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-white/10 p-3 text-sm font-medium transition hover:border-teal-500/40">
                  <span className="truncate">{e.classes!.title}</span><span className="text-xs font-semibold text-teal-600 dark:text-teal-400">{t("open")} →</span>
                </Link>
              )) : (
                <div className="py-2 text-sm text-muted-foreground">
                  {t("noClasses")} <Link href="/dashboard/store" className="font-semibold text-teal-600 hover:underline">{t("enrollNow")}</Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("results")}</CardTitle>
              <p className="text-xs text-slate-400">{t("resultsHint")}</p>
            </CardHeader>
            <CardContent className="pb-10">
              <ResultsChart data={results} emptyLabel={t("noResults")} />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("average")}</CardTitle></CardHeader>
              <CardContent className="pt-2"><Gauge value={avg} label={t("averageLabel", { n: results.length })} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{t("support.title")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {support.map(({ href, label, icon: Icon, cls, external }) => (
                  <a key={label} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${cls}`}>
                    <Icon className="h-4 w-4" /> {label}
                  </a>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{t("notices")}</CardTitle>
              <MoreLink href="/dashboard/notices" label={tc("actions.viewAll")} />
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {notices.length ? notices.map((n) => (
                <div key={n.id} className="rounded-xl bg-slate-50 dark:bg-white/5 p-3">
                  <div className="flex items-center gap-2"><NoticeTagBadge tag={n.tag} />{n.is_pinned && <span className="text-xs">📌</span>}</div>
                  <p className="mt-1.5 line-clamp-1 text-sm font-semibold">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.content}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground sm:col-span-3">{t("noNotices")}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
