import { TOWNS, type Town } from "./constants";

export const PAPER_TYPES = ["weekly", "monthly", "model", "term"] as const;
export type PaperType = (typeof PAPER_TYPES)[number];

export interface Paper {
  id: string;
  title: string;
  description: string | null;
  paper_type: PaperType;
  class_id: string | null;
  al_year: number | null;
  paper_date: string; // YYYY-MM-DD
  total_marks: number;
  paper_path: string | null;
  answers_path: string | null;
  is_published: boolean;
  created_at: string;
}

export interface PaperLeaderRow {
  rank: number; student_code: string | null; full_name: string; town: Town; school: string | null;
  marks: number; total_marks: number; pct: number; is_me: boolean; entrants: number;
}

export interface OverallLeaderRow {
  rank: number; student_code: string | null; full_name: string; town: Town; school: string | null;
  points: number; papers: number; avg_pct: number; best_pct: number; is_me: boolean; entrants: number;
}

export interface PaperStats {
  papers?: number;
  avg_pct?: number;
  best_pct?: number;
  points?: number;
  full_marks?: number;
  streak: number;
  best_streak: number;
  town: Town | null;
  al_year: number | null;
  last: null | {
    paper_id: string; title: string; paper_date: string; paper_type: PaperType;
    marks: number; total_marks: number; pct: number;
    rank_island: number; entrants_island: number; rank_town: number; entrants_town: number;
  };
}

/** Leaderboard scopes shown as tabs: all-island + every class center. */
export const SCOPES = ["island", ...TOWNS] as const;
export const scopeTown = (s: string | undefined): Town | null => (TOWNS as readonly string[]).includes(s ?? "") ? (s as Town) : null;

export const PERIODS = ["week", "month", "year", "all"] as const;
export type Period = (typeof PERIODS)[number];

/** Sri Lanka "today" as YYYY-MM-DD. */
export function colomboToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Date range for a leaderboard period (week = Monday → today). */
export function periodRange(p: Period, now = new Date()): { from: string | null; to: string | null } {
  const today = colomboToday(now);
  const [y, m, d] = today.split("-").map(Number);
  if (p === "all") return { from: null, to: null };
  if (p === "year") return { from: `${y}-01-01`, to: today };
  if (p === "month") return { from: `${y}-${String(m).padStart(2, "0")}-01`, to: today };
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7)); // back to Monday
  return { from: dt.toISOString().slice(0, 10), to: today };
}

export function pct(marks: number, total: number) {
  return total > 0 ? Math.round((marks / total) * 1000) / 10 : 0;
}

/** Letter grade used on result cards (A/L style). */
export function grade(p: number): "A" | "B" | "C" | "S" | "F" {
  return p >= 75 ? "A" : p >= 65 ? "B" : p >= 50 ? "C" : p >= 35 ? "S" : "F";
}

export type BadgeKey = "firstPaper" | "streak3" | "streak5" | "streak10" | "top10" | "champion" | "townChampion" | "fullMarks" | "score90" | "study7" | "papers10";

/** Achievements unlocked from paper stats + daily study streak. */
export function achievements(s: PaperStats | null, study: { best: number } | null): { key: BadgeKey; unlocked: boolean }[] {
  const n = s?.papers ?? 0;
  const best = s?.best_streak ?? 0;
  const last = s?.last;
  return [
    { key: "firstPaper", unlocked: n >= 1 },
    { key: "streak3", unlocked: best >= 3 },
    { key: "streak5", unlocked: best >= 5 },
    { key: "streak10", unlocked: best >= 10 },
    { key: "score90", unlocked: (s?.best_pct ?? 0) >= 90 },
    { key: "fullMarks", unlocked: (s?.full_marks ?? 0) >= 1 },
    { key: "top10", unlocked: !!last && last.rank_island <= 10 },
    { key: "townChampion", unlocked: !!last && last.rank_town === 1 },
    { key: "champion", unlocked: !!last && last.rank_island === 1 },
    { key: "papers10", unlocked: n >= 10 },
    { key: "study7", unlocked: (study?.best ?? 0) >= 7 },
  ];
}
