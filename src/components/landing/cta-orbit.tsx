"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Calculator, FileText, GraduationCap, PlayCircle, Sigma } from "lucide-react";
import { useT } from "@/i18n/client";

const FLOAT = [
  { Icon: Sigma, x: "6%", y: "18%" }, { Icon: PlayCircle, x: "88%", y: "14%" }, { Icon: FileText, x: "80%", y: "70%" },
  { Icon: BookOpen, x: "12%", y: "72%" }, { Icon: Calculator, x: "48%", y: "6%" }, { Icon: GraduationCap, x: "46%", y: "84%" },
];

/** Blue gradient call-to-action band with floating icons. */
export function CtaOrbit() {
  const t = useT("landing.cta");
  return (
    <section className="relative py-20">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-gradient-to-br from-teal-700 via-teal-600 to-brand-500 px-6 py-16 text-center text-white shadow-lift sm:px-12 sm:py-20">
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 animate-blob rounded-full bg-brand-300/40 blur-3xl" />
          {FLOAT.map(({ Icon, x, y }, i) => (
            <motion.span key={i} className="pointer-events-none absolute grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white/80 ring-1 ring-white/25 backdrop-blur"
              style={{ left: x, top: y }} animate={{ y: [0, -12, 0], rotate: [0, 6, 0] }} transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}>
              <Icon className="h-5 w-5" />
            </motion.span>
          ))}
          <div className="relative mx-auto max-w-xl">
            <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-5xl">{t("title")}</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/85 sm:text-base">{t("text")}</p>
            <Link href="/register" className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-semibold text-teal-700 shadow-xl transition hover:-translate-y-0.5">
              {t("button")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
