import { requireUser } from "@/lib/auth";
import { StoreCatalog } from "@/components/store-catalog";
import { PageHeader } from "@/components/ui/misc";
import { getT } from "@/i18n/server";
import type { ClassRow, Product } from "@/lib/types";

export async function generateMetadata() {
  return { title: (await getT("portal.nav"))("store") };
}

export default async function StorePage() {
  const { supabase } = await requireUser();
  const t = await getT("portal.store");
  const [{ data: classes }, { data: products }] = await Promise.all([
    supabase.from("classes").select("*").eq("is_active", true).order("target_year").order("title"),
    supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
  ]);
  return (
    <div>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="rounded-2xl bg-card text-card-foreground border border-border p-5 shadow-soft sm:p-6">
        <StoreCatalog classes={(classes ?? []) as ClassRow[]} products={(products ?? []) as Product[]} />
      </div>
    </div>
  );
}
