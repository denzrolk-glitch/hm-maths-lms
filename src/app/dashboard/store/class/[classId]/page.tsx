import { notFound, redirect } from "next/navigation";
import { CalendarClock, CheckCircle2, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ClassBanner } from "@/components/class-banner";
import { BankDetails } from "@/components/bank-details";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import type { ClassRow } from "@/lib/types";
import { currentMonth, formatLKR, shiftMonth } from "@/lib/utils";
import { getFormat, getScheduleLabel, getT } from "@/i18n/server";
import { EnrollForm, type MonthOption } from "./enroll-form";

export default async function EnrollPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ month?: string }> }) {
  const { classId } = await params;
  const { month: wanted } = await searchParams;
  const { supabase, user } = await requireUser();
  const [t, tc, f, sched] = await Promise.all([getT("portal.enroll"), getT("common"), getFormat(), getScheduleLabel()]);
  const { data } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
  if (!data) notFound();
  const cls = data as ClassRow;
  if (cls.is_free) redirect(`/dashboard/classes/${classId}`);

  const { data: mine } = await supabase.from("enrollments").select("month, status, admin_note").eq("student_id", user.id).eq("class_id", classId);
  // Offer next month, the current month and the previous 6 months (archive packs).
  const status = new Map((mine ?? []).map((e) => [e.month as string, e.status as string]));
  const cur = currentMonth();
  const values = [shiftMonth(cur, 1), cur, ...Array.from({ length: 6 }, (_, i) => shiftMonth(cur, -(i + 1)))];
  const months: MonthOption[] = values.map((v) => ({
    value: v,
    label: `${f.month(v)} ${v === cur ? t("current") : v > cur ? t("next") : t("archive")}`,
    status: status.get(v),
  }));
  const firstOpen = months.find((m) => m.value === wanted && m.status !== "approved" && m.status !== "pending")
    ?? months.find((m) => m.value === cur && !m.status) ?? months.find((m) => !m.status || m.status === "rejected") ?? months[1];
  const rejected = (mine ?? []).filter((e) => e.status === "rejected");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_3px_4px_rgba(0,0,0,.03)]">
          <ClassBanner cls={cls} />
          <div className="space-y-3 p-5">
            <div className="flex flex-wrap gap-2"><Badge>{tc(`classTypes.${cls.class_type}`)}</Badge>{cls.target_year && <Badge variant="secondary">{tc("alBatch", { year: cls.target_year })}</Badge>}</div>
            <h1 className="font-display text-2xl font-bold">{cls.title}</h1>
            {cls.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{cls.description}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {cls.town && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{tc(`towns.${cls.town}`)}</span>}
              {sched(cls) && <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" />{sched(cls)}</span>}
            </div>
            <p className="font-display text-xl font-bold">{tc("perMonth", { amount: formatLKR(cls.fee) })}</p>
          </div>
        </div>
        <Card><CardContent className="pt-5"><BankDetails amount={formatLKR(cls.fee)} /></CardContent></Card>
        {(mine ?? []).length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">{t("yourMonths")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(mine ?? []).sort((a, b) => (a.month < b.month ? 1 : -1)).map((e) => (
                <div key={e.month} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>{f.month(e.month)}</span>
                  <span className="flex items-center gap-2">{e.admin_note && <span className="text-xs text-muted-foreground">{e.admin_note}</span>}<StatusBadge status={e.status} /></span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("steps")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {rejected.length > 0 && <Alert variant="error">{t("rejected")}</Alert>}
            {status.get(cur) === "approved" && <Alert variant="success"><CheckCircle2 className="mr-1 inline h-4 w-4" />{t("hasAccess", { month: f.month(cur) })}</Alert>}
            <EnrollForm classId={classId} userId={user.id} months={months} defaultMonth={firstOpen.value} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
