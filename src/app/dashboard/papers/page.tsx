import Link from "next/link";
import { Award, BarChart3, ChevronRight, Download, FileText, MapPin, Percent, Sparkles, Star, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { DateTile } from "@/components/date-tile";
import { ResultsChart } from "@/components/portal/charts";
import { Achievements, RankTile, ScoreRing, StreakPanel } from "@/components/portal/progress-widgets";
import { achievements, grade, normalizeStreaks, pct } from "@/lib/papers";
import { getMyPapers, getPaperStats } from "@/lib/paper-data";
import { getFormat, getT } from "@/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  return { title: (await getT("portal.nav"))("papers") };
}

const file = (p: string | null) => (p ? `/api/files/papers?path=${encodeURIComponent(p)}` : null);

export default async function MyPapersPage() {
  const { supabase, user, profile } = await requireUser();
  const [t, tc, f] = await Promise.all([getT("portal.papers"), getT("common"), getFormat()]);
  const [stats, papers] = await Promise.all([
    getPaperStats(supabase), getMyPapers(supabase, user.id, profile.al_year ?? null),
  ]);
  const last = stats?.last ?? null;
  const sat = papers.filter((p) => p.mine).slice(0, 10).reverse();
  const chart = sat.map((p, i) => ({ label: t("paperN", { n: i + 1 }), title: p.title, value: Math.round(pct(p.mine!.marks, p.total_marks)) }));
  const town = profile.town ? tc(`towns.${profile.town}`) : null;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} icon={FileText} eyebrow={t("eyebrow")}>
        <Link href="/dashboard/leaderboard" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:-translate-y-px"><Trophy className="h-4 w-4" /> {t("openLeaderboard")}</Link>
      </PageHeader>

      <Reveal><div id="streaks" className="scroll-mt-24"><StreakPanel streaks={normalizeStreaks(stats)} /></div></Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Reveal delay={0.05}>
          <Card className="h-full overflow-hidden">
            <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-brand-400 p-5 text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80"><Sparkles className="h-3.5 w-3.5" /> {t("latest")}</p>
              {last ? (
                <>
                  <p className="mt-1 truncate font-display text-xl font-bold">{last.title}</p>
                  <p className="text-xs text-white/80">{f.date(last.paper_date)} · {tc(`paperTypes.${last.paper_type}`)}</p>
                </>
              ) : <p className="mt-1 font-display text-xl font-bold">{t("noLatest")}</p>}
            </div>
            <CardContent className="p-5">
              {last ? (
                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  <ScoreRing value={last.pct} label={t("marksOf", { marks: last.marks, total: last.total_marks })} />
                  <div className="grid w-full flex-1 grid-cols-1 gap-3">
                    <RankTile label={t("islandRank")} rank={last.rank_island} of={last.entrants_island} href={`/dashboard/papers/${last.paper_id}`} />
                    <RankTile icon="pin" tone="sky" label={t("townRank", { town: town ?? "" })} rank={last.rank_town} of={last.entrants_town} href={`/dashboard/papers/${last.paper_id}?scope=${profile.town}`} />
                    <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">{t("grade")}</span>
                      <span className="font-display text-lg font-bold text-primary">{grade(last.pct)}</span>
                    </div>
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground">{t("noLatestText")}</p>}
            </CardContent>
          </Card>
        </Reveal>
        <Stagger className="grid grid-cols-2 gap-4">
          <StaggerItem><StatCard label={t("stats.sat")} value={stats?.papers ?? 0} icon={FileText} /></StaggerItem>
          <StaggerItem><StatCard label={t("stats.average")} value={stats?.papers ? `${stats.avg_pct}%` : tc("dash")} icon={Percent} tone="sky" /></StaggerItem>
          <StaggerItem><StatCard label={t("stats.best")} value={stats?.papers ? `${stats.best_pct}%` : tc("dash")} icon={Star} tone="amber" /></StaggerItem>
          <StaggerItem><StatCard label={t("stats.points")} value={Math.round(stats?.points ?? 0)} icon={Award} tone="violet" hint={t("stats.pointsHint")} /></StaggerItem>
        </Stagger>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" /> {t("progress")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("progressHint")}</p>
          </CardHeader>
          <CardContent className="pb-10"><ResultsChart data={chart} emptyLabel={t("noProgress")} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-primary" /> {t("achievements")}</CardTitle></CardHeader>
          <CardContent><Achievements items={achievements(stats)} /></CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">{t("all")}</h2>
        {papers.length ? (
          <Stagger className="space-y-2.5">
            {papers.map((p) => {
              const mine = p.mine;
              const v = mine ? pct(mine.marks, p.total_marks) : null;
              return (
                <StaggerItem key={p.id}>
                  <div className="group flex flex-wrap items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">
                    <DateTile date={p.paper_date} />
                    <Link href={`/dashboard/papers/${p.id}`} className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-semibold group-hover:text-primary">{p.title}</p>
                        <Badge>{tc(`paperTypes.${p.paper_type}`)}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{t("outOf", { total: p.total_marks })}{mine?.remark ? ` · ${mine.remark}` : ""}</p>
                    </Link>
                    <div className="flex items-center gap-2">
                      {file(p.paper_path) && <a href={file(p.paper_path)!} target="_blank" rel="noreferrer" title={t("paperFile")} className="grid h-9 w-9 place-items-center rounded-xl border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary"><Download className="h-4 w-4" /></a>}
                      {file(p.answers_path) && <a href={file(p.answers_path)!} target="_blank" rel="noreferrer" className="hidden h-9 items-center gap-1.5 rounded-xl border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary sm:inline-flex"><Download className="h-3.5 w-3.5" /> {t("answersFile")}</a>}
                      {mine ? (
                        <span className={cn("min-w-[72px] rounded-xl px-3 py-1.5 text-center font-display text-sm font-bold", v! >= 75 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : v! >= 50 ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300")}>
                          {mine.marks}/{p.total_marks}
                        </span>
                      ) : <span className="min-w-[72px] rounded-xl bg-muted px-3 py-1.5 text-center text-xs font-semibold text-muted-foreground">{t("notSat")}</span>}
                      <Link href={`/dashboard/papers/${p.id}`} aria-label={t("viewResult")}><ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" /></Link>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        ) : (
          <EmptyState icon={FileText} title={t("emptyTitle")} description={t("emptyText")} />
        )}
      </section>
    </div>
  );
}
