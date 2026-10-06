"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarClock, MapPin } from "lucide-react";
import { ClassBanner } from "@/components/class-banner";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./section-title";

export type CarouselClass = {
  id: string | null; title: string; type: string; year: number | null; town: string | null;
  schedule: string | null; fee: number; isFree: boolean; lines: string[]; banner: string | null;
};

export function ClassesCarousel({ classes }: { classes: CarouselClass[] }) {
  const t = useT("landing.classes");
  const tc = useT("common");
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const w = card ? card.offsetWidth + 20 : 1;
    setActive(Math.min(classes.length - 1, Math.round(el.scrollLeft / w)));
  }, [classes.length]);

  useEffect(() => { onScroll(); }, [onScroll]);
  const go = (idx: number) => {
    const el = track.current;
    const card = el?.children[idx] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };

  return (
    <section id="classes" className="relative scroll-mt-24 bg-[#050505] py-24">
      <SectionTitle label={t("label")} title={t("title")} subtitle={t("subtitle")} />
      <div className="container mt-12">
        <div ref={track} onScroll={onScroll} className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-4">
          {classes.map((c, i) => {
            const href = c.id ? (c.isFree ? "/dashboard/free-zone" : `/dashboard/store/class/${c.id}`) : "/register";
            return (
              <motion.div key={(c.id ?? "p") + i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: Math.min(i, 4) * 0.08, duration: 0.6 }}
                className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%]">
                <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#0f0d0b] transition hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-[0_0_50px_rgba(240,91,6,.15)]">
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                      <span className="rounded-full bg-brand-500/15 px-2.5 py-1 text-brand-400">{tc(`classTypes.${c.type}`)}</span>
                      {c.year ? <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/60">{tc("alBatch", { year: c.year })}</span> : null}
                    </div>
                    <h3 className="mt-4 font-display text-xl font-bold text-white group-hover:text-brand-400">{c.title}</h3>
                    {c.lines.length ? (
                      <>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/35">{t("thisMonth")}</p>
                        <ul className="mt-2 space-y-1.5">
                          {c.lines.map((l, k) => (
                            <li key={k} className="flex gap-2 text-sm text-white/65"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-500" />{l}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    <div className="mt-4 space-y-1 text-xs text-white/45">
                      {c.town ? <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{tc(`towns.${c.town}`)}</p> : null}
                      {c.schedule ? <p className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /><span className="line-clamp-1">{c.schedule}</span></p> : null}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="font-display text-lg font-bold text-white">
                        {!c.id ? null : c.isFree ? t("free") : t("perMonth", { amount: `LKR ${c.fee.toLocaleString("en-LK")}` })}
                      </span>
                      <span className="text-sm font-semibold text-brand-500">{t("enroll")} →</span>
                    </div>
                  </div>
                  <ClassBanner cls={{ banner_url: c.banner, class_type: c.type as never, title: c.title }} className="aspect-[16/9]" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {classes.map((_, i) => (
              <button key={i} type="button" onClick={() => go(i)} aria-label={t("goTo", { n: i + 1 })}
                className={cn("h-2 rounded-full transition-all", i === active ? "w-7 bg-brand-500" : "w-2 bg-white/20 hover:bg-white/40")} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/store" className="mr-2 hidden text-sm font-semibold text-white/70 hover:text-white sm:block">{t("viewAll")}</Link>
            <button type="button" onClick={() => go(Math.max(0, active - 1))} aria-label={t("previous")}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white hover:border-brand-500 hover:text-brand-500"><ArrowLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => go(Math.min(classes.length - 1, active + 1))} aria-label={t("next")}
              className="grid h-11 w-11 place-items-center rounded-full bg-brand-500 text-white hover:bg-brand-400"><ArrowRight className="h-5 w-5" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
