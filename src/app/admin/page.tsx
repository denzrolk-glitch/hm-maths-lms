import Link from "next/link";
import { BookOpen, CreditCard, Users, Wallet } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { StatCard, PageHeader, Table } from "@/components/ui/misc";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { currentMonth, formatLKR } from "@/lib/utils";
import { getFormat, getT } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getT("admin.nav"))("overview") };
}

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const [t, tc, f] = await Promise.all([getT("admin.overview"), getT("common"), getFormat()]);
  const month = currentMonth();
  const [students, classes, pending, approvedThisMonth, recent] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("enrollments").select("amount").eq("status", "approved").eq("month", month),
    supabase.from("enrollments").select("id, month, status, created_at, profiles:profiles!enrollments_student_id_fkey(full_name, student_id), classes(title)").order("created_at", { ascending: false }).limit(8),
  ]);
  const revenue = (approvedThisMonth.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
  type Recent = { id: string; month: string; status: string; created_at: string; profiles: { full_name: string; student_id: string } | null; classes: { title: string } | null };

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={`${tc("brand.tutor")} · ${f.month(month)}`}>
        <Link href="/admin/classes/new" className={buttonVariants()}>{t("newClass")}</Link>
      </PageHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("students")} value={students.count ?? 0} icon={Users} />
        <StatCard label={t("activeClasses")} value={classes.count ?? 0} icon={BookOpen} />
        <StatCard label={t("slips")} value={pending.count ?? 0} icon={CreditCard} hint={t("slipsHint")} />
        <StatCard label={t("approvedMonth")} value={formatLKR(revenue)} icon={Wallet} hint={t("enrollmentsN", { n: approvedThisMonth.data?.length ?? 0 })} />
      </div>
      <section>
        <div className="mb-3 flex items-center justify-between">
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
    </div>
  );
}
