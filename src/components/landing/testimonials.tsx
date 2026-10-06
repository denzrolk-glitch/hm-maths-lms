"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Quote, Star, X } from "lucide-react";
import { useT } from "@/i18n/client";
import { initials } from "@/lib/utils";
import { SectionTitle } from "./section-title";
import { EASE } from "./motion-kit";

type Item = { name: string; meta: string; text: string };

function QuoteCard({ it }: { it: Item }) {
  return (
    <figure className="group mx-2.5 w-[320px] shrink-0 rounded-3xl border border-teal-100 bg-white p-6 shadow-soft transition duration-500 hover:-translate-y-1.5 hover:rotate-[-0.6deg] hover:shadow-lift dark:border-white/10 dark:bg-slate-900 sm:w-[380px]">
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5 text-amber-400">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
        <Quote className="h-6 w-6 text-teal-200 transition group-hover:text-teal-400" />
      </div>
      <blockquote className="mt-4 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">“{it.text}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-brand-400 text-sm font-bold text-white">{initials(it.name)}</span>
        <span><span className="block text-sm font-semibold text-ink dark:text-white">{it.name}</span><span className="block text-xs text-slate-500">{it.meta}</span></span>
      </figcaption>
    </figure>
  );
}

function Row({ items, reverse, duration }: { items: Item[]; reverse?: boolean; duration: number }) {
  return (
    <div className="group/row flex overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex shrink-0 animate-marquee group-hover/row:[animation-play-state:paused]" style={{ animationDuration: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}>
        {[...items, ...items, ...items, ...items].map((it, i) => <QuoteCard key={i} it={it} />)}
      </div>
    </div>
  );
}

export function Testimonials({ videoId }: { videoId: string }) {
  const t = useT("landing.testimonials");
  const items = t.raw<Item[]>("items") ?? [];
  const [open, setOpen] = useState(false);
  const half = Math.ceil(items.length / 2);
  const a = items.length > 3 ? items.slice(0, half) : items;
  const b = items.length > 3 ? items.slice(half) : items;
  return (
    <section id="testimonials" className="relative scroll-mt-24 overflow-hidden py-28">
      <SectionTitle label={t("label")} title={t("title")} />
      {videoId && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE }} className="mt-8 flex justify-center">
          <button type="button" onClick={() => setOpen(true)} className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 text-sm font-semibold text-teal-800 shadow-lift transition hover:-translate-y-0.5 dark:bg-slate-900 dark:text-white">
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-teal-600 to-brand-500 text-white">
              <span className="absolute inset-0 animate-ping rounded-full bg-teal-400/40" /><Play className="relative h-4 w-4 fill-white" />
            </span>
            {t("watch")}
          </button>
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 1, ease: EASE }} className="mt-12">
        <Row items={a} duration={a.length * 22} />
        <Row items={b} duration={b.length * 26} reverse />
      </motion.div>
      <AnimatePresence>
        {open && videoId && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-ink/70 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-3xl bg-black shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <iframe className="absolute inset-0 h-full w-full" title={t("watch")} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`} />
              <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white"><X className="h-4 w-4" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
