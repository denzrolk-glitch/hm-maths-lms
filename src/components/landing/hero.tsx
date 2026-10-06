"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ChevronDown, Play } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { useT } from "@/i18n/client";

const TILES = [
  { s: "∫", x: "6%", y: "18%", size: 86, d: 0 },
  { s: "Σ", x: "78%", y: "8%", size: 74, d: 0.6 },
  { s: "π", x: "86%", y: "52%", size: 64, d: 1.2 },
  { s: "√x", x: "2%", y: "64%", size: 70, d: 0.9 },
  { s: "dy/dx", x: "64%", y: "80%", size: 82, d: 0.3 },
];

function HexTile({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size * 1.1 }}>
      <svg viewBox="0 0 100 110" className="absolute inset-0 h-full w-full drop-shadow-[0_0_18px_rgba(240,91,6,.45)]" aria-hidden>
        <path d="M50 3l44 25.5v53L50 107 6 81.5v-53z" fill="rgba(30,20,12,.75)" stroke="rgba(240,91,6,.55)" strokeWidth="1.5" />
      </svg>
      <span className="relative font-display text-lg font-bold text-brand-400" style={{ fontSize: size * 0.3 }}>{children}</span>
    </div>
  );
}

export function Hero({ heroImage }: { heroImage: string | null }) {
  const t = useT("landing.hero");
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const px = useTransform(sx, (v) => v * 18);
  const py = useTransform(sy, (v) => v * 18);
  const pxr = useTransform(sx, (v) => v * -10);
  const pyr = useTransform(sy, (v) => v * -10);

  return (
    <section
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-[#050505] pt-28"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      <div className="bg-hex absolute inset-0 -z-10 opacity-80 [mask-image:radial-gradient(ellipse_at_60%_40%,black_30%,transparent_75%)]" />
      <div className="absolute left-1/2 top-[38%] -z-10 h-[620px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(240,91,6,.22),rgba(120,50,10,.10)_55%,transparent)] blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#050505] to-transparent" />

      <div className="container grid grid-cols-1 items-center gap-10 pb-16 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.6, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}>
            <LogoMark className="h-20 w-20 drop-shadow-[0_0_30px_rgba(240,91,6,.5)] sm:h-24 sm:w-24" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-brand-400/90">{t("kicker")}</motion.p>
          <h1 className="mt-3 font-display text-[3.2rem] font-extrabold leading-[1.22] sm:leading-[1.16] sm:text-7xl lg:text-[5.4rem]">
            {[t("nameLine1"), t("nameLine2")].map((line, i) => (
              <motion.span key={i} className="text-sand block pb-3 sm:pb-4"
                initial={{ opacity: 0, y: 40, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.25 + i * 0.15, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}>
                {line}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-4 flex items-center gap-2 font-display text-2xl font-bold text-white/90 sm:text-3xl">
            <Play className="h-6 w-6 shrink-0 fill-brand-500 text-brand-500" /> <span className="pb-1 leading-snug">{t("tagline")}</span>
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.6 }}
            className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/55">{t("description")}</motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-full bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(240,91,6,.45)] transition hover:-translate-y-0.5 hover:bg-brand-400">
              {t("ctaPrimary")}
            </Link>
            <Link href="/dashboard/free-zone" className="rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-white/90 backdrop-blur transition hover:border-brand-500/60 hover:text-white">
              {t("ctaSecondary")}
            </Link>
          </motion.div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[560px]">
          <motion.div style={{ x: pxr, y: pyr }} className="absolute inset-0">
            {/* rotating orbit rings */}
            <div className="absolute inset-[6%] animate-spin-slow rounded-full border border-dashed border-brand-500/20" />
            <div className="absolute inset-[16%] rounded-full border border-white/5" style={{ animation: "spin-slow 45s linear infinite reverse" }} />
          </motion.div>

          {heroImage ? (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }}
              className="absolute inset-x-[4%] bottom-0 top-[2%]">
              <Image src={heroImage} alt={t("imageAlt")} fill priority sizes="(max-width: 1024px) 90vw, 560px"
                className="object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_80%,transparent)]" />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute inset-[18%] grid place-items-center">
              <svg viewBox="0 0 200 220" className="absolute inset-0 h-full w-full drop-shadow-[0_0_60px_rgba(240,91,6,.35)]" aria-hidden>
                <defs>
                  <linearGradient id="hx" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#2a1b10" /><stop offset="1" stopColor="#0d0907" />
                  </linearGradient>
                  <linearGradient id="hxs" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ff9f66" /><stop offset="1" stopColor="#f05b06" stopOpacity=".3" />
                  </linearGradient>
                </defs>
                <path d="M100 6l88 51v106l-88 51-88-51V57z" fill="url(#hx)" stroke="url(#hxs)" strokeWidth="2" />
                <path d="M100 30l67 39v82l-67 39-67-39V69z" fill="none" stroke="rgba(240,91,6,.18)" strokeWidth="1" />
              </svg>
              <div className="relative text-center">
                <p className="font-display text-7xl font-black leading-none text-brand-500 drop-shadow-[0_0_24px_rgba(240,91,6,.6)] sm:text-8xl">∫</p>
                <p className="mt-3 font-mono text-[11px] tracking-wider text-white/45 sm:text-xs">f(x) = ax² + bx + c</p>
                <p className="mt-1 font-mono text-[11px] tracking-wider text-white/30 sm:text-xs">F = ma · v² = u² + 2as</p>
              </div>
            </motion.div>
          )}

          <motion.div style={{ x: px, y: py }} className="pointer-events-none absolute inset-0">
            {TILES.map((tile, i) => (
              <motion.div key={i} className="absolute" style={{ left: tile.x, top: tile.y }}
                initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
                transition={{ opacity: { delay: 0.6 + tile.d, duration: 0.6 }, scale: { delay: 0.6 + tile.d, duration: 0.6 }, y: { duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: tile.d } }}>
                <HexTile size={tile.size}>{tile.s}</HexTile>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.a href="#announcements" aria-label={t("scroll")} initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.4 }, y: { repeat: Infinity, duration: 2 } }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-white/40 hover:text-white sm:block">
        <ChevronDown className="h-6 w-6" />
      </motion.a>
    </section>
  );
}
