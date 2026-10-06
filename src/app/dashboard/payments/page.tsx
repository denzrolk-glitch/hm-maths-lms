import Link from "next/link";
import { ArrowLeft, Eye, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyEnrollments } from "@/lib/data";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Table } from "@/components/ui/misc";
import { getFormat, getT } from "@/i18n/server";
import { formatLKR } from "@/lib/utils";

export async function generateMetadata() {
  return { title: (await getT("portal.nav"))("payments") };
}

export default async function PaymentsPage() {
  const { supabase, user, profile } = await requireUser();
  const [t, tc, f] = await Promise.all([getT("portal.payments"), getT("common"), getFormat()]);
  const [enrollments, { data: orders }] = await Promise.all([
    getMyEnrollments(supabase, user.id),
    supabase.from("orders").select("*, products(title)").eq("student_id", user.id).order("created_at", { ascending: false }),
  ]);
  type Row = { id: string; kind: "class" | "order"; item: string; detail: string; amount: number | null; status: string; ref: string | null; date: string; slip: string | null; note: string | null };
  const rows: Row[] = [
    ...enrollments.map((e) => ({ id: e.id, kind: "class" as const, item: e.classes?.title ?? t("classFee"), detail: f.month(e.month), amount: e.amount ?? e.classes?.fee ?? null, status: e.status, ref: e.bank_ref, date: e.created_at, slip: e.slip_url, note: e.admin_note })),
    ...((orders ?? []) as { id: string; products: { title: string } | null; quantity: number; amount: number | null; status: string; created_at: string; slip_url: string | null; admin_note: string | null }[])
      .map((o) => ({ id: o.id, kind: "order" as const, item: o.products?.title ?? t("tuteBook"), detail: t("qty", { n: o.quantity }), amount: o.amount, status: o.status, ref: null, date: o.created_at, slip: o.slip_url, note: o.admin_note })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));
  const approved = enrollments.filter((e) => e.status === "approved").length;
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("subtitle")}>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm", className: "border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" })}><ArrowLeft /> {t("back")}</Link>
      </PageHeader>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("summary")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="col-span-3 rounded-2xl bg-slate-50 p-5">
                <p className="font-mono text-2xl font-bold text-slate-800">{profile.student_id ?? tc("idCard.admin")}</p>
                <p className="text-xs text-slate-500">{t("studentId")}</p>
              </div>
              <div className="rounded-xl bg-teal-50 p-3"><p className="font-display text-xl font-bold text-teal-700">{approved}</p><p className="text-[11px] text-teal-700/80">{t("approved")}</p></div>
              <div className="rounded-xl bg-amber-50 p-3"><p className="font-display text-xl font-bold text-amber-700">{pending}</p><p className="text-[11px] text-amber-700/80">{t("pending")}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="font-display text-xl font-bold text-slate-700">{rows.length}</p><p className="text-[11px] text-slate-500">{t("total")}</p></div>
            </div>
            <Link href="/dashboard/store" className={buttonVariants({ size: "lg", className: "w-full" })}><Wallet /> {t("pay")}</Link>
            <p className="text-center text-xs text-slate-500">{t("refHint")}</p>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div><CardTitle className="text-base">{t("history")}</CardTitle><p className="mt-1 text-xs text-slate-400">{t("historyHint")}</p></div>
            <Link href="/dashboard/store" className={buttonVariants({ variant: "outline", size: "sm" })}>{t("store")}</Link>
          </CardHeader>
          <CardContent className="px-0 pb-0 sm:px-0">
            <Table bare className="[&_td]:whitespace-nowrap">
              <thead><tr><th>{t("cols.item")}</th><th>{t("cols.id")}</th><th>{t("cols.amount")}</th><th>{t("cols.status")}</th><th>{t("cols.method")}</th><th>{t("cols.reference")}</th><th>{t("cols.date")}</th><th>{t("cols.slip")}</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.kind + r.id}>
                    <td><p className="font-medium">{r.item}</p><p className="text-xs text-muted-foreground">{r.detail}{r.note ? ` · ${r.note}` : ""}</p></td>
                    <td className="font-mono text-xs uppercase text-muted-foreground">{r.id.slice(0, 8)}</td>
                    <td>{r.amount !== null ? formatLKR(r.amount) : tc("dash")}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-muted-foreground">{t("bankSlip")}</td>
                    <td className="text-muted-foreground">{r.ref ?? tc("dash")}</td>
                    <td className="text-muted-foreground">{f.date(r.date)}</td>
                    <td>{r.slip ? <a href={`/api/files/bank-slips?path=${encodeURIComponent(r.slip)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Eye className="h-3.5 w-3.5" />{t("view")}</a> : tc("dash")}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">{t("empty")}</td></tr>}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
