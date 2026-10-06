import Link from "next/link";
import { BookOpen, IdCard, Radio, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyEnrollments, getUpcomingLive } from "@/lib/data";
import { ClassCard } from "@/components/class-card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader, Table } from "@/components/ui/misc";
import { getFormat, getT } from "@/i18n/server";
import { cn, currentMonth } from "@/lib/utils";

export async function generateMetadata() {
  return { title: (await getT("portal.nav"))("classes") };
}

export default async function MyClassesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "classes" } = await searchParams;
  const { supabase, user } = await requireUser();
  const [t, tc, f] = await Promise.all([getT("portal.classes"), getT("common"), getFormat()]);
  const month = currentMonth();
  const [enrollments, live] = await Promise.all([getMyEnrollments(supabase, user.id), getUpcomingLive(supabase, 20)]);
  const approved = enrollments.filter((e) => e.status === "approved" && e.classes);
  const current = approved.filter((e) => e.month === month);
  const otherByClass = new Map<string, (typeof approved)[number]>();
  for (const e of approved) if (e.month !== month && !current.some((c) => c.class_id === e.class_id) && !otherByClass.has(e.class_id)) otherByClass.set(e.class_id, e);
  const others = [...otherByClass.values()];
  const notApproved = enrollments.filter((e) => e.status !== "approved");

  const tabs = [["classes", t("tabs.classes")], ["live", t("tabs.live")]] as const;

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("subtitle", { month: f.month(month) })}>
        <Link href="/dashboard/profile#id" className={buttonVariants({ variant: "pink", size: "sm" })}><IdCard /> {t("myId")}</Link>
        <Link href="/dashboard/store" className={buttonVariants({ size: "sm" })}><Wallet /> {t("payFees")}</Link>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border dark:border-white/10 bg-card p-3 shadow-[0_3px_4px_rgba(0,0,0,.03)]">
        <span className="px-3 font-display text-base font-semibold text-foreground">{t("hub")}</span>
        {tabs.map(([k, label]) => (
          <Link key={k} href={`?tab=${k}`} className={cn("rounded-xl px-4 py-2 text-sm font-medium transition", tab === k ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5")}>
            {label}
          </Link>
        ))}
        <Link href="/dashboard/free-zone" className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">{t("tabs.free")}</Link>
      </div>

      {tab === "live" ? (
        live.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {live.map((l) => (
              <Link key={l.id} href={`/dashboard/classes/${l.class_id}?month=${l.month}#live`} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_3px_4px_rgba(0,0,0,.03)] transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500"><Radio className="h-5 w-5" /></span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{l.title}</span>
                  <span className="block truncate text-sm text-slate-500">{l.classes?.title}</span>
                  <span className="mt-1 block text-xs font-semibold text-teal-600">{f.dateTime(l.live_start_time)}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : <EmptyState icon={Radio} title={t("noLive")} description={t("noLiveText")} />
      ) : (
        <>
          {current.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {current.map((e) => (
                <ClassCard key={e.id} cls={e.classes!} href={`/dashboard/classes/${e.class_id}?month=${e.month}`}
                  footer={<Badge variant="success">{t("unlocked")}</Badge>} />
              ))}
            </div>
          ) : (
            <EmptyState icon={BookOpen} title={t("empty")} description={t("emptyText")}>
              <Link href="/dashboard/store" className={buttonVariants({ size: "sm" })}>{t("goStore")}</Link>
            </EmptyState>
          )}

          {others.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">{t("others")}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((e) => (
                  <ClassCard key={e.id} cls={e.classes!} href={`/dashboard/classes/${e.class_id}?month=${e.month}`}
                    footer={<Badge variant="secondary">{f.month(e.month)}</Badge>} />
                ))}
              </CardContent>
            </Card>
          )}

          {notApproved.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-base font-semibold">{t("pendingTitle")}</h2>
              <Table>
                <thead><tr><th>{t("table.class")}</th><th>{t("table.month")}</th><th>{t("table.status")}</th><th>{t("table.note")}</th><th /></tr></thead>
                <tbody>
                  {notApproved.map((e) => (
                    <tr key={e.id}>
                      <td className="font-medium">{e.classes?.title}</td>
                      <td>{f.month(e.month)}</td>
                      <td><StatusBadge status={e.status} /></td>
                      <td className="text-xs text-muted-foreground">{e.admin_note ?? tc("dash")}</td>
                      <td className="text-right">
                        {e.status === "rejected" && <Link href={`/dashboard/store/class/${e.class_id}?month=${e.month}`} className={buttonVariants({ size: "sm", variant: "outline" })}>{t("reupload")}</Link>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </section>
          )}
        </>
      )}
    </div>
  );
}
