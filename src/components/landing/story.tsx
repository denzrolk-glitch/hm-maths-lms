"use client";
import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { FileCheck2, MapPinned, Sparkles, Trophy, Video, type LucideIcon } from "lucide-react";
import { useT } from "@/i18n/client";
import { SectionTitle } from "./section-title";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = { spark: Sparkles, map: MapPinned, video: Video, paper: FileCheck2, trophy: Trophy };
type Milestone = { icon: string; title: string; text: string };

/** Snake path through n rows in a 1000 × (n*300) box. */
function snake(n: number) {
  const h = 300;
  let d = "M 620 0";
  for (let i = 0; i < n; i++) {
    const y = i * h;
    const right = i % 2 === 0;
    d += ` C ${right ? 1100 : -100} ${y + 60}, ${right ? 1100 : -100} ${y + 240}, 500 ${y + 270}`;
    d += ` S ${right ? -60 : 1060} ${y + 300}, ${right ? 380 : 620} ${y + 300}`;
  }
  return { d, height: n * h };
}

export function Story() {
  const t = useT("landing.story");
  const items = t.raw<Milestone[]>("milestones") ?? [];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 25, mass: 0.4 });
  const { d, height } = snake(items.length);

  return (
    <section id="story" className="relative scroll-mt-24 overflow-hidden py-24">
      <SectionTitle label={t("label")} title={t("title")} />
      <div ref={ref} className="container relative mt-16">
        <svg viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="storyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f7ae8" /><stop offset="1" stopColor="#41c9f5" /></linearGradient>
          </defs>
          <path d={d} fill="none" stroke="rgba(31,122,232,.15)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <motion.path d={d} fill="none" stroke="url(#storyGrad)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" filter="url(#glow)"
            style={{ pathLength: progress }} strokeLinecap="round" />
        </svg>
        <div className="relative">
          {items.map((m, i) => {
            const Icon = ICONS[m.icon] ?? Sparkles;
            const left = i % 2 === 0;
            return (
              <div key={i} className={cn("flex min-h-[260px] items-center py-6 sm:min-h-[300px]", left ? "justify-start" : "justify-end")}>
                <motion.div
                  initial={{ opacity: 0, x: left ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-120px" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="flex max-w-md items-start gap-4 glass rounded-3xl p-4 shadow-lift sm:gap-5"
                >
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-brand-500 text-white shadow-lg shadow-teal-500/30 sm:h-24 sm:w-24">
                    <Icon className="h-9 w-9 sm:h-10 sm:w-10" />
                  </div>
                  <div className="pt-1">
                    <p className="font-mono text-xs text-teal-600 dark:text-teal-300">0{i + 1}</p>
                    <h3 className="mt-1 font-display text-lg font-bold text-ink dark:text-white sm:text-xl">{m.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{m.text}</p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
