"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./section-title";

type QA = { q: string; a: string };

export function Faq() {
  const t = useT("landing.faq");
  const items = t.raw<QA[]>("items") ?? [];
  const [open, setOpen] = useState<number | null>(0);
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, 5);

  return (
    <section id="support" className="relative scroll-mt-24 bg-[#050505] py-24">
      <SectionTitle label={t("label")} title={t("title")} />
      <div className="container mt-12 max-w-3xl space-y-3">
        {shown.map((it, i) => {
          const isOpen = open === i;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 5) * 0.05 }}
              className={cn("overflow-hidden rounded-2xl border transition-colors", isOpen ? "border-brand-500/40 bg-[#1a1410]" : "border-white/5 bg-[#14110e] hover:border-white/15")}>
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5">
                <span className="font-display text-[15px] font-semibold text-white sm:text-base">{it.q}</span>
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full transition", isOpen ? "rotate-45 bg-brand-500 text-white" : "bg-white/5 text-white/70")}>
                  <Plus className="h-4 w-4" />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <p className="px-5 pb-5 text-sm leading-relaxed text-white/60 sm:px-6">{it.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {items.length > 5 && (
          <div className="pt-4 text-center">
            <button type="button" onClick={() => setAll((v) => !v)}
              className="rounded-full border border-white/15 px-6 py-2.5 text-sm font-semibold text-white/80 transition hover:border-brand-500 hover:text-white">
              {all ? t("less") : t("more")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
