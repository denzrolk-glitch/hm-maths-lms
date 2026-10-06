import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, TrendingUp, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Reveal } from "@/components/motion";
import { FilterTabs, Leaderboard, type BoardRow } from "@/components/leaderboard";
import { RankTile, ScoreRing } from "@/components/portal/progress-widgets";
import { grade, pct, SCOPES, scopeTown, type Paper } from "@/lib/papers";
import { getPaperBoard } from "@/lib/paper-data";
import { getFormat, getT } from "@/i18n/server";

const file = (p: string | null) => (p ? `/api/files/papers?path=${encodeURIComponent(p)}` : null);

export default async function PaperResultPage({ params, searchParams }: { params: Promise<{ paperId: string }>; searchParams: Promise<{ scope?: string }> }) {
  const [{ paperId }, { scope: rawScope }] = await Promise.all([params, searchParams]);
  const { supabase, user, profile } = await requireUser();
  const [t, tc, f] = await Promise.all([getT("portal.papers"), getT("common"), getFormat()]);
  const { data } = await supabase.from("papers").select("*").eq("id", paperId).maybeSingle();
  if (!data) notFound();
  const paper = data as Paper;
  const total = Number(paper.total_marks);
  const town = scopeTown(rawScope);
  const scope = town ?? "island";

  const [{ data: mineRow }, board, island, local] = await Promise.all([
    supabase.from("paper_marks").select("marks, remark").eq("paper_id", paperId).eq("student_id", user.id).maybeSingle(),
    getPaperBoard(supabase, paperId, town, 100),
    getPaperBoard(supabase, paperId, null, 500),
    profile.town ? getPaperBoard(supabase, paperId, profile.town, 500) : Promise.resolve([]),
  ]);
  const mine = mineRow ? { marks: Number(mineRow.marks), remark: (mineRow.remark as string | null) ?? null } : null;
  const meIsland = island.find((r) => r.is_me);
  const meTown = local.find((r) => r.is_me);
  const entrants = island[0]?.entrants ?? 0;
  const ahead = meIsland && entrants > 1 ? Math.round((island.filter((r) => r.marks < meIsland.marks).length / (entrants - 1)) * 100) : null;
  const avg = island.length ? island.reduce((s, r) => s + r.marks, 0) / island.length : 0;

  const rows: BoardRow[] = board.map((r, i) => ({
    key: `${r.student_code ?? i}-${i}`, rank: r.rank, name: r.full_name, isMe: r.is_me,
    sub: [r.student_code, tc(`towns.${r.town}`)].filter(Boolean).join(" · "),
    side: r.school ?? undefined, main: `${r.marks}`, mainLabel: `${r.pct}%`,
  }));
  const tabs = SCOPES.map((s) => ({ value: s, label: s === "island" ? t("scope.island") : tc(`towns.${s}`), href: `/dashboard/papers/${paperId}${s === "island" ? "" : `?scope=${s}`}` }));

  return (
    <div className="space-y-6">
      <Link href="/dashboard/papers" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"><ArrowLeft className="h-4 w-4" /> {t("back")}</Link>
      <PageHeader title={paper.title} icon={FileText}
        description={[f.date(paper.paper_date), tc(`paperTypes.${paper.paper_type}`), t("outOf", { total })].join(" · ")}>
        {file(paper.paper_path) && <a href={file(paper.paper_path)!} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium hover:bg-accent"><Download className="h-4 w-4" /> {t("paperFile")}</a>}
        {file(paper.answers_path) && <a href={file(paper.answers_path)!} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium hover:bg-accent"><Download className="h-4 w-4" /> {t("answersFile")}</a>}
      </PageHeader>
      {paper.description && <p className="-mt-3 max-w-3xl text-sm text-muted-foreground">{paper.description}</p>}

      <Reveal>
        <Card className="overflow-hidden">
          <CardContent className="grid grid-cols-1 items-center gap-5 p-5 md:grid-cols-[auto_1fr]">
            {mine ? (
              <>
                <div className="flex flex-col items-center">
                  <ScoreRing value={pct(mine.marks, total)} size={148} label={t("marksOf", { marks: mine.marks, total })} sub={`${t("grade")} ${grade(pct(mine.marks, total))}`} />
                  {mine.remark && <p className="mt-2 max-w-[180px] text-center text-xs text-muted-foreground">“{mine.remark}”</p>}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <RankTile label={t("islandRank")} rank={meIsland?.rank ?? null} of={entrants} />
                  <RankTile icon="pin" tone="sky" label={t("townRank", { town: profile.town ? tc(`towns.${profile.town}`) : "" })} rank={meTown?.rank ?? null} of={local[0]?.entrants} />
                  <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-soft">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md"><TrendingUp className="h-5 w-5" /></span>
                    <div><p className="text-xs text-muted-foreground">{t("ahead")}</p><p className="font-display text-xl font-bold">{ahead === null ? tc("dash") : `${ahead}%`}</p></div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-soft">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 text-white shadow-md"><Trophy className="h-5 w-5" /></span>
                    <div><p className="text-xs text-muted-foreground">{t("classAvg")}</p><p className="font-display text-xl font-bold">{island.length ? `${pct(avg, total)}%` : tc("dash")}</p></div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground md:col-span-2">{t("noMarkYet")}</p>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Trophy className="h-5 w-5 text-amber-500" /> {t("board")}</h2>
          <FilterTabs id="paper-scope" items={tabs} active={scope} />
        </div>
        <Leaderboard rows={rows} emptyLabel={t("boardEmpty")} youLabel={t("you")} />
      </section>
    </div>
  );
}
