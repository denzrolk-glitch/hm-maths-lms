import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Table } from "@/components/ui/misc";
import type { Product } from "@/lib/types";
import { formatLKR } from "@/lib/utils";
import { getFormat, getT } from "@/i18n/server";
import { DeleteButton, OrderButtons, ProductForm } from "../forms";
import { deleteProductAction } from "../actions";

export async function generateMetadata() {
  return { title: (await getT("admin.nav"))("store") };
}

type OrderRow = { id: string; quantity: number; amount: number | null; delivery_address: string; status: string; slip_url: string | null; admin_note: string | null; created_at: string;
  profiles: { full_name: string; mobile: string | null; student_id: string | null } | null; products: { title: string } | null };

export default async function AdminStorePage() {
  const { supabase } = await requireAdmin();
  const [t, tc, f] = await Promise.all([getT("admin.store"), getT("common"), getFormat()]);
  const [{ data: products }, { data: orders }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("id, quantity, amount, delivery_address, status, slip_url, admin_note, created_at, profiles(full_name, mobile, student_id), products(title)")
      .order("created_at", { ascending: false }).limit(100),
  ]);
  const rows = (orders ?? []) as unknown as OrderRow[];
  const paths = rows.map((r) => r.slip_url).filter(Boolean) as string[];
  const signed = paths.length ? (await supabase.storage.from("bank-slips").createSignedUrls(paths, 900)).data ?? [] : [];
  const urlFor = new Map(signed.map((x) => [x.path, x.signedUrl]));

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">{t("orders")}</h2>
        <Table>
          <thead><tr><th>{t("cols.student")}</th><th>{t("cols.item")}</th><th>{t("cols.amount")}</th><th>{t("cols.deliver")}</th><th>{t("cols.slip")}</th><th>{t("cols.status")}</th><th>{t("cols.actions")}</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td><p className="font-medium">{o.profiles?.full_name}</p><p className="font-mono text-xs text-muted-foreground">{o.profiles?.student_id} · {o.profiles?.mobile}</p><p className="text-xs text-muted-foreground">{f.dateTime(o.created_at)}</p></td>
                <td>{o.products?.title} × {o.quantity}</td>
                <td>{o.amount !== null ? formatLKR(o.amount) : tc("dash")}</td>
                <td className="max-w-48 whitespace-pre-line text-xs">{o.delivery_address}</td>
                <td>{o.slip_url && urlFor.get(o.slip_url) ? <a href={urlFor.get(o.slip_url) ?? "#"} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm", variant: "secondary" })}><ExternalLink />{t("view")}</a> : tc("dash")}</td>
                <td><StatusBadge status={o.status} />{o.admin_note && <p className="mt-1 text-xs text-muted-foreground">{o.admin_note}</p>}</td>
                <td>{o.status !== "shipped" && o.status !== "rejected" ? <OrderButtons id={o.id} status={o.status} /> : null}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">{t("noOrders")}</td></tr>}
          </tbody>
        </Table>
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        <Card className="lg:self-start"><CardHeader><CardTitle className="text-base">{t("add")}</CardTitle></CardHeader><CardContent><ProductForm /></CardContent></Card>
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{t("products")}</h2>
          {((products ?? []) as Product[]).map((p) => (
            <details key={p.id} className="rounded-2xl border border-border/80 bg-card p-4 shadow-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="font-medium">{p.title} <span className="text-sm text-muted-foreground">· {formatLKR(p.price)}</span></span>
                <span className="flex items-center gap-2">{p.is_active ? <Badge variant="success">{t("active")}</Badge> : <Badge variant="secondary">{t("hidden")}</Badge>}<DeleteButton action={deleteProductAction} id={p.id} size="icon" /></span>
              </summary>
              <div className="mt-4 border-t pt-4"><ProductForm product={p} /></div>
            </details>
          ))}
          {!products?.length && <p className="text-sm text-muted-foreground">{t("noProducts")}</p>}
        </section>
      </div>
    </div>
  );
}
