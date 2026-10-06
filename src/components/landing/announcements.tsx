"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Megaphone } from "lucide-react";
import { useT } from "@/i18n/client";

/** Vertical pill ticker with up/down chevrons. */
export function Announcements() {
  const t = useT("landing.announcements");
  const items = t.raw<string[]>("items") ?? [];
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setInterval(() => { setDir(1); setI((v) => (v + 1) % items.length); }, 3500);
    return () => clearInterval(id);
  }, [paused, items.length]);

  if (!items.length) return null;
  const go = (d: number) => { setDir(d); setI((v) => (v + d + items.length) % items.length); };

  return (
    <section id="announcements" className="relative scroll-mt-28 bg-[#050505] py-14">
      <div className="container flex justify-center" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="flex w-full max-w-3xl items-center gap-3 rounded-full border border-white/10 bg-[#100d0b] p-2 pl-3 shadow-[0_0_60px_rgba(240,91,6,.08)]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-500"><Megaphone className="h-5 w-5" /></span>
          <div className="relative h-10 min-w-0 flex-1 overflow-hidden" aria-live="polite">
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.div key={i} custom={dir}
                variants={{ enter: (d: number) => ({ y: d > 0 ? 40 : -40, opacity: 0 }), center: { y: 0, opacity: 1 }, exit: (d: number) => ({ y: d > 0 ? -40 : 40, opacity: 0 }) }}
                initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: "easeOut" }}
                className="absolute inset-0 flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 rounded-md bg-brand-500/20 px-2.5 py-1 text-xs font-semibold text-brand-400 leading-none">
                  {t("label")}
                </span>
                <span className="truncate text-sm font-medium text-white/90 sm:text-[15px] leading-normal pb-0.5">
                  {items[i]}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex shrink-0 flex-col">
            <button type="button" onClick={() => go(-1)} aria-label={t("previous")} className="grid h-5 w-8 place-items-center rounded-full text-white/50 hover:text-brand-500"><ChevronUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => go(1)} aria-label={t("next")} className="grid h-5 w-8 place-items-center rounded-full text-white/50 hover:text-brand-500"><ChevronDown className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
