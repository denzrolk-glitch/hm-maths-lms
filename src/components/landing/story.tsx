"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { FileCheck2, MapPinned, Sparkles, Trophy, Video, type LucideIcon } from "lucide-react";
import { useT } from "@/i18n/client";
import { SectionTitle } from "./section-title";

const ICONS: Record<string, LucideIcon> = { spark: Sparkles, map: MapPinned, video: Video, paper: FileCheck2, trophy: Trophy };
const TONES = ["from-teal-500 to-brand-500", "from-emerald-400 to-teal-600", "from-violet-500 to-fuchsia-500", "from-amber-400 to-orange-500", "from-emerald-400 to-teal-600"];
type Milestone = { icon: string; title: string; text: string };

/** Pinned section: vertical scroll drives a horizontal journey of milestone cards. */
export function Story() {
  const t = useT("landing.story");
  const items = t.raw<Milestone[]>("milestones") ?? [];
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 });
  const [vw, setVw] = useState(1280);
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    on(); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on);
  }, []);
  const slideW = vw < 640 ? vw * 0.86 : Math.min(560, vw * 0.5);
  const x = useTransform(p, [0, 1], [0, -Math.max(0, items.length - 1) * slideW]);
  const line = useTransform(p, [0, 1], [0, 1]);

  if (reduce) {
    return (
      <section id="story" className="scroll-mt-24 py-24">
        <SectionTitle label={t("label")} title={t("title")} />
        <div className="container mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((m, i) => <Card key={i} m={m} i={i} />)}</div>
      </section>
    );
  }
  return (
    <section id="story" ref={ref} className="relative scroll-mt-24" style={{ height: `${items.length * 70 + 60}vh` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <SectionTitle label={t("label")} title={t("title")} />
        <div className="relative mt-10">
          <div className="container relative mb-8 h-1 overflow-hidden rounded-full bg-teal-100 dark:bg-white/10">
            <motion.div style={{ scaleX: line }} className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-teal-600 to-brand-400" />
          </div>
          <motion.div style={{ x, paddingLeft: (vw - slideW) / 2 }} className="flex w-max">
            {items.map((m, i) => <Slide key={i} m={m} i={i} n={items.length} p={p} w={slideW} />)}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Slide({ m, i, n, p, w: width }: { m: Milestone; i: number; n: number; p: MotionValue<number>; w: number }) {
  const c = n > 1 ? i / (n - 1) : 0;
  const w = 1 / Math.max(1, n - 1);
  const scale = useTransform(p, [c - w, c, c + w], [0.88, 1, 0.88]);
  const opacity = useTransform(p, [c - w, c, c + w], [0.45, 1, 0.45]);
  const rotate = useTransform(p, [c - w, c, c + w], [6, 0, -6]);
  return (
    <div className="flex shrink-0 justify-center px-3 sm:px-4" style={{ width }}>
      <motion.div style={{ scale, opacity, rotateY: rotate, transformPerspective: 1200 }} className="w-full max-w-xl">
        <Card m={m} i={i} />
      </motion.div>
    </div>
  );
}

function Card({ m, i }: { m: Milestone; i: number }) {
  const Icon = ICONS[m.icon] ?? Sparkles;
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-teal-100 bg-white/90 p-8 shadow-lift backdrop-blur dark:border-white/10 dark:bg-slate-900/80 sm:p-10">
      <span aria-hidden className="pointer-events-none absolute -right-4 -top-10 select-none font-display text-[10rem] font-black leading-none text-teal-500/[0.07]">0{i + 1}</span>
      <span className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${TONES[i % TONES.length]}`}><Icon className="h-8 w-8" /></span>
      <p className="mt-6 font-mono text-xs font-semibold text-teal-600 dark:text-teal-300">0{i + 1}</p>
      <h3 className="mt-1 font-display text-2xl font-bold text-ink dark:text-white sm:text-3xl">{m.title}</h3>
      <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">{m.text}</p>
    </div>
  );
}
