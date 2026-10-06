import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/misc";
import type { ClassRow, Lesson } from "@/lib/types";
import { currentMonth } from "@/lib/utils";
import { Users } from "lucide-react";
import { ClassForm, DeleteButton, LessonForm } from "../../forms";
import { deleteClassAction } from "../../actions";
import { LessonList } from "./lesson-list";
import { getT } from "@/i18n/server";

export default async function AdminClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const { supabase } = await requireAdmin();
  const t = await getT("admin.class");
  const [{ data: cls }, { data: lessons }, { count }] = await Promise.all([
    supabase.from("classes").select("*").eq("id", classId).maybeSingle(),
    supabase.from("lessons").select("*").eq("class_id", classId).order("month", { ascending: false }).order("week_number").order("sort_order"),
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("class_id", classId).eq("status", "approved").eq("month", currentMonth()),
  ]);
  if (!cls) notFound();
  const c = cls as ClassRow;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/classes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{t("back")}</Link>
        <div className="flex gap-2">
          <Link href={`/dashboard/classes/${classId}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye /> {t("viewAsStudent")}</Link>
          <DeleteButton action={deleteClassAction} id={classId} label={t("delete")} confirm={t("deleteConfirm")} />
        </div>
      </div>
      <h1 className="font-display text-2xl font-bold">{c.title}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("paidThisMonth")} value={count ?? 0} icon={Users} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">{t("addLesson")}</CardTitle></CardHeader><CardContent><LessonForm classId={classId} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">{t("details")}</CardTitle></CardHeader><CardContent><ClassForm cls={c} /></CardContent></Card>
        </div>
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold">{t("content")}</h2>
          <LessonList classId={classId} lessons={(lessons ?? []) as Lesson[]} />
        </div>
      </div>
    </div>
  );
}
