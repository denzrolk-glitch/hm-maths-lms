"use client";
import { motion } from "framer-motion";
import { useT } from "@/i18n/client";
import { SITE } from "@/content/site";
import { SectionTitle } from "./section-title";

export function Channels() {
  const t = useT("landing.channels");
  return (
    <section id="channels" className="relative scroll-mt-24 bg-[#050505] py-24">
      <SectionTitle label={t("label")} title={t("title")} subtitle={t("subtitle")} />
      <div className="container mt-12 flex flex-wrap justify-center gap-6 sm:gap-10">
        {SITE.channels.map((c, i) => (
          <motion.a key={c.key} href={c.url} target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30, scale: 0.8 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, type: "spring" }}
            className="group flex w-28 flex-col items-center gap-3 text-center sm:w-32">
            <span className="relative grid h-24 w-24 place-items-center rounded-full border-2 border-white/10 transition group-hover:scale-105 group-hover:border-brand-500 group-hover:shadow-[0_0_40px_rgba(240,91,6,.35)] sm:h-28 sm:w-28"
              style={{ background: `radial-gradient(circle at 30% 25%, ${c.color}, #0b0b0b 85%)` }}>
              <span className="font-display text-3xl font-black text-white">{c.badge}</span>
              <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-[#050505] bg-[#25D366]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2Z" /></svg>
              </span>
            </span>
            <span className="text-sm font-semibold text-white/80 group-hover:text-white">{t(`items.${c.key}`)}</span>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
