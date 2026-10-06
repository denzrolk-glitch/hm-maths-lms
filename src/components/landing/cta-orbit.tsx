"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, BookOpen, Calculator, FileText, GraduationCap, PlayCircle, Sigma } from "lucide-react";
import { useT } from "@/i18n/client";
import { Magnetic, SplitReveal } from "./motion-kit";

const FLOAT = [
  { Icon: Sigma, x: "8%", y: "20%", d: 1.4 }, { Icon: PlayCircle, x: "86%", y: "16%", d: 0.8 }, { Icon: FileText, x: "80%", y: "72%", d: 1.8 },
  { Icon: BookOpen, x: "12%", y: "74%", d: 1 }, { Icon: Calculator, x: "50%", y: "8%", d: 0.6 }, { Icon: GraduationCap, x: "48%", y: "86%", d: 1.2 },
];

/** Scroll-driven circular reveal CTA. */
export function CtaOrbit() {
  const t = useT("landing.cta");
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const p = useSpring(scrollYProgress, { stiffness: 100, damping: 28 });
  const radius = useTransform(p, [0, 1], [8, 85]);
  const clip = useMotionTemplate`circle(${radius}% at 50% 50%)`;
  const iconsY = useTransform(p, [0, 1], [60, 0]);
  return (
    <section ref={ref} className="relative py-24">
      <div className="container">
        <motion.div style={reduce ? undefined : { clipPath: clip }}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-gradient-to-br from-teal-700 via-teal-600 to-brand-500 px-6 py-24 text-center text-white shadow-lift sm:px-12 sm:py-32">
          <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-20" />
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-brand-300/40 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 animate-blob rounded-full bg-indigo-400/30 blur-3xl [animation-delay:-9s]" />
          {FLOAT.map(({ Icon, x, y, d }, i) => (
            <motion.span key={i} aria-hidden style={{ left: x, top: y, y: iconsY }} className="pointer-events-none absolute">
              <motion.span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-white/85 ring-1 ring-white/25 backdrop-blur"
                animate={reduce ? undefined : { y: [0, -14, 0], rotate: [0, 8, 0] }} transition={{ duration: 3 + d * 2, repeat: Infinity, ease: "easeInOut" }}>
                <Icon className="h-5 w-5" />
              </motion.span>
            </motion.span>
          ))}
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-4xl font-extrabold leading-[1.1] sm:text-6xl"><SplitReveal text={t("title")} /></h2>
            <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.8 }}
              className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">{t("text")}</motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.8 }} className="mt-10">
              <Magnetic>
                <Link href="/register" className="group inline-flex items-center gap-2 rounded-2xl bg-white px-9 py-4 text-base font-semibold text-teal-700 shadow-2xl transition hover:shadow-[0_20px_60px_-10px_rgba(255,255,255,.6)]">
                  {t("button")} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Magnetic>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
