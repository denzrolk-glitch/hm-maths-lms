import Image from "next/image";
import Link from "next/link";
import { CreditCard, ExternalLink, MessageCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatLKR, whatsappLink } from "@/lib/utils";
import { getFormat, getT } from "@/i18n/server";
import { GrantAccessForm, ReviewButtons } from "../forms";

export async function generateMetadata() {
  return { title: (await getT("admin.nav"))("payments") };
}
const STATUSES = ["pending", "approved", "rejected"] as const;

type Row = {
  id: string; month: string; status: string; slip_url: string | null; amount: number | null; bank_ref: string | null; admin_note: string | null; created_at: string;
  profiles: { full_name: string; mobile: string | null; nic: string | null; student_id: string | null; town: string } | null;
  classes: { title: string; fee: number } | null;
};

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: s } = await searchParams;
  const status = STATUSES.find((x) => x === s) ?? "pending";
  const { supabase } = await requireAdmin();
  const [t, tc, f] = await Promise.all([getT("admin.payments"), getT("common"), getFormat()]);
  const [{ data }, { data: classes }] = await Promise.all([
    supabase.from("enrollments").select("id, month, status, slip_url, amount, bank_ref, admin_note, created_at, profiles:profiles!enrollments_student_id_fkey(full_name, mobile, nic, student_id, town), classes(title, fee)")
      .eq("status", status).order("created_at", { ascending: status === "pending" }).limit(100),
    supabase.from("classes").select("id, title").eq("is_free", false).order("title"),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const paths = rows.map((r) => r.slip_url).filter(Boolean) as string[];
  const signed = paths.length ? (await supabase.storage.from("bank-slips").createSignedUrls(paths, 900)).data ?? [] : [];
  const urlFor = new Map(signed.map((x) => [x.path, x.signedUrl]));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")}>
        {STATUSES.map((x) => <Link key={x} href={`?status=${x}`} className={buttonVariants({ size: "sm", variant: x === status ? "default" : "outline", })}>{tc(`status.${x}`)}</Link>)}
      </PageHeader>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("grantTitle")}</CardTitle></CardHeader>
        <CardContent><GrantAccessForm classes={classes ?? []} /></CardContent>
      </Card>

      {!rows.length ? <EmptyState icon={CreditCard} title={t("empty", { status: tc(`status.${status}`) })} /> : (
        <div className="space-y-4">
          {rows.map((r) => {
            const url = r.slip_url ? urlFor.get(r.slip_url) : null;
            const isPdf = r.slip_url?.toLowerCase().endsWith(".pdf");
            const wa = whatsappLink(r.profiles?.mobile, status === "pending"
              ? t("waApproved", { name: r.profiles?.full_name, class: r.classes?.title, month: f.month(r.month) })
              : t("waRegarding", { name: r.profiles?.full_name, class: r.classes?.title, month: f.month(r.month) }));
            const mismatch = r.amount !== null && r.classes && Number(r.amount) !== Number(r.classes.fee);
            return (
              <div key={r.id} className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200/60 bg-card p-4 shadow-[0_3px_4px_rgba(0,0,0,.03)] md:grid-cols-[180px_1fr]">
                <a href={url ?? "#"} target="_blank" rel="noreferrer" className={cn("relative block aspect-[3/4] overflow-hidden rounded-lg border bg-muted", !url && "pointer-events-none")}>
                  {url && !isPdf ? <Image src={url} alt={t("slipAlt")} fill sizes="180px" className="object-cover" unoptimized /> :
                    <span className="flex h-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">{url ? <><ExternalLink className="h-5 w-5" />{t("openPdf")}</> : t("noSlip")}</span>}
                </a>
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-semibold">{r.profiles?.full_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.profiles?.student_id} · {r.profiles?.mobile} · {t("nic")} {r.profiles?.nic} · {r.profiles?.town ? tc(`towns.${r.profiles.town}`) : ""}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                    <div><dt className="text-xs text-muted-foreground">{t("class")}</dt><dd className="font-medium">{r.classes?.title}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">{t("month")}</dt><dd className="font-medium">{f.month(r.month)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">{t("amount")}</dt><dd className={cn("font-medium", mismatch && "text-warning")}>{r.amount !== null ? formatLKR(r.amount) : tc("dash")}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">{t("submitted")}</dt><dd>{f.dateTime(r.created_at)}</dd></div>
                    {r.bank_ref && <div className="col-span-2"><dt className="text-xs text-muted-foreground">{t("reference")}</dt><dd className="font-mono">{r.bank_ref}</dd></div>}
                    {r.admin_note && <div className="col-span-2"><dt className="text-xs text-muted-foreground">{t("note")}</dt><dd>{r.admin_note}</dd></div>}
                  </dl>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                    <ReviewButtons id={r.id} />
                    {wa && <a href={wa} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm", variant: "ghost", className: "text-success" })}><MessageCircle /> {t("whatsapp")}</a>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
