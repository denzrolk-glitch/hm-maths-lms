"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const SYMBOLS = ["∫", "Σ", "π", "√", "∞", "dy/dx", "θ", "λ", "∂", "→"];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] opacity-60" />
      <div className="absolute -top-40 left-1/2 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500/25 via-indigo-400/20 to-sky-400/25 blur-3xl" />
      {SYMBOLS.map((s, i) => (
        <motion.span
          key={s}
          aria-hidden
          className="pointer-events-none absolute hidden select-none font-display font-bold text-primary/15 md:block"
          style={{ left: `${(i * 97) % 92}%`, top: `${10 + ((i * 53) % 75)}%`, fontSize: `${1.5 + (i % 4) * 0.8}rem` }}
          animate={{ y: [0, -14, 0], rotate: [0, i % 2 ? 6 : -6, 0] }}
          transition={{ duration: 6 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
        >
          {s}
        </motion.span>
      ))}
      <div className="container relative py-20 text-center sm:py-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> 2026 · 2027 · 2028 A/L batches now enrolling
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto mt-6 max-w-4xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl"
        >
          Master <span className="text-gradient">Combined Mathematics</span> with Hasitha Madusanka
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          Theory, revision and paper classes for G.C.E. A/L — in Panadura, Horana, Mathugama, Kalutara and island-wide online.
          Live classes, HD recordings, tutes and timed online papers in one place.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/register" className={buttonVariants({ variant: "gradient", size: "lg" })}>
            Register free <ArrowRight />
          </Link>
          <Link href="/dashboard/free-zone" className={buttonVariants({ variant: "outline", size: "lg" })}>
            <PlayCircle /> Watch free seminars
          </Link>
        </motion.div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-success" /> Pay by bank transfer · upload your slip · access unlocked after approval
        </p>
      </div>
    </section>
  );
}
