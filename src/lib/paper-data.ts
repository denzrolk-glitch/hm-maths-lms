import "server-only";
import type { DbClient as SupabaseClient } from "@/lib/db/types";
import type { OverallLeaderRow, Paper, PaperLeaderRow, PaperStats } from "./papers";

const num = <T extends object>(r: T, keys: (keyof T)[]): T => {
  const o = { ...r } as Record<keyof T, unknown>;
  for (const k of keys) if (o[k] !== null && o[k] !== undefined) o[k] = Number(o[k]);
  return o as T;
};

export async function getPaperStats(supabase: SupabaseClient): Promise<PaperStats | null> {
  const { data, error } = await supabase.rpc("get_my_paper_stats");
  if (error || !data) return null;
  const s = data as PaperStats;
  if (s.last) s.last = num(s.last, ["marks", "total_marks", "pct", "rank_island", "entrants_island", "rank_town", "entrants_town"]);
  return num(s, ["papers", "avg_pct", "best_pct", "points", "full_marks", "streak", "best_streak"]);
}


export async function getPaperBoard(supabase: SupabaseClient, paperId: string, town: string | null, limit = 100): Promise<PaperLeaderRow[]> {
  const { data } = await supabase.rpc("get_paper_leaderboard", { p_paper: paperId, p_town: town, p_limit: limit });
  return ((data ?? []) as PaperLeaderRow[]).map((r) => num(r, ["rank", "marks", "total_marks", "pct", "entrants"]));
}

export async function getOverallBoard(supabase: SupabaseClient, f: { town?: string | null; year?: number | null; type?: string | null; from?: string | null; to?: string | null; limit?: number }): Promise<OverallLeaderRow[]> {
  const { data } = await supabase.rpc("get_overall_leaderboard", {
    p_town: f.town ?? null, p_year: f.year ?? null, p_type: f.type ?? null, p_from: f.from ?? null, p_to: f.to ?? null, p_limit: f.limit ?? 100,
  });
  return ((data ?? []) as OverallLeaderRow[]).map((r) => num(r, ["rank", "points", "papers", "avg_pct", "best_pct", "entrants"]));
}

/** Published papers for the student's batch (plus any paper they have marks in), newest first. */
export async function getMyPapers(supabase: SupabaseClient, userId: string, alYear: number | null) {
  const [{ data: papers }, { data: marks }] = await Promise.all([
    supabase.from("papers").select("*").order("paper_date", { ascending: false }).order("created_at", { ascending: false }).limit(120),
    supabase.from("paper_marks").select("paper_id, marks, remark").eq("student_id", userId),
  ]);
  const mine = new Map((marks ?? []).map((m) => [m.paper_id as string, { marks: Number(m.marks), remark: (m.remark as string | null) ?? null }]));
  return ((papers ?? []) as Paper[])
    .map((p) => ({ ...p, total_marks: Number(p.total_marks), mine: mine.get(p.id) ?? null }))
    .filter((p) => p.mine || !p.al_year || !alYear || p.al_year === alYear);
}
