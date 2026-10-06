"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { CheckCircle2, Crown, FileText, Flame, PenLine, Trophy } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./section-title";
import { EASE } from "./motion-kit";

type Step = { title: string; text: string };
const ICONS = [PenLine, CheckCircle2, Trophy];

/** Scrollytelling: steps on the left, a sticky phone on the right that changes per step. */
export function HowItWorks() {
  const t = useT("landing.how");
  const steps = t.raw<Step[]>("steps") ?? [];
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 60%", "end 60%"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length)))));

  return (
    <section id="how" className="relative scroll-mt-24 py-28">
      <SectionTitle label={t("label")} title={t("title")} subtitle={t("subtitle")} />
      <div ref={ref} className="container mt-16 grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-[28vh] py-[8vh] lg:py-[20vh]">
          {steps.map((s, i) => {
            const Icon = ICONS[i] ?? FileText;
            const on = i === active;
            return (
              <motion.div key={i} animate={{ opacity: on ? 1 : 0.35, x: on ? 0 : -8 }} transition={{ duration: 0.5, ease: EASE }} className="relative pl-16">
                <span className={cn("absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-2xl transition-all duration-500",
                  on ? "bg-gradient-to-br from-teal-600 to-brand-500 text-white shadow-lg shadow-teal-600/30" : "bg-teal-50 text-teal-600 dark:bg-white/5")}>
                  <Icon className="h-6 w-6" />
                </span>
                <p className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-300">{t("step", { n: i + 1 })}</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-ink dark:text-white sm:text-3xl">{s.title}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-300">{s.text}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-[18vh] mx-auto w-[300px]">
            <div className="relative rounded-[44px] border-[10px] border-ink bg-ink p-0 shadow-[0_50px_100px_-30px_rgba(11,21,48,.55)] dark:border-slate-700">
              <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink dark:bg-slate-700" />
              <div className="relative h-[560px] overflow-hidden rounded-[34px] bg-gradient-to-b from-[#f3f9ff] to-white p-4 pt-10 dark:from-slate-900 dark:to-slate-950">
                <AnimatePresence mode="wait">
                  <motion.div key={active} initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.96 }} transition={{ duration: 0.5, ease: EASE }}>
                    {active === 0 ? <ScreenPaper t={t} /> : active === 1 ? <ScreenResult t={t} /> : <ScreenBoard t={t} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type TT = ReturnType<typeof useT>;
function ScreenPaper({ t }: { t: TT }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t("phone.thisWeek")}</p>
      <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-brand-500 p-4 text-white shadow-lg">
        <FileText className="h-6 w-6" />
        <p className="mt-3 font-display text-lg font-bold">{t("phone.paper")}</p>
        <p className="text-xs text-white/80">{t("phone.paperMeta")}</p>
      </div>
      {[0, 1, 2, 3].map((i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-white/5">
          <span className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-white/10" />
          <span className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-white/10"><motion.span className="block h-full rounded-full bg-teal-400" initial={{ width: 0 }} animate={{ width: `${40 + i * 15}%` }} transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }} /></span>
        </motion.div>
      ))}
    </div>
  );
}
function ScreenResult({ t }: { t: TT }) {
  const r = 60, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" strokeWidth="12" className="stroke-teal-100 dark:stroke-white/10" />
          <motion.circle cx="70" cy="70" r={r} fill="none" strokeWidth="12" strokeLinecap="round" stroke="url(#howRing)" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * 0.08 }} transition={{ duration: 1.4, ease: EASE }} />
          <defs><linearGradient id="howRing" x1="0" x2="1"><stop offset="0" stopColor="#1f7ae8" /><stop offset="1" stopColor="#41c9f5" /></linearGradient></defs>
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-4xl font-extrabold text-ink dark:text-white">92%</span>
      </div>
      <p className="mt-4 font-display text-xl font-bold text-ink dark:text-white">{t("phone.marks")}</p>
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 12 }} className="mt-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{t("phone.grade")}</motion.span>
      <div className="mt-6 grid w-full grid-cols-2 gap-2">
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-white/5"><p className="text-[10px] text-slate-400">{t("phone.island")}</p><p className="font-display text-lg font-bold text-ink dark:text-white">#4</p></div>
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-white/5"><p className="text-[10px] text-slate-400">Panadura</p><p className="font-display text-lg font-bold text-ink dark:text-white">#1</p></div>
      </div>
    </div>
  );
}
function ScreenBoard({ t }: { t: TT }) {
  const rows = ["Sanduni", "You", "Kavindu", "Nethmi", "Isuru"];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-bold text-ink dark:text-white">{t("phone.board")}</p>
        <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600 dark:bg-orange-500/10"><Flame className="h-3 w-3" /> 6</span>
      </div>
      {rows.map((n, i) => (
        <motion.div key={n} initial={{ opacity: 0, y: n === "You" ? 120 : 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n === "You" ? 0.4 : i * 0.08, type: "spring", stiffness: 140, damping: 16 }}
          className={cn("flex items-center gap-3 rounded-xl p-3 text-sm", n === "You" ? "bg-gradient-to-r from-teal-600 to-brand-500 text-white shadow-lg shadow-teal-600/30" : "bg-white shadow-sm dark:bg-white/5")}>
          <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-bold", i === 0 ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white" : n === "You" ? "bg-white/25" : "bg-slate-100 text-slate-500 dark:bg-white/10")}>
            {i === 0 ? <Crown className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span className={cn("flex-1 font-semibold", n !== "You" && "text-ink dark:text-white")}>{n === "You" ? t("phone.you") : n}</span>
          <span className={cn("font-display font-bold", n !== "You" && "text-teal-700 dark:text-teal-300")}>{[468, 455, 441, 430, 412][i]}</span>
        </motion.div>
      ))}
    </div>
  );
}
