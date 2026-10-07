"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type Slide = { title: string; text: string; cta: string; href: string; theme: "orange" | "teal" | "dark" | "purple"; symbol?: string };
const THEMES: Record<Slide["theme"], string> = {
  orange: "from-[#f05b06] via-[#f97316] to-[#fbbf24] text-white",
  teal: "from-[#14524f] via-[#1f807b] to-[#2bb3aa] text-white",
  dark: "from-[#0b0b0b] via-[#1d1a17] to-[#3b1d0b] text-white",
  purple: "from-[#3b0764] via-[#6d28d9] to-[#a855f7] text-white",
};

export function BannerCarousel() {
  const t = useT("portal.dashboard");
  const slides = t.raw<Slide[]>("banners") ?? [];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);
  if (!slides.length) return null;
  const s = slides[i]!;
  return (
    <div className="relative h-full min-h-[240px] overflow-hidden rounded-3xl shadow-lift">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={i} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("absolute inset-0 flex flex-col justify-center bg-gradient-to-br p-7 sm:p-9", THEMES[s.theme] ?? THEMES.orange)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,.25),transparent_45%)]" />
          <span className="absolute -right-4 -top-8 select-none font-display text-[13rem] font-black leading-none text-white/15">{s.symbol ?? "∫"}</span>
          <div className="relative max-w-md">
            <h2 className="font-display text-2xl font-extrabold leading-snug sm:text-3xl pb-1">{s.title}</h2>
            <p className="mt-2 text-sm text-white/85 sm:text-base">{s.text}</p>
            {s.cta ? <Link href={s.href} className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5">{s.cta}</Link> : null}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, k) => (
          <button key={k} type="button" onClick={() => setI(k)} aria-label={t("slide", { n: k + 1 })}
            className={cn("h-1.5 rounded-full transition-all", k === i ? "w-6 bg-white" : "w-1.5 bg-white/50")} />
        ))}
      </div>
    </div>
  );
}
