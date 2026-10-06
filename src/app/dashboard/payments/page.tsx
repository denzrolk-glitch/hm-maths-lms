import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, ShoppingBag, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyEnrollments } from "@/lib/data";
import { BankDetails } from "@/components/bank-details";
import { CopyButton } from "@/components/copy-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { getFormat, getT } from "@/i18n/server";
import { cn, currentMonth, formatLKR } from "@/lib/utils";
import { PaymentHistory, type PaymentRow } from "./payment-history";

export async function generateMetadata() {
  return { title: (await getT("portal.nav"))("payments") };
}

type OrderRow = { id: string; product_id: string; products: { title: string } | null; quantity: number; amount: number | null; status: string; created_at: string; slip_url: string | null; admin_note: string | null };

export default async function PaymentsPage() {
  const { supabase, user, profile } = await requireUser();
  const [t, tc, f] = await Promise.all([getT("portal.payments"), getT("common"), getFormat()]);
  const [enrollments, { data: orderData }] = await Promise.all([
    getMyEnrollments(supabase, user.id),
    supabase.from("orders").select("*, products(title)").eq("student_id", user.id).order("created_at", { ascending: false }),
  ]);
  const orders = (orderData ?? []) as OrderRow[];

  type Raw = Omit<PaymentRow, "amount" | "date" | "group"> & { value: number | null; iso: string };
  const raw: Raw[] = [
    ...enrollments.map((e) => ({
      key: `c-${e.id}`, kind: "class" as const, item: e.classes?.title ?? t("classFee"), detail: f.month(e.month),
      value: e.amount ?? e.classes?.fee ?? null, status: e.status, ref: e.bank_ref, shortId: e.id.slice(0, 8), iso: e.created_at,
      slip: e.slip_url, note: e.admin_note, retryHref: e.status === "rejected" ? `/dashboard/store/class/${e.class_id}?month=${e.month}` : null,
    })),
    ...orders.map((o) => ({
      key: `o-${o.id}`, kind: "order" as const, item: o.products?.title ?? t("tuteBook"), detail: t("qty", { n: o.quantity }),
      value: o.amount, status: o.status, ref: null, shortId: o.id.slice(0, 8), iso: o.created_at,
      slip: o.slip_url, note: o.admin_note, retryHref: o.status === "rejected" ? `/dashboard/store/product/${o.product_id}` : null,
    })),
  ].sort((a, b) => (a.iso < b.iso ? 1 : -1));

  const rows: PaymentRow[] = raw.map(({ value, iso, ...r }) => ({
    ...r, amount: value !== null ? formatLKR(value) : tc("dash"), date: f.date(iso), group: f.month(currentMonth(new Date(iso))),
  }));

  const isPaid = (s: string) => s === "approved" || s === "shipped";
  const sum = (list: Raw[]) => list.reduce((a, r) => a + Number(r.value ?? 0), 0);
  const paid = raw.filter((r) => isPaid(r.status));
  const pending = raw.filter((r) => r.status === "pending");
  const rejected = raw.filter((r) => r.status === "rejected");

  const stats: { label: string; value: string; hint: string; icon: LucideIcon; tone: string }[] = [
    { label: t("totalPaid"), value: formatLKR(sum(paid)), hint: t("totalPaidHint", { n: paid.length }), icon: Wallet, tone: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" },
    { label: t("approved"), value: String(paid.length), hint: t("approvedHint"), icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { label: t("pending"), value: String(pending.length), hint: t("pendingHint", { amount: formatLKR(sum(pending)) }), icon: Clock, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: t("needsAction"), value: String(rejected.length), hint: t("needsActionHint"), icon: AlertTriangle, tone: rejected.length ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400" },
  ];
  const steps = t.raw<string[]>("steps") ?? [];
  const headerBtn = "border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white";

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("subtitle")}>
        <Link href="/dashboard/store" className={buttonVariants({ variant: "outline", size: "sm", className: headerBtn })}><ShoppingBag /> {t("store")}</Link>
        <Link href="/dashboard/store" className={buttonVariants({ size: "sm" })}><Wallet /> {t("pay")}</Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map(({ label, value, hint, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border bg-card p-4 shadow-[0_3px_4px_rgba(0,0,0,.03)] sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", tone)}><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-1 truncate font-display text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">{hint}</p>
          </div>
        ))}
      </div>

      {rejected.length > 0 && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive"><AlertTriangle className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-destructive">{t("rejectedTitle", { n: rejected.length })}</p>
            <p className="text-sm text-muted-foreground">{t("rejectedText")}</p>
          </div>
          {rejected[0]?.retryHref && <Link href={rejected[0].retryHref} className={buttonVariants({ variant: "destructive", size: "sm" })}>{t("reupload")}</Link>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{t("history")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("historyHint")}</p>
          </CardHeader>
          <CardContent><PaymentHistory rows={rows} /></CardContent>
        </Card>

        <div className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
          {profile.student_id && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#17191e] via-[#1d2026] to-[#0f3d3a] p-5 text-white shadow-xl shadow-black/10">
              <div className="bg-hex absolute inset-0 opacity-60" />
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal-500/25 blur-3xl" />
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-wide text-white/60">{t("reference")}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-xl font-bold tracking-wider text-teal-300">{profile.student_id}</p>
                  <CopyButton value={profile.student_id} label className="text-white/70 hover:bg-white/10 hover:text-white" />
                </div>
                <p className="mt-2 text-xs text-white/60">{t("refHint")}</p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">{t("howTitle")}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li key={s} className="flex gap-3 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white">{i + 1}</span>
                    <span className="pt-0.5 text-muted-foreground">{s}</span>
                  </li>
                ))}
              </ol>
              <div className="border-t pt-4"><BankDetails stacked /></div>
              <Link href="/dashboard/store" className={buttonVariants({ size: "lg", variant: "gradient", className: "w-full" })}><Wallet /> {t("pay")}</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
