import Link from "next/link";
import {
  ArrowRight, BookOpen, ClipboardCheck, CreditCard, FileText, Megaphone, Package, Plus, Sparkles, Trophy, Users, Wallet,
  type LucideIcon,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { StatCard, Table } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { StatusBadge } from "@/components/status-badge";
import { DateTile } from "@/components/date-tile";
import { RankMedal } from "@/components/leaderboard";
import { TOWNS } from "@/lib/constants";
import { periodRange, type Paper } from "@/lib/papers";
import { getOverallBoard } from "@/lib/paper-data";
import { cn, currentMonth, formatLKR } from "@/lib/utils";
import { getFormat, getT } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getT("admin.nav"))("overview") };
}

export default async function AdminHome() {
  const { supabase, profile } = await requireAdmin();
  const [t, tc, f] = await Promise.all([getT("admin.overview"), getT("common"), getFormat()]);
  const month = currentMonth();
  const { from, to } = periodRange("month");
  const [students, classes, pending, approvedThisMonth, recent, papers, towns, top] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("enrollments").select("amount").eq("status", "approved").eq("month", month),
    supabase.from("enrollments").select("id, month, status, created_at, profiles:profiles!enrollments_student_id_fkey(full_name, student_id), classes(title)").order("created_at", { ascending: false }).limit(8),
    supabase.from("papers").select("*").order("paper_date", { ascending: false }).limit(4),
    supabase.from("profiles").select("town").eq("role", "student").limit(20000),
    getOverallBoard(supabase, { from, to, limit: 5 }),
  ]);
  const revenue = (approvedThisMonth.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
  type Recent = { id: string; month: string; status: string; created_at: string; profiles: { full_name: string; student_id: string } | null; classes: { title: string } | null };
  const perTown = TOWNS.map((x) => ({ town: x, n: (towns.data ?? []).filter((r) => r.town === x).length }));
  const maxTown = Math.max(1, ...perTown.map((x) => x.n));
  const quick: { href: string; label: string; icon: LucideIcon; tone: string }[] = [
    { href: "/admin/papers#new", label: t("quick.paper"), icon: FileText, tone: "from-brand-400 to-brand-600" },
    { href: "/admin/classes/new", label: t("quick.class"), icon: BookOpen, tone: "from-teal-500 to-teal-700" },
    { href: "/admin/notices", label: t("quick.notice"), icon: Megaphone, tone: "from-violet-500 to-indigo-600" },
    { href: "/admin/store", label: t("quick.store"), icon: Package, tone: "from-rose-400 to-pink-600" },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-ink via-teal-800 to-teal-600 p-6 text-white shadow-lift sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 animate-blob rounded-full bg-brand-400/30 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-white/75"><Sparkles className="h-4 w-4" /> {tc("brand.tutor")} · {f.month(month)}</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">{t("hello", { name: profile.full_name.split(" ")[0] })}</h1>
              <p className="mt-1 text-sm text-white/75">{t("title")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/payments" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-teal-700 shadow-md transition hover:-translate-y-px">
                <ClipboardCheck className="h-4 w-4" /> {t("reviewSlips")} {pending.count ? <span className="rounded-full bg-rose-500 px-2 text-xs text-white">{pending.count}</span> : null}
              </Link>
              <Link href="/admin/classes/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-semibold ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"><Plus className="h-4 w-4" /> {t("newClass")}</Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem><StatCard label={t("students")} value={students.count ?? 0} icon={Users} /></StaggerItem>
        <StaggerItem><StatCard label={t("activeClasses")} value={classes.count ?? 0} icon={BookOpen} tone="sky" /></StaggerItem>
        <StaggerItem><StatCard label={t("slips")} value={pending.count ?? 0} icon={CreditCard} tone="amber" hint={t("slipsHint")} /></StaggerItem>
        <StaggerItem><StatCard label={t("approvedMonth")} value={formatLKR(revenue)} icon={Wallet} tone="green" hint={t("enrollmentsN", { n: approvedThisMonth.data?.length ?? 0 })} /></StaggerItem>
      </Stagger>

      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quick.map(({ href, label, icon: Icon, tone }) => (
          <StaggerItem key={href}>
            <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3.5 text-sm font-semibold shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">
              <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md transition group-hover:rotate-6", tone)}><Icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{t("latest")}</h2>
            <Link href="/admin/payments" className="text-sm font-medium text-primary hover:underline">{t("openCenter")}</Link>
          </div>
          <Table>
            <thead><tr><th>{t("cols.student")}</th><th>{t("cols.class")}</th><th>{t("cols.month")}</th><th>{t("cols.submitted")}</th><th>{t("cols.status")}</th></tr></thead>
            <tbody>
              {((recent.data ?? []) as unknown as Recent[]).map((r) => (
                <tr key={r.id}>
                  <td><p className="font-medium">{r.profiles?.full_name}</p><p className="font-mono text-xs text-muted-foreground">{r.profiles?.student_id}</p></td>
                  <td>{r.classes?.title}</td><td>{f.month(r.month)}</td>
                  <td className="text-xs text-muted-foreground">{f.dateTime(r.created_at)}</td><td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {!recent.data?.length && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">{t("none")}</td></tr>}
            </tbody>
          </Table>
        </section>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" /> {t("papers")}</CardTitle>
              <Link href="/admin/papers" className="text-xs font-semibold text-primary hover:underline">{t("allPapers")}</Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {((papers.data ?? []) as Paper[]).map((p) => (
                <Link key={p.id} href={`/admin/papers/${p.id}`} className="flex items-center gap-3 rounded-2xl border border-border/70 p-2.5 transition hover:border-primary/40 hover:bg-accent/50">
                  <DateTile date={p.paper_date} className="h-11 w-11" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.title}</span>
                    <span className="block text-xs text-muted-foreground">{tc(`paperTypes.${p.paper_type}`)} · {t("outOf", { total: Number(p.total_marks) })}</span>
                  </span>
                </Link>
              ))}
              {!papers.data?.length && <p className="py-2 text-sm text-muted-foreground">{t("noPapers")}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Trophy className="h-4 w-4 text-amber-500" /> {t("topMonth")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {top.map((r) => (
                <div key={`${r.student_code}-${r.rank}`} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-2.5">
                  <RankMedal rank={r.rank} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.full_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{[r.student_code, tc(`towns.${r.town}`), t("papersN", { n: r.papers })].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="font-display text-sm font-bold">{Math.round(r.points)}</span>
                </div>
              ))}
              {!top.length && <p className="py-2 text-sm text-muted-foreground">{t("noRanks")}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" /> {t("centers")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {perTown.map(({ town, n }) => (
                <div key={town}>
                  <div className="mb-1 flex justify-between text-xs"><span className="font-medium">{tc(`towns.${town}`)}</span><span className="text-muted-foreground">{n}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-brand-400 transition-all duration-1000" style={{ width: `${(n / maxTown) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
