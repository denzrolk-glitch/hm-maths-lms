import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Announcements } from "@/components/landing/announcements";
import { Story } from "@/components/landing/story";
import { Testimonials } from "@/components/landing/testimonials";
import { ClassesCarousel, type CarouselClass } from "@/components/landing/classes-carousel";
import { Channels } from "@/components/landing/channels";
import { CtaOrbit } from "@/components/landing/cta-orbit";
import { Faq } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/footer";
import { getSession } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { SITE } from "@/content/site";
import { publicImage } from "@/lib/public-image";
import type { ClassRow } from "@/lib/types";

type Placeholder = { title: string; type: string; year: number; lines: string[] };

export default async function HomePage() {
  const [{ supabase, user, profile }, t] = await Promise.all([getSession(), getT("landing")]);
  const { data } = await supabase.from("classes").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(10);
  const rows = (data ?? []) as ClassRow[];

  const placeholders = t.raw<Placeholder[]>("classes.placeholders") ?? [];
  const defaultLines = (type: string) => placeholders.find((p) => p.type === type)?.lines ?? [];
  const classes: CarouselClass[] = rows.length
    ? rows.map((c) => {
        const own = (c.description ?? "").split(/\r?\n/).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean).slice(0, 4);
        return {
        id: c.id, title: c.title, type: c.class_type, year: c.target_year, town: c.town, schedule: c.schedule,
        fee: Number(c.fee), isFree: c.is_free, banner: c.banner_url,
        lines: own.length ? own : defaultLines(c.class_type),
        };
      })
    : placeholders.map((p) => ({
        id: null, title: p.title, type: p.type, year: p.year, town: null, schedule: null, fee: 0, isFree: false, banner: null, lines: p.lines,
      }));

  const account = !user ? "guest" : profile?.role === "admin" ? "admin" : "student";
  return (
    <div className="bg-[#050505] text-white">
      <LandingNav account={account} />
      <main>
        <Hero heroImage={publicImage(SITE.heroImage)} />
        <Announcements />
        <Story />
        <Testimonials videoId={SITE.testimonialVideoId} />
        <ClassesCarousel classes={classes} />
        <Channels />
        <CtaOrbit />
        <Faq />
      </main>
      <LandingFooter />
    </div>
  );
}
