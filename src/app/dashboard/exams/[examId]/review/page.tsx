import Link from "next/link";
import { ArrowLeft, CheckCircle2, Trophy, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { getFormat, getT } from "@/i18n/server";
import { dbError } from "@/i18n/translate";
import { cn } from "@/lib/utils";

type ReviewQ = { id: string; question_text: string; options: string[]; marks: number; correct_answer: number; explanation: string | null; your_answer: number | null };
type Review = { score: number; total: number; submitted_at: string; is_late: boolean; questions: ReviewQ[] };

export default async function ReviewPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const { supabase } = await requireUser();
  const [t, tr, f] = await Promise.all([getT("portal.review"), getT(), getFormat()]);
  const [{ data, error }, { data: exam }] = await Promise.all([
    supabase.rpc("get_exam_review", { p_exam: examId }),
    supabase.from("exams").select("title").eq("id", examId).maybeSingle(),
  ]);
  const back = <Link href="/dashboard/exams" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"><ArrowLeft className="h-4 w-4" />{t("back")}</Link>;
  if (error || !data) return <div className="space-y-4">{back}<Alert variant="error" className="bg-white">{error ? dbError(tr, error.message) : t("notAvailable")}</Alert></div>;
  const r = data as Review;
  const pct = r.total ? Math.round((Number(r.score) / Number(r.total)) * 100) : 0;
  const correct = r.questions.filter((q) => q.your_answer === q.correct_answer).length;

  return (
    <div className="space-y-6">
      {back}
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{exam?.title ?? t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("submitted", { date: f.dateTime(r.submitted_at) })}{r.is_late ? ` · ${t("late")}` : ""}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center"><p className="font-display text-4xl font-extrabold text-primary">{pct}%</p><p className="text-xs text-muted-foreground">{t("marks", { score: Number(r.score), total: Number(r.total) })}</p></div>
          <div className="text-center"><p className="font-display text-2xl font-bold">{correct}/{r.questions.length}</p><p className="text-xs text-muted-foreground">{t("correct")}</p></div>
          <Link href={`/dashboard/exams/${examId}/leaderboard`} className={buttonVariants()}><Trophy /> {t("rank")}</Link>
        </div>
      </div>
      <div className="space-y-4">
        {r.questions.map((q, idx) => {
          const ok = q.your_answer === q.correct_answer;
          return (
            <div key={q.id} className={cn("rounded-2xl border bg-card p-5", ok ? "border-success/40" : "border-destructive/40")}>
              <div className="flex items-start gap-2">
                {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />}
                <p className="whitespace-pre-line font-medium"><span className="text-muted-foreground">{t("q", { n: idx + 1 })}</span> {q.question_text}</p>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((o, i) => (
                  <div key={i} className={cn("rounded-lg border px-3 py-2 text-sm",
                    i === q.correct_answer && "border-success bg-success/10 font-semibold",
                    i === q.your_answer && i !== q.correct_answer && "border-destructive bg-destructive/10 line-through")}>
                    {i + 1}. {o} {i === q.your_answer && <span className="ml-1 text-xs font-normal">{t("yourAnswer")}</span>}
                  </div>
                ))}
              </div>
              {q.your_answer === null && <p className="mt-2 text-xs text-warning">{t("notAnswered")}</p>}
              {q.explanation && <p className="mt-3 rounded-lg bg-muted p-3 text-sm"><b>{t("explanation")}</b> {q.explanation}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
