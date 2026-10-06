"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Flame, MapPin, PlayCircle, Radio, Sparkles, Trophy } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { useT } from "@/i18n/client";

const SYMBOLS = [
  { s: "∫", x: "4%", y: "14%", d: 0 },
  { s: "Σ", x: "82%", y: "6%", d: 0.6 },
  { s: "π", x: "90%", y: "56%", d: 1.2 },
  { s: "√x", x: "0%", y: "62%", d: 0.9 },
  { s: "dy/dx", x: "60%", y: "88%", d: 0.3 },
];
const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero({ heroImage }: { heroImage: string | null }) {
  const t = useT("landing.hero");
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const px = useTransform(sx, (v) => v * 18);
  const py = useTransform(sy, (v) => v * 18);
  const pxr = useTransform(sx, (v) => v * -10);
  const pyr = useTransform(sy, (v) => v * -10);

  const stats = [
    { v: "5", l: t("stats.centers") },
    { v: "HD", l: t("stats.recordings") },
    { v: "24/7", l: t("stats.access") },
  ];

  return (
    <section
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-28"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      <div className="bg-mesh absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_at_50%_30%,black_20%,transparent_70%)]" />
      <div className="absolute -left-24 top-24 -z-10 h-80 w-80 animate-blob rounded-full bg-brand-300/40 blur-3xl" />
      <div className="absolute -right-24 bottom-10 -z-10 h-96 w-96 animate-blob rounded-full bg-teal-300/40 blur-3xl [animation-delay:-8s]" />

      <div className="container grid grid-cols-1 items-center gap-12 pb-16 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/80 py-1 pl-1 pr-3.5 text-xs font-semibold text-teal-800 shadow-sm backdrop-blur dark:border-teal-500/30 dark:bg-white/5 dark:text-teal-200">
            <span className="rounded-full bg-gradient-to-r from-teal-600 to-brand-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">{t("new")}</span>
            {t("newText")}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
            className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-teal-600 dark:text-teal-300">{t("kicker")}</motion.p>
          <h1 className="mt-3 font-display text-[3.1rem] font-extrabold leading-[1.08] tracking-tight text-ink dark:text-white sm:text-7xl lg:text-[5.2rem]">
            {[t("nameLine1"), t("nameLine2")].map((line, i) => (
              <motion.span key={i} className={i ? "text-gradient block pb-2" : "block"}
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.8, ease: EASE }}>
                {line}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55, duration: 0.6 }}
            className="mt-3 flex items-center gap-2 font-display text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
            <Sparkles className="h-6 w-6 shrink-0 text-brand-500" /> <span className="pb-1 leading-snug">{t("tagline")}</span>
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{t("description")}</motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/35">
              {t("ctaPrimary")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link href="/dashboard/free-zone" className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-white/80 px-7 py-3.5 text-sm font-semibold text-teal-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-teal-400 dark:border-white/15 dark:bg-white/5 dark:text-white">
              <PlayCircle className="h-4 w-4" /> {t("ctaSecondary")}
            </Link>
          </motion.div>
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.6 }} className="mt-10 flex flex-wrap gap-8">
            {stats.map((s) => (
              <div key={s.l}>
                <dt className="font-display text-3xl font-extrabold text-ink dark:text-white">{s.v}</dt>
                <dd className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[560px]">
          <motion.div style={{ x: pxr, y: pyr }} className="absolute inset-0">
            <div className="absolute inset-[4%] animate-spin-slow rounded-full border-2 border-dashed border-teal-300/50" />
            <div className="absolute inset-[14%] rounded-full bg-gradient-to-br from-teal-100 via-white to-brand-100 shadow-[inset_0_0_60px_rgba(31,122,232,.15)] dark:from-teal-500/10 dark:via-transparent dark:to-brand-500/10" />
          </motion.div>

          {heroImage ? (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1, ease: EASE }}
              className="absolute inset-x-[4%] bottom-0 top-[2%]">
              <Image src={heroImage} alt={t("imageAlt")} fill priority sizes="(max-width: 1024px) 90vw, 560px"
                className="object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_82%,transparent)]" />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1, ease: EASE }}
              className="absolute inset-[22%] grid place-items-center">
              <div className="relative grid h-full w-full place-items-center rounded-[40%] bg-gradient-to-br from-teal-600 via-teal-500 to-brand-400 shadow-2xl shadow-teal-600/30">
                <LogoMark tone="current" className="h-1/2 w-1/2 text-white" />
              </div>
            </motion.div>
          )}

          {/* floating cards */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
            transition={{ opacity: { delay: 0.9 }, x: { delay: 0.9, duration: 0.6 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
            className="glass absolute left-0 top-[18%] flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lift">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Trophy className="h-5 w-5" /></span>
            <div><p className="text-xs font-semibold text-ink dark:text-white">{t("cards.rank")}</p><p className="text-[11px] text-slate-500">{t("cards.rankSub")}</p></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0, y: [0, 12, 0] }}
            transition={{ opacity: { delay: 1.1 }, x: { delay: 1.1, duration: 0.6 }, y: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}
            className="glass absolute right-0 top-[44%] flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lift">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 text-white"><Radio className="h-5 w-5 animate-pulse" /></span>
            <div><p className="text-xs font-semibold text-ink dark:text-white">{t("cards.live")}</p><p className="text-[11px] text-slate-500">{t("cards.liveSub")}</p></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ opacity: { delay: 1.3 }, y: { duration: 6.5, repeat: Infinity, ease: "easeInOut" } }}
            className="glass absolute bottom-[8%] left-[8%] flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lift">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-brand-500 text-white"><Flame className="h-5 w-5" /></span>
            <div><p className="text-xs font-semibold text-ink dark:text-white">{t("cards.streak")}</p><p className="flex items-center gap-1 text-[11px] text-slate-500"><MapPin className="h-3 w-3" /> {t("cards.streakSub")}</p></div>
          </motion.div>

          <motion.div style={{ x: px, y: py }} className="pointer-events-none absolute inset-0">
            {SYMBOLS.map((tile, i) => (
              <motion.span key={i} className="absolute font-display text-2xl font-bold text-teal-500/40 dark:text-teal-300/30" style={{ left: tile.x, top: tile.y }}
                initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
                transition={{ opacity: { delay: 0.6 + tile.d, duration: 0.6 }, scale: { delay: 0.6 + tile.d, duration: 0.6 }, y: { duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: tile.d } }}>
                {tile.s}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.a href="#announcements" aria-label={t("scroll")} initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.4 }, y: { repeat: Infinity, duration: 2 } }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-teal-500/60 hover:text-teal-700 sm:block">
        <ChevronDown className="h-6 w-6" />
      </motion.a>
    </section>
  );
}
