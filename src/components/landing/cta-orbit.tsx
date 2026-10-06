"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useAnimationFrame } from "framer-motion";
import { BookOpen, Calculator, FileText, GraduationCap, PlayCircle, Sigma } from "lucide-react";
import { useT } from "@/i18n/client";

const ORBITS = [
  { rot: 0, dur: 22, Icon: Sigma },
  { rot: 60, dur: 28, Icon: PlayCircle },
  { rot: -60, dur: 34, Icon: FileText },
];

/** Atom-style orbit CTA. */
export function CtaOrbit() {
  const t = useT("landing.cta");
  return (
    <section className="relative overflow-hidden bg-[#050505] py-24">
      <div className="container">
        <div className="relative mx-auto aspect-square w-full max-w-[680px] sm:aspect-[1.25]">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(240,91,6,.16),transparent)]" />
          {ORBITS.map(({ rot, dur, Icon }, i) => (
            <div key={i} className="absolute inset-0" style={{ transform: `rotate(${rot}deg)` }}>
              <div className="absolute left-1/2 top-1/2 h-[34%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/10" />
              <OrbitDot dur={dur} delay={i * 5}><Icon className="h-4 w-4" style={{ transform: `rotate(${-rot}deg)` }} /></OrbitDot>
            </div>
          ))}
          {[BookOpen, Calculator, GraduationCap].map((Icon, i) => (
            <motion.span key={i} className="absolute grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[#110d0a] text-white/50"
              style={{ left: ["8%", "84%", "46%"][i], top: ["20%", "72%", "4%"][i] }}
              animate={{ y: [0, -10, 0] }} transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}>
              <Icon className="h-4 w-4" />
            </motion.span>
          ))}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center">
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[62%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,#050505_62%,rgba(5,5,5,.85)_78%,transparent)]" />
            <h2 className="text-sand max-w-md font-display text-3xl font-extrabold leading-[1.28] sm:text-5xl pb-3 sm:pb-4">{t("title")}</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55 sm:text-base">{t("text")}</p>
            <Link href="/register"
              className="mt-7 rounded-full border border-brand-500 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_40px_rgba(240,91,6,.35),inset_0_0_20px_rgba(240,91,6,.2)] transition hover:bg-brand-500">
              {t("button")}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** A glowing dot that travels along the ellipse. */
function OrbitDot({ dur, delay, children }: { dur: number; delay: number; children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useAnimationFrame((time) => {
    const a = ((time / 1000 + delay) / dur) * Math.PI * 2;
    if (ref.current) {
      ref.current.style.left = `${50 + 50 * Math.cos(a)}%`;
      ref.current.style.top = `${50 + 50 * Math.sin(a)}%`;
    }
  });
  return (
    <div className="absolute left-1/2 top-1/2 h-[34%] w-[92%] -translate-x-1/2 -translate-y-1/2">
      <span ref={ref} style={{ left: "100%", top: "50%" }}
        className="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-500 text-white shadow-[0_0_24px_rgba(240,91,6,.8)]">
        {children}
      </span>
    </div>
  );
}
