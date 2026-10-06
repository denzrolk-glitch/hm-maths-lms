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
    <div className="min-h-dvh bg-[#f4f6fa]">
      <LandingNav account={!user ? "guest" : profile?.role === "admin" ? "admin" : "student"} />
      <div className="bg-hex relative bg-[#050505] pb-32 pt-36 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(240,91,6,.18),transparent_60%)]" />
        <div className="container relative">
          <h1 className="text-sand font-display text-4xl font-extrabold leading-[1.3] sm:text-5xl pb-3">{t("title")}</h1>
          <p className="mt-2 max-w-xl text-white/60 leading-relaxed">{t("publicSubtitle")}</p>
        </div>
      </div>
      <main className="container relative -mt-20 pb-20">
        <div className="rounded-3xl bg-card text-card-foreground border border-border p-5 shadow-xl shadow-black/5 sm:p-8">
          <StoreCatalog classes={(classes ?? []) as ClassRow[]} products={(products ?? []) as Product[]} />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
