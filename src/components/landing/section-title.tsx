"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function HexIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} aria-hidden>
      <path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/** Pill label + big blue-gradient heading. */
export function SectionTitle({ label, title, subtitle, className, align = "center" }: {
  label: string; title: string; subtitle?: string; className?: string; align?: "center" | "left";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(align === "center" ? "mx-auto text-center" : "", "max-w-3xl px-5", className)}
    >
      <p className={cn("inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 shadow-sm backdrop-blur dark:border-teal-500/30 dark:bg-white/5 dark:text-teal-300")}>
        <Sparkles className="h-3.5 w-3.5" /> {label}
      </p>
      <h2 className="mt-4 px-1 pb-2 font-display text-[2rem] font-extrabold leading-[1.2] tracking-tight text-ink dark:text-white sm:text-5xl">
        <span className="text-gradient">{title}</span>
      </h2>
      {subtitle ? <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">{subtitle}</p> : null}
    </motion.div>
  );
}
