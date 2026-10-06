"use client";
import { motion } from "framer-motion";
import { Flame, MapPin, PlayCircle, Radio, Trophy, Truck, type LucideIcon } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./section-title";

const ITEMS: { key: string; icon: LucideIcon; tone: string; wide?: boolean }[] = [
  { key: "papers", icon: Trophy, tone: "from-amber-400 to-orange-500", wide: true },
  { key: "streaks", icon: Flame, tone: "from-rose-400 to-orange-500" },
  { key: "centers", icon: MapPin, tone: "from-teal-500 to-brand-500" },
  { key: "live", icon: Radio, tone: "from-pink-500 to-rose-500" },
  { key: "recordings", icon: PlayCircle, tone: "from-violet-500 to-indigo-600" },
  { key: "delivery", icon: Truck, tone: "from-emerald-400 to-teal-600", wide: true },
];

/** Bento grid of platform features. */
export function Features() {
  const t = useT("landing.features");
  return (
    <section id="features" className="relative scroll-mt-24 py-24">
      <SectionTitle label={t("label")} title={t("title")} subtitle={t("subtitle")} />
      <div className="container mt-12 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, icon: Icon, tone, wide }, i) => (
          <motion.div key={key} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: (i % 4) * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={cn("group relative overflow-hidden rounded-3xl border border-teal-100 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift dark:border-white/10 dark:bg-slate-900", wide && "lg:col-span-2")}>
            <div className={cn("pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 transition duration-500 group-hover:scale-150 group-hover:opacity-20", tone)} />
            <span className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition group-hover:rotate-6", tone)}><Icon className="h-6 w-6" /></span>
            <h3 className="mt-5 font-display text-lg font-bold text-ink dark:text-white">{t(`items.${key}.title`)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t(`items.${key}.text`)}</p>
            {key === "papers" && (
              <div className="mt-5 flex items-end gap-2" aria-hidden>
                {[62, 78, 70, 88, 94].map((h, k) => (
                  <motion.span key={k} initial={{ height: 0 }} whileInView={{ height: h * 0.6 }} viewport={{ once: true }} transition={{ delay: 0.3 + k * 0.1, duration: 0.7 }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-teal-600 to-brand-400" />
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
