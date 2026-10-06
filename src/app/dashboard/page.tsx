import Link from "next/link";
import {
  ArrowRight, BookOpen, CalendarClock, CreditCard, FileText, HelpCircle, MessageCircle, PlayCircle, Radio, ShoppingBag, Sparkles, Trophy, Truck, Users,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyEnrollments, getNotices, getUpcomingLive, liveWindow } from "@/lib/data";
import { NoticeTagBadge, StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { CopyButton } from "@/components/copy-button";
import { NoticesRealtime } from "@/components/notices-realtime";
import { BannerCarousel } from "@/components/portal/banner-carousel";
import { Gauge, ResultsChart } from "@/components/portal/charts";
import { RankTile, ScoreRing, StreakPanel } from "@/components/portal/progress-widgets";
import { getMyPapers, getPaperStats, getStudyStreak } from "@/lib/paper-data";
import { grade, pct } from "@/lib/papers";
import { getFormat, getT } from "@/i18n/server";
import { SITE } from "@/content/site";
import { cn, currentMonth, whatsappLink } from "@/lib/utils";

export async function generateMetadata() {
  return { title: (await getT("portal.nav"))("dashboard") };
}

function MoreLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-primary hover:text-primary-foreground">{label} <ArrowRight className="h-3 w-3" /></Link>;
}

function greetingKey() {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Colombo", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const { supabase, user, profile } = await requireUser();
  const [t, tc, f] = await Promise.all([getT("portal.dashboard"), getT("common"), getFormat()]);
  const month = currentMonth();
  const [enrollments, notices, live, orders, stats, study, papers] = await Promise.all([
    getMyEnrollments(supabase, user.id),
    getNotices(supabase, 3),
    getUpcomingLive(supabase, 4),
    supabase.from("orders").select("id, status, created_at, products(title)").eq("student_id", user.id).order("created_at", { ascending: false }).limit(3),
    getPaperStats(supabase),
    getStudyStreak(supabase),
    getMyPapers(supabase, user.id, profile.al_year ?? null),
  ]);
  const thisMonth = enrollments.filter((e) => e.month === month && e.status === "approved" && e.classes);
  const pending = enrollments.filter((e) => e.status !== "approved").slice(0, 3);
  const firstName = profile.full_name.split(" ")[0];
  const next = live[0] ?? null;
  const nextOpen = next ? liveWindow(next, next.classes?.duration_minutes)?.open : false;

  const sat = papers.filter((p) => p.mine).slice(0, 8).reverse();
  const results = sat.map((p, i) => ({ title: p.title, value: Math.round(pct(p.mine!.marks, p.total_marks)), label: t("paperN", { n: i + 1 }) }));
  const avg = stats?.avg_pct ?? 0;
  const last = stats?.last ?? null;
  type Ord = { id: string; status: string; created_at: string; products: { title: string } | null };
  const ords = (orders.data ?? []) as unknown as Ord[];

  const tiles: { href: string; label: string; hint: string; icon: LucideIcon; tone: string }[] = [
    { href: "/dashboard/classes", label: t("tiles.classes"), hint: t("tiles.classesHint", { n: thisMonth.length }), icon: BookOpen, tone: "from-teal-500 to-teal-700 shadow-teal-500/30" },
    { href: "/dashboard/papers", label: t("tiles.papers"), hint: t("tiles.papersHint", { n: stats?.papers ?? 0 }), icon: FileText, tone: "from-brand-400 to-brand-600 shadow-brand-500/30" },
    { href: "/dashboard/leaderboard", label: t("tiles.leaderboard"), hint: last ? t("tiles.leaderboardHint", { rank: last.rank_island }) : t("tiles.leaderboardNone"), icon: Trophy, tone: "from-amber-400 to-orange-500 shadow-amber-500/30" },
    { href: "/dashboard/store", label: t("tiles.store"), hint: t("tiles.storeHint"), icon: ShoppingBag, tone: "from-violet-500 to-indigo-600 shadow-violet-500/30" },
  ];
  const wa = whatsappLink(SITE.contact.whatsapp, t("support.waText", { id: profile.student_id ?? "" })) ?? "#";
  const support: { href: string; label: string; icon: LucideIcon; cls: string; external?: boolean }[] = [
    { href: SITE.channels[0]?.url ?? wa, label: t("support.channel"), icon: Users, cls: "from-amber-400 to-orange-500", external: true },
    { href: "/#support", label: t("support.faq"), icon: HelpCircle, cls: "from-emerald-400 to-emerald-600" },
    { href: "/dashboard/free-zone", label: t("support.tutorials"), icon: PlayCircle, cls: "from-rose-400 to-pink-600" },
    { href: wa, label: t("support.contact"), icon: MessageCircle, cls: "from-teal-500 to-brand-500", external: true },
  ];

  return (
    <div className="space-y-6">
      <NoticesRealtime />
      {welcome && <Alert variant="success">{t("welcomeNew", { name: firstName, id: profile.student_id ?? "" })}</Alert>}

      {/* Hero */}
      <Reveal>
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-teal-700 via-teal-600 to-brand-500 p-6 text-white shadow-lift sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 animate-blob rounded-full bg-brand-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 animate-blob rounded-full bg-white/10 blur-3xl [animation-delay:-6s]" />
          <span className="pointer-events-none absolute -right-2 bottom-0 select-none font-display text-[10rem] font-black leading-none text-white/10">∑</span>
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-medium text-white/80"><Sparkles className="h-4 w-4" /> {t(`greeting.${greetingKey()}`)}</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t("welcome", { name: firstName })}</h1>
              <p className="mt-2 max-w-xl text-sm text-white/80">{t("heroText")}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                {profile.student_id && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 py-1 pl-3 pr-1 font-semibold backdrop-blur [&_button]:text-white [&_button:hover]:bg-white/20">
                    {profile.student_id} <CopyButton value={profile.student_id} />
                  </span>
                )}
                {profile.town && <span className="rounded-full bg-white/15 px-3 py-1.5 font-semibold backdrop-blur">{tc(`towns.${profile.town}`)}</span>}
                {profile.al_year && <span className="rounded-full bg-white/15 px-3 py-1.5 font-semibold backdrop-blur">{tc("alBatch", { year: profile.al_year })}</span>}
              </div>
            </div>
            <div className="w-full rounded-2xl bg-white/12 p-4 ring-1 ring-white/20 backdrop-blur-md lg:w-80">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/75"><Radio className={cn("h-3.5 w-3.5", nextOpen && "animate-pulse text-rose-200")} /> {t("nextClass")}</p>
              {next ? (
                <>
                  <p className="mt-1 truncate font-display text-lg font-bold">{next.title}</p>
                  <p className="truncate text-xs text-white/80">{next.classes?.title} · {f.dateTime(next.live_start_time)}</p>
                  <Link href={`/dashboard/classes/${next.class_id}?month=${next.month}#live`} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-teal-700 shadow-md transition hover:-translate-y-px">
                    {nextOpen ? t("joinNow") : t("open")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-white/85">{t("noUpcoming")}</p>
                  <Link href="/dashboard/store" className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-teal-700 shadow-md transition hover:-translate-y-px">{t("browseClasses")} <ArrowRight className="h-4 w-4" /></Link>
                </>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Quick tiles */}
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ href, label, hint, icon: Icon, tone }) => (
          <StaggerItem key={href}>
            <Link href={href} className="group relative flex h-full min-h-[128px] flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift">
              <span className={cn("pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-10 transition duration-500 group-hover:scale-150", tone)} />
              <span className={cn("grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition group-hover:rotate-6 group-hover:scale-105", tone)}><Icon className="h-5 w-5" /></span>
              <span className="mt-3">
                <span className="flex items-center gap-1 font-display text-[15px] font-semibold group-hover:text-primary">{label} <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" /></span>
                <span className="block truncate text-xs text-muted-foreground">{hint}</span>
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal><StreakPanel paper={{ current: stats?.streak ?? 0, best: stats?.best_streak ?? 0 }} study={study} /></Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.45fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> {t("latestResult")}</CardTitle>
              <MoreLink href="/dashboard/papers" label={tc("actions.more")} />
            </CardHeader>
            <CardContent>
              {last ? (
                <Link href={`/dashboard/papers/${last.paper_id}`} className="flex items-center gap-4">
                  <ScoreRing value={last.pct} size={112} stroke={10} label={`${last.marks}/${last.total_marks}`} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="truncate font-semibold">{last.title}</p>
                    <p className="text-xs text-muted-foreground">{f.date(last.paper_date)}</p>
                    <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                      <span className="rounded-full bg-accent px-2.5 py-1 text-accent-foreground">{t("gradeLabel", { g: grade(last.pct) })}</span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{t("islandRank", { rank: last.rank_island, n: last.entrants_island })}</span>
                    </div>
                  </div>
                </Link>
              ) : <p className="py-2 text-sm text-muted-foreground">{t("noLatest")}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-4 w-4 text-primary" /> {t("upcoming")}</CardTitle>
              <MoreLink href="/dashboard/classes" label={tc("actions.more")} />
            </CardHeader>
            <CardContent className="space-y-2">
              {live.length ? live.map((l) => (
                <Link key={l.id} href={`/dashboard/classes/${l.class_id}?month=${l.month}#live`} className="flex items-center gap-3 rounded-2xl border border-border/70 p-3 transition hover:-translate-y-px hover:border-primary/40 hover:bg-accent/50">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-500/10"><Radio className="h-4 w-4" /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{l.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{l.classes?.title} · {f.dateTime(l.live_start_time)}</span>
                  </span>
                </Link>
              )) : <p className="py-2 text-sm text-muted-foreground">{t("noUpcoming")}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" /> {t("thisMonth", { month: f.month(month) })}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {thisMonth.length ? thisMonth.map((e) => (
                <Link key={e.id} href={`/dashboard/classes/${e.class_id}?month=${e.month}`} className="group flex items-center justify-between gap-3 rounded-2xl border border-border/70 p-3 text-sm font-medium transition hover:border-primary/40 hover:bg-accent/50">
                  <span className="truncate">{e.classes!.title}</span><span className="flex items-center gap-1 text-xs font-semibold text-primary">{t("open")} <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" /></span>
                </Link>
              )) : (
                <div className="py-2 text-sm text-muted-foreground">
                  {t("noClasses")} <Link href="/dashboard/store" className="font-semibold text-primary hover:underline">{t("enrollNow")}</Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-primary" /> {t("paymentStatus")}</CardTitle>
              <MoreLink href="/dashboard/payments" label={tc("actions.more")} />
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.length || ords.length ? (
                <>
                  {pending.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 truncate"><CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" /> {e.classes?.title} · {f.month(e.month)}</span><StatusBadge status={e.status} />
                    </div>
                  ))}
                  {ords.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 truncate"><ShoppingBag className="h-4 w-4 shrink-0 text-muted-foreground" /> {o.products?.title ?? t("order")}</span><StatusBadge status={o.status} />
                    </div>
                  ))}
                </>
              ) : <p className="py-2 text-sm text-muted-foreground">{t("noPending")}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="h-[260px]"><BannerCarousel /></div>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{t("results")}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{t("resultsHint")}</p>
              </div>
              <MoreLink href="/dashboard/papers" label={t("myResults")} />
            </CardHeader>
            <CardContent className="pb-10"><ResultsChart data={results} emptyLabel={t("noResults")} /></CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("average")}</CardTitle></CardHeader>
              <CardContent className="pt-2"><Gauge value={avg} label={t("averageLabel", { n: stats?.papers ?? 0 })} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{t("ranksTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RankTile label={t("rankIsland")} rank={last?.rank_island ?? null} of={last?.entrants_island} href="/dashboard/leaderboard" tone="amber" />
                <RankTile icon="pin" tone="sky" label={profile.town ? tc(`towns.${profile.town}`) : t("rankTown")} rank={last?.rank_town ?? null} of={last?.entrants_town} href={`/dashboard/leaderboard?scope=${profile.town}`} />
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
                <div key={n.id} className="rounded-2xl border border-border/70 bg-gradient-to-br from-accent/60 to-card p-3 transition hover:-translate-y-px hover:shadow-soft">
                  <div className="flex items-center gap-2"><NoticeTagBadge tag={n.tag} />{n.is_pinned && <span className="text-xs">📌</span>}</div>
                  <p className="mt-1.5 line-clamp-1 text-sm font-semibold">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.content}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground sm:col-span-3">{t("noNotices")}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("support.title")}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {support.map(({ href, label, icon: Icon, cls, external }) => (
                <a key={label} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border/70 p-3 text-center text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow-soft">
                  <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md transition group-hover:scale-110", cls)}><Icon className="h-4 w-4" /></span>
                  {label}
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
