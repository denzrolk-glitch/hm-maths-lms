"use client";
import { motion } from "framer-motion";
import { useT } from "@/i18n/client";
import { SITE } from "@/content/site";
import { WhatsAppIcon } from "@/components/brand-icons";
import { SectionTitle } from "./section-title";

export function Channels() {
  const t = useT("landing.channels");
  return (
    <section id="channels" className="relative scroll-mt-24 py-24">
      <SectionTitle label={t("label")} title={t("title")} subtitle={t("subtitle")} />
      <div className="container mt-12 flex flex-wrap justify-center gap-6 sm:gap-10">
        {SITE.channels.map((c, i) => (
          <motion.a key={c.key} href={c.url} target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30, scale: 0.8 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, type: "spring" }}
            className="group flex w-28 flex-col items-center gap-3 text-center sm:w-32">
            <span className="relative grid h-24 w-24 place-items-center rounded-full border-4 border-white shadow-lift transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 dark:border-slate-900 sm:h-28 sm:w-28"
              style={{ background: `radial-gradient(circle at 30% 25%, ${c.color}, #0b0b0b 95%)` }}>
              <span className="font-display text-3xl font-black text-white">{c.badge}</span>
              <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#25D366] shadow-md dark:border-slate-900">
                <WhatsAppIcon mono className="h-4 w-4 text-white" />
              </span>
            </span>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700 dark:text-slate-200">{t(`items.${c.key}`)}</span>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
