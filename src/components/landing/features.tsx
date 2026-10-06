"use client";
import { motion } from "framer-motion";
import { Flame, MapPin, PlayCircle, Radio, Trophy, Truck, type LucideIcon } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./section-title";
import { EASE, TiltCard } from "./motion-kit";

const ITEMS: { key: string; icon: LucideIcon; tone: string; wide?: boolean }[] = [
  { key: "papers", icon: Trophy, tone: "from-amber-400 to-orange-500", wide: true },
  { key: "streaks", icon: Flame, tone: "from-rose-400 to-orange-500" },
  { key: "centers", icon: MapPin, tone: "from-teal-500 to-brand-500" },
  { key: "live", icon: Radio, tone: "from-pink-500 to-rose-500" },
  { key: "recordings", icon: PlayCircle, tone: "from-violet-500 to-indigo-600" },
  { key: "delivery", icon: Truck, tone: "from-emerald-400 to-teal-600", wide: true },
];

function Visual({ k }: { k: string }) {
  if (k === "papers") return (
    <div className="mt-6 flex h-24 items-end gap-2" aria-hidden>
      {[52, 64, 58, 76, 70, 88, 96].map((h, i) => (
        <motion.span key={i} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.08, duration: 0.9, ease: EASE }}
          style={{ height: `${h}%` }} className="w-full origin-bottom rounded-t-lg bg-gradient-to-t from-teal-600 to-brand-400 opacity-90 transition group-hover:opacity-100" />
      ))}
    </div>
  );
  if (k === "streaks") return (
    <div className="mt-5 flex gap-1.5" aria-hidden>
      {Array.from({ length: 7 }, (_, i) => (
        <motion.span key={i} initial={{ scale: 0, rotate: -90 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.07, type: "spring", stiffness: 260, damping: 14 }}
          className={cn("grid h-7 w-7 place-items-center rounded-full", i === 3 ? "bg-slate-100 dark:bg-white/10" : "bg-gradient-to-br from-orange-400 to-rose-500 text-white")}>
          {i !== 3 && <Flame className="h-3.5 w-3.5" />}
        </motion.span>
      ))}
    </div>
  );
  if (k === "delivery") return (
    <div className="relative mt-6 h-12 overflow-hidden rounded-full bg-teal-50 dark:bg-white/5" aria-hidden>
      <div className="absolute inset-y-0 left-4 right-4 my-auto h-0.5 border-t-2 border-dashed border-teal-300" />
      <motion.span initial={{ x: "-10%" }} whileInView={{ x: "560%" }} viewport={{ once: false }} transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.6 }}
        className="absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md"><Truck className="h-4 w-4" /></motion.span>
      <MapPin className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-rose-500" />
    </div>
  );
  return null;
}

/** Bento grid of 3D-tilt feature cards with cursor spotlight. */
export function Features() {
  const t = useT("landing.features");
  return (
    <section id="features" className="relative scroll-mt-24 py-28">
      <SectionTitle label={t("label")} title={t("title")} subtitle={t("subtitle")} />
      <div className="container mt-14 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, icon: Icon, tone, wide }, i) => (
          <motion.div key={key} className={cn(wide && "lg:col-span-2")}
            initial={{ opacity: 0, y: 50, rotateX: 18 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: (i % 3) * 0.1, duration: 0.9, ease: EASE }} style={{ transformPerspective: 1000 }}>
            <TiltCard max={7} className="h-full rounded-3xl">
              <div className="relative h-full overflow-hidden rounded-3xl border border-teal-100 bg-white p-6 shadow-soft transition-shadow duration-500 group-hover:shadow-lift dark:border-white/10 dark:bg-slate-900">
                <div className={cn("pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br opacity-10 transition duration-700 group-hover:scale-[1.8] group-hover:opacity-20", tone)} />
                <span style={{ transform: "translateZ(30px)" }} className={cn("relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition duration-500 group-hover:-rotate-6 group-hover:scale-110", tone)}><Icon className="h-6 w-6" /></span>
                <h3 className="relative mt-5 font-display text-lg font-bold text-ink dark:text-white">{t(`items.${key}.title`)}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t(`items.${key}.text`)}</p>
                <Visual k={key} />
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
