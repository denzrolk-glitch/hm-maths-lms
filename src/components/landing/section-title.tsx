"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function HexIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} aria-hidden>
      <path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/** Orange hex label + big sand-gradient heading. */
export function SectionTitle({ label, title, subtitle, className, align = "center" }: {
  label: string; title: string; subtitle?: string; className?: string; align?: "center" | "left";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={cn(align === "center" ? "mx-auto text-center" : "", "max-w-3xl px-5", className)}
    >
      <p className={cn("flex items-center gap-2 text-sm font-medium text-brand-500", align === "center" && "justify-center")}>
        <HexIcon /> {label}
      </p>
      <h2 className="text-sand mt-3 font-display text-[2rem] font-extrabold leading-[1.3] sm:text-5xl md:text-6xl pb-3 sm:pb-4 px-1">{title}</h2>
      {subtitle ? <p className="mt-3 text-base leading-relaxed text-white/55 sm:text-lg">{subtitle}</p> : null}
    </motion.div>
  );
}
