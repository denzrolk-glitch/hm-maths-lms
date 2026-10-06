"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Crown, Flame, PlayCircle, Radio, Sparkles, Trophy } from "lucide-react";
import { useT } from "@/i18n/client";
import { Counter, EASE, Magnetic, SplitReveal, WordRotator } from "./motion-kit";

const SYMBOLS = [
  { s: "∫", x: "6%", y: "16%", z: 1.6, size: "text-5xl" },
  { s: "Σ", x: "88%", y: "10%", z: 1.2, size: "text-4xl" },
  { s: "π", x: "93%", y: "62%", z: 2, size: "text-3xl" },
  { s: "√x", x: "2%", y: "70%", z: 0.8, size: "text-3xl" },
  { s: "dy/dx", x: "58%", y: "92%", z: 1.4, size: "text-2xl" },
  { s: "∞", x: "46%", y: "4%", z: 0.6, size: "text-3xl" },
];

const RANK_SCORES = [96, 93, 91, 88];
const BOARD = [
  { n: "Sanduni P.", t: "Panadura", s: 96 },
  { n: "Kavindu F.", t: "Online", s: 93 },
  { n: "Nethmi S.", t: "Horana", s: 91 },
  { n: "Isuru J.", t: "Kalutara", s: 88 },
];

/** Animated product mock: score ring, live-reordering leaderboard and streak. */
function DashboardMock() {
  const t = useT("landing.hero.mock");
  const [order, setOrder] = useState([0, 1, 2, 3]);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setOrder((o) => { const n = [...o]; const i = Math.floor(Math.random() * 3); [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n; }), 2600);
    return () => clearInterval(id);
  }, [reduce]);
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="relative w-full rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-[0_40px_80px_-30px_rgba(23,92,211,.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">{t("week")}</span>
      </div>
      <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-4">
        <div className="relative h-[84px] w-[84px]">
          <svg viewBox="0 0 84 84" className="-rotate-90">
            <circle cx="42" cy="42" r={r} fill="none" strokeWidth="9" className="stroke-teal-100 dark:stroke-white/10" />
            <motion.circle cx="42" cy="42" r={r} fill="none" strokeWidth="9" strokeLinecap="round" stroke="url(#heroRing)" strokeDasharray={c}
              initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * 0.13 }} transition={{ delay: 1, duration: 1.8, ease: EASE }} />
            <defs><linearGradient id="heroRing" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#1f7ae8" /><stop offset="1" stopColor="#41c9f5" /></linearGradient></defs>
          </svg>
          <span className="absolute inset-0 grid place-items-center font-display text-xl font-extrabold text-ink dark:text-white"><Counter to={87} suffix="%" /></span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t("result")}</p>
          <p className="truncate font-display text-base font-bold text-ink dark:text-white">{t("paper")}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-bold">
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">#3 {t("island")}</span>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">#1 Panadura</span>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        {order.map((idx, rank) => {
          const b = BOARD[idx];
          return (
            <motion.div layout key={b.n} transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs ${rank === 0 ? "bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-500/10" : "bg-slate-50/80 dark:bg-white/5"}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${rank === 0 ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white" : "bg-white text-slate-500 dark:bg-white/10"}`}>
                {rank === 0 ? <Crown className="h-3 w-3" /> : rank + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold text-ink dark:text-white">{b.n}</span>
              <span className="hidden text-[10px] text-slate-400 sm:inline">{b.t}</span>
              <span className="font-display font-bold tabular-nums text-teal-700 dark:text-teal-300">{RANK_SCORES[rank] ?? b.s}</span>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {[1, 1, 1, 0, 1, 1, 1].map((on, i) => (
          <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1.4 + i * 0.07, duration: 0.5, ease: EASE }}
            className={`h-1.5 origin-bottom rounded-full ${on ? "bg-gradient-to-r from-teal-500 to-brand-400" : "bg-slate-200 dark:bg-white/10"}`} />
        ))}
      </div>
    </div>
  );
}

export function Hero({ heroImage }: { heroImage: string | null }) {
  const t = useT("landing.hero");
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // cursor → parallax + spotlight
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });
  const rotY = useTransform(sx, [0, 1], [-12, 12]);
  const rotX = useTransform(sy, [0, 1], [10, -10]);
  const spotX = useTransform(sx, (v) => `${v * 100}%`);
  const spotY = useTransform(sy, (v) => `${v * 100}%`);
  const spot = useMotionTemplate`radial-gradient(600px circle at ${spotX} ${spotY}, rgba(65,201,245,.22), transparent 55%)`;

  // scroll → hero recedes
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const contentY = useTransform(p, [0, 1], [0, 160]);
  const contentO = useTransform(p, [0, 0.7], [1, 0]);
  const sceneScale = useTransform(p, [0, 1], [1, 0.82]);
  const sceneY = useTransform(p, [0, 1], [0, 120]);

  const words = t.raw<string[]>("rotate") ?? [];
  const stats = [
    { to: 5, s: "", l: t("stats.centers") },
    { to: 4, s: "", l: t("stats.batches") },
    { to: 24, s: "/7", l: t("stats.access") },
  ];

  return (
    <section ref={ref}
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-28"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}>
      {/* aurora background */}
      <div className="bg-mesh absolute inset-0 -z-30" />
      <motion.div aria-hidden style={{ background: spot }} className="absolute inset-0 -z-20" />
      <div aria-hidden className="bg-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_50%_35%,black_10%,transparent_65%)]" />
      <div aria-hidden className="absolute -left-32 top-10 -z-10 h-[28rem] w-[28rem] animate-blob rounded-full bg-gradient-to-br from-brand-300/50 to-teal-300/30 blur-3xl" />
      <div aria-hidden className="absolute -right-32 bottom-0 -z-10 h-[32rem] w-[32rem] animate-blob rounded-full bg-gradient-to-br from-teal-300/40 to-indigo-300/30 blur-3xl [animation-delay:-7s]" />

      <div className="container grid grid-cols-1 items-center gap-14 pb-20 lg:grid-cols-[1.05fr_1fr]">
        <motion.div style={reduce ? undefined : { y: contentY, opacity: contentO }} className="relative z-10">
          <motion.p initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/80 py-1 pl-1 pr-3.5 text-xs font-semibold text-teal-800 shadow-sm backdrop-blur dark:border-teal-500/30 dark:bg-white/5 dark:text-teal-200">
            <span className="relative overflow-hidden rounded-full bg-gradient-to-r from-teal-600 to-brand-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {t("new")}
              <span aria-hidden className="absolute inset-0 -translate-x-full animate-[shine_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </span>
            {t("newText")}
          </motion.p>

          <motion.p initial={{ opacity: 0, letterSpacing: "0.6em" }} animate={{ opacity: 1, letterSpacing: "0.28em" }} transition={{ delay: 0.15, duration: 1.2, ease: EASE }}
            className="mt-7 text-xs font-semibold uppercase text-teal-600 dark:text-teal-300">{t("kicker")}</motion.p>

          <h1 className="mt-3 font-display text-[3.2rem] font-extrabold leading-[1.02] tracking-tight text-ink [perspective:800px] dark:text-white sm:text-7xl lg:text-[5.6rem]">
            <SplitReveal text={t("nameLine1")} by="char" delay={0.25} className="block" />
            <SplitReveal text={t("nameLine2")} by="char" delay={0.5} className="block" wordClassName="bg-gradient-to-r from-teal-600 via-teal-500 to-brand-400 bg-clip-text text-transparent" />
          </h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.8, ease: EASE }}
            className="mt-4 flex flex-wrap items-center gap-x-2.5 font-display text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
            <Sparkles className="h-6 w-6 shrink-0 text-brand-500" />
            <span>{t("taglineLead")}</span>
            {words.length ? <WordRotator words={words} className="text-teal-600 dark:text-teal-300" /> : null}
          </motion.p>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8, ease: EASE }}
            className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{t("description")}</motion.p>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25, duration: 0.8, ease: EASE }} className="mt-9 flex flex-wrap gap-3">
            <Magnetic>
              <Link href="/register" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 to-brand-500 px-7 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(31,122,232,.65)] transition-shadow hover:shadow-[0_22px_50px_-12px_rgba(31,122,232,.8)]">
                <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">{t("ctaPrimary")}</span>
                <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link href="/dashboard/free-zone" className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-white/80 px-7 py-4 text-sm font-semibold text-teal-800 shadow-sm backdrop-blur transition-colors hover:border-teal-400 dark:border-white/15 dark:bg-white/5 dark:text-white">
                <PlayCircle className="h-4 w-4" /> {t("ctaSecondary")}
              </Link>
            </Magnetic>
          </motion.div>

          <motion.dl initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.12, delayChildren: 1.45 } } }} className="mt-11 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((s) => (
              <motion.div key={s.l} variants={{ h: { opacity: 0, y: 16 }, s: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}>
                <dt className="font-display text-3xl font-extrabold text-ink dark:text-white"><Counter to={s.to} suffix={s.s} /></dt>
                <dd className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.l}</dd>
              </motion.div>
            ))}
          </motion.dl>
        </motion.div>

        {/* 3D scene */}
        <motion.div style={reduce ? undefined : { scale: sceneScale, y: sceneY }} className="relative mx-auto w-full max-w-[540px] [perspective:1200px]">
          <motion.div initial={{ opacity: 0, y: 60, rotateX: 25 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.4, duration: 1.3, ease: EASE }}
            style={reduce ? undefined : { rotateY: rotY, rotateX: rotX }} className="relative [transform-style:preserve-3d]">
            <div aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-br from-teal-400/30 via-brand-300/20 to-transparent blur-3xl" />
            <div className="absolute inset-[-14%] -z-10 animate-spin-slow rounded-full border-2 border-dashed border-teal-300/40" aria-hidden />
            {heroImage ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-gradient-to-br from-teal-600 to-brand-400 shadow-lift">
                <Image src={heroImage} alt={t("imageAlt")} fill priority sizes="(max-width: 1024px) 90vw, 540px" className="object-cover object-top" />
              </div>
            ) : (
              <div style={{ transform: "translateZ(40px)" }}><DashboardMock /></div>
            )}

            {/* floating chips at different depths */}
            <motion.div style={{ transform: "translateZ(90px)" }} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6, duration: 0.8, ease: EASE }}
              className="absolute -top-10 left-[2%] sm:-left-10">
              <motion.div animate={reduce ? undefined : { y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="glass flex items-center gap-3 rounded-2xl bg-white/90 px-3.5 py-2.5 shadow-lift dark:bg-slate-900/90">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Trophy className="h-4 w-4" /></span>
                <div><p className="text-xs font-bold text-ink dark:text-white">{t("cards.rank")}</p><p className="text-[10px] text-slate-500">{t("cards.rankSub")}</p></div>
              </motion.div>
            </motion.div>
            <motion.div style={{ transform: "translateZ(120px)" }} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.8, duration: 0.8, ease: EASE }}
              className="absolute -bottom-12 right-[4%] sm:-right-8">
              <motion.div animate={reduce ? undefined : { y: [0, 12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="glass flex items-center gap-3 rounded-2xl bg-white/90 px-3.5 py-2.5 shadow-lift dark:bg-slate-900/90">
                <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 text-white">
                  <Radio className="h-4 w-4" /><span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-rose-400" />
                </span>
                <div><p className="text-xs font-bold text-ink dark:text-white">{t("cards.live")}</p><p className="text-[10px] text-slate-500">{t("cards.liveSub")}</p></div>
              </motion.div>
            </motion.div>
            <motion.div style={{ transform: "translateZ(70px)" }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2, duration: 0.8, ease: EASE }}
              className="absolute -bottom-14 left-[2%] sm:-left-8">
              <motion.div animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                className="glass flex items-center gap-3 rounded-2xl bg-white/90 px-3.5 py-2.5 shadow-lift dark:bg-slate-900/90">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white"><Flame className="h-4 w-4 animate-flicker" /></span>
                <div><p className="text-xs font-bold text-ink dark:text-white">{t("cards.streak")}</p><p className="text-[10px] text-slate-500">{t("cards.streakSub")}</p></div>
              </motion.div>
            </motion.div>
          </motion.div>

          {SYMBOLS.map((s, i) => <FloatSymbol key={i} {...s} mx={sx} my={sy} delay={0.8 + i * 0.12} />)}
        </motion.div>
      </div>

      <motion.a href="#announcements" aria-label={t("scroll")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-teal-600/70 sm:flex">
        {t("scroll")}
        <span className="relative h-9 w-5 rounded-full border-2 border-teal-400/60">
          <motion.span className="absolute left-1/2 top-1.5 h-1.5 w-1 -translate-x-1/2 rounded-full bg-teal-500" animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
        </span>
        <ChevronDown className="h-3.5 w-3.5" />
      </motion.a>
    </section>
  );
}

function FloatSymbol({ s, x, y, z, size, mx, my, delay }: { s: string; x: string; y: string; z: number; size: string; mx: ReturnType<typeof useSpring>; my: ReturnType<typeof useSpring>; delay: number }) {
  const tx = useTransform(mx, [0, 1], [-30 * z, 30 * z]);
  const ty = useTransform(my, [0, 1], [-30 * z, 30 * z]);
  return (
    <motion.span aria-hidden style={{ left: x, top: y, x: tx, y: ty }} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.9, ease: EASE }}
      className={`pointer-events-none absolute select-none font-display font-bold text-teal-500/35 dark:text-teal-300/25 ${size}`}>
      {s}
    </motion.span>
  );
}
