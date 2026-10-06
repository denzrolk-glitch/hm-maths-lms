"use client";
import { useState } from "react";
import { FileText, Pencil, PlayCircle, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/lib/types";
import { formatDateTime, formatMonth } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { DeleteButton, LessonForm } from "../../forms";
import { deleteLessonAction } from "../../actions";

export function LessonList({ classId, lessons }: { classId: string; lessons: Lesson[] }) {
  const t = useT("admin.class");
  const months12 = useT("common").raw<string[]>("months");
  const [editing, setEditing] = useState<string | null>(null);
  const months = [...new Set(lessons.map((l) => l.month))].sort().reverse();
  if (!lessons.length) return <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted-foreground">{t("noLessons")}</p>;
  return (
    <div className="space-y-6">
      {months.map((m) => (
        <div key={m}>
          <h3 className="mb-2 font-display font-semibold">{formatMonth(m, months12)}</h3>
          <div className="divide-y rounded-2xl border border-slate-200/60 bg-card">
            {lessons.filter((l) => l.month === m).map((l) => (
              <div key={l.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">W{l.week_number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.title}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {l.youtube_url && <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" />{t("recording")}</span>}
                      {l.tute_pdf_url && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{t("tute")}</span>}
                      {l.live_start_time && <span className="flex items-center gap-1"><Radio className="h-3 w-3" />{formatDateTime(l.live_start_time)}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={t("edit")} onClick={() => setEditing(editing === l.id ? null : l.id)}><Pencil /></Button>
                  <DeleteButton action={deleteLessonAction} id={l.id} size="icon" confirm={t("deleteLesson")} />
                </div>
                {editing === l.id && <div className="mt-4 border-t pt-4"><LessonForm classId={classId} lesson={l} onDone={() => setEditing(null)} /></div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
