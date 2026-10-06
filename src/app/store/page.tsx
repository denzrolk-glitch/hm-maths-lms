import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";
import { StoreCatalog } from "@/components/store-catalog";
import { getSession } from "@/lib/auth";
import { getT } from "@/i18n/server";
import type { ClassRow, Product } from "@/lib/types";

export async function generateMetadata() {
  return { title: (await getT("portal.store"))("title") };
}

export default async function PublicStorePage() {
  const [{ supabase, user, profile }, t] = await Promise.all([getSession(), getT("portal.store")]);
  const [{ data: classes }, { data: products }] = await Promise.all([
    supabase.from("classes").select("*").eq("is_active", true).order("target_year").order("title"),
    supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
  ]);
  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#f3f9ff] to-white dark:from-[#060b1a] dark:to-[#070d1f]">
      <LandingNav account={!user ? "guest" : profile?.role === "admin" ? "admin" : "student"} />
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-brand-500 pb-32 pt-36 text-white">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="container relative">
          <h1 className="animate-fade-up font-display text-4xl font-extrabold leading-[1.2] sm:text-5xl pb-2">{t("title")}</h1>
          <p className="mt-2 max-w-xl text-white/85 leading-relaxed">{t("publicSubtitle")}</p>
        </div>
      </div>
      <main className="container relative -mt-20 pb-20">
        <div className="rounded-3xl bg-card text-card-foreground border border-border p-5 shadow-lift sm:p-8">
          <StoreCatalog classes={(classes ?? []) as ClassRow[]} products={(products ?? []) as Product[]} />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
