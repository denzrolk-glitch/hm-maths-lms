import { Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand-icons";
import { requireAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { PageHeader, Table } from "@/components/ui/misc";
import { AL_YEARS, TOWNS } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { whatsappLink } from "@/lib/utils";
import { getFormat, getT } from "@/i18n/server";
import { ResetPasswordButton, RoleButton } from "../forms";

export async function generateMetadata() {
  return { title: (await getT("admin.nav"))("students") };
}

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; town?: string; year?: string }> }) {
  const { q, town, year } = await searchParams;
  const { supabase, user } = await requireAdmin();
  const [t, tc, f] = await Promise.all([getT("admin.students"), getT("common"), getFormat()]);
  let query = supabase.from("profiles").select("*, enrollments:enrollments!enrollments_student_id_fkey(count)", { count: "exact" }).order("created_at", { ascending: false }).limit(200);
  const term = (q ?? "").trim().replace(/[%,()*]/g, "");
  if (term) query = query.or(`full_name.ilike.%${term}%,mobile.ilike.%${term}%,nic.ilike.%${term}%,student_id.ilike.%${term}%,school.ilike.%${term}%`);
  if (town && (TOWNS as readonly string[]).includes(town)) query = query.eq("town", town);
  if (year && /^\d{4}$/.test(year)) query = query.eq("al_year", Number(year));
  const { data, count } = await query;
  const rows = (data ?? []) as (Profile & { enrollments: { count: number }[] })[];

  return (
    <div>
      <PageHeader title={t("title")} description={t("shown", { n: rows.length, total: count ?? rows.length })} />
      <form className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px_140px_auto]">
        <Input name="q" defaultValue={q} placeholder={t("search")} />
        <Select name="town" defaultValue={town ?? ""}><option value="">{t("allCenters")}</option>{TOWNS.map((x) => <option key={x} value={x}>{tc(`towns.${x}`)}</option>)}</Select>
        <Select name="year" defaultValue={year ?? ""}><option value="">{t("allYears")}</option>{AL_YEARS.map((y) => <option key={y}>{y}</option>)}</Select>
        <button className={buttonVariants()}><Search /> {t("filter")}</button>
      </form>
      <Table>
        <thead><tr><th>{t("cols.student")}</th><th>{t("cols.contact")}</th><th>{t("cols.batch")}</th><th>{t("cols.school")}</th><th>{t("cols.enrollments")}</th><th>{t("cols.joined")}</th><th /></tr></thead>
        <tbody>
          {rows.map((p) => {
            const wa = whatsappLink(p.mobile, t("waHello", { name: p.full_name }));
            return (
              <tr key={p.id}>
                <td><p className="font-medium">{p.full_name} {p.role === "admin" && <Badge>{tc("shell.admin")}</Badge>}</p><p className="font-mono text-xs text-muted-foreground">{p.student_id ?? tc("dash")}</p></td>
                <td className="text-xs"><p>{p.mobile ?? tc("dash")}</p><p className="text-muted-foreground">{t("nic")} {p.nic ?? tc("dash")}</p></td>
                <td className="text-xs">{p.al_year ?? tc("dash")} · {tc(`towns.${p.town}`)}</td>
                <td className="max-w-56 text-xs"><p>{p.school ?? tc("dash")}{p.district ? `, ${p.district}` : ""}</p>{p.address ? <p className="mt-0.5 line-clamp-2 text-muted-foreground" title={p.address}>{[p.address, p.city, p.postal_code].filter(Boolean).join(", ")}</p> : null}</td>
                <td>{p.enrollments?.[0]?.count ?? 0}</td>
                <td className="text-xs text-muted-foreground">{f.date(p.created_at)}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    {wa && <a href={wa} target="_blank" rel="noreferrer" aria-label={t("whatsapp")} className={buttonVariants({ variant: "ghost", size: "icon", className: "" })}><WhatsAppIcon className="h-5 w-5" /></a>}
                    {p.id !== user.id && <ResetPasswordButton id={p.id} name={p.full_name} />}
                    {p.id !== user.id && <RoleButton id={p.id} role={p.role} />}
                  </div>
                </td>
              </tr>
            );
          })}
          {!rows.length && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">{t("empty")}</td></tr>}
        </tbody>
      </Table>
    </div>
  );
}
