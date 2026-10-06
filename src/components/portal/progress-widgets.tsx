"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award, BookOpenCheck, CalendarCheck, Crown, Flame, Gem, Lock, MapPin, Medal, Rocket, Star, Target, Trophy, Zap,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/i18n/client";
import { CountUp } from "@/components/motion";
import { cn } from "@/lib/utils";
import type { BadgeKey } from "@/lib/papers";

/** Animated circular percentage ring. */
export function ScoreRing({ value, size = 132, stroke = 12, label, sub }: { value: number; size?: number; stroke?: number; label?: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const id = `ring-${size}-${stroke}`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-teal-100 dark:stroke-white/10" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" stroke={`url(#${id})`}
          strokeDasharray={c} initial={{ strokeDashoffset: c }} whileInView={{ strokeDashoffset: c - (c * v) / 100 }} viewport={{ once: true }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1f7ae8" /><stop offset="1" stopColor="#41c9f5" /></linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-2xl font-extrabold leading-none"><CountUp value={v} decimals={v % 1 ? 1 : 0} suffix="%" /></span>
        {label && <span className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</span>}
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function colomboWeekday(offsetDays: number) {
  const d = new Date(Date.now() - offsetDays * 86400000);
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Colombo", weekday: "short" }).format(d);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

/** Two streaks side by side: weekly-paper streak and daily study streak (last 7 days). */
export function StreakPanel({ paper, study, className }: { paper: { current: number; best: number }; study: { current: number; best: number; week: boolean[] } | null; className?: string }) {
  const t = useT("portal.streak");
  const tc = useT("common.schedule");
  const days = tc.raw<string[]>("days");
  const week = study?.week ?? Array(7).fill(false);
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-5 text-white shadow-lift">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-xl" />
        <div className="relative flex items-center gap-4">
          <motion.span initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }}
            className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 backdrop-blur"><Flame className={cn("h-7 w-7", paper.current > 0 && "animate-flicker")} /></motion.span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">{t("paperTitle")}</p>
            <p className="font-display text-3xl font-extrabold leading-tight"><CountUp value={paper.current} /> <span className="text-base font-semibold">{t("weeks")}</span></p>
            <p className="text-xs text-white/85">{t("best", { n: paper.best })} · {paper.current > 0 ? t("keepGoing") : t("start")}</p>
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-brand-500 text-white shadow-lg shadow-primary/25"><CalendarCheck className="h-7 w-7" /></span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("studyTitle")}</p>
            <p className="font-display text-3xl font-extrabold leading-tight"><CountUp value={study?.current ?? 0} /> <span className="text-base font-semibold text-muted-foreground">{t("daysUnit")}</span></p>
            <p className="text-xs text-muted-foreground">{t("best", { n: study?.best ?? 0 })}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {week.map((on, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05, type: "spring", stiffness: 260 }}
                className={cn("grid h-7 w-7 place-items-center rounded-full text-[10px]", on ? "bg-gradient-to-br from-teal-500 to-brand-500 text-white shadow-md shadow-primary/25" : "bg-muted text-muted-foreground")}>
                {on ? <Flame className="h-3.5 w-3.5" /> : null}
              </motion.span>
              <span className="text-[10px] font-medium text-muted-foreground">{days[colomboWeekday(6 - i)]?.slice(0, 2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const BADGE_ICONS: Record<BadgeKey, { icon: LucideIcon; tone: string }> = {
  firstPaper: { icon: Rocket, tone: "from-teal-400 to-teal-600" },
  streak3: { icon: Flame, tone: "from-amber-400 to-orange-500" },
  streak5: { icon: Zap, tone: "from-orange-400 to-rose-500" },
  streak10: { icon: Gem, tone: "from-fuchsia-400 to-violet-600" },
  score90: { icon: Star, tone: "from-yellow-300 to-amber-500" },
  fullMarks: { icon: Target, tone: "from-emerald-400 to-emerald-600" },
  top10: { icon: Medal, tone: "from-brand-400 to-teal-600" },
  townChampion: { icon: MapPin, tone: "from-sky-400 to-indigo-500" },
  champion: { icon: Crown, tone: "from-amber-300 to-yellow-500" },
  papers10: { icon: BookOpenCheck, tone: "from-violet-400 to-indigo-600" },
  study7: { icon: Award, tone: "from-rose-400 to-pink-600" },
};

export function Achievements({ items }: { items: { key: BadgeKey; unlocked: boolean }[] }) {
  const t = useT("portal.badges");
  const done = items.filter((i) => i.unlocked).length;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{t("progress", { n: done, total: items.length })}</span>
        <span className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
          <motion.span className="block h-full rounded-full bg-gradient-to-r from-teal-500 to-brand-400" initial={{ width: 0 }} whileInView={{ width: `${(done / Math.max(1, items.length)) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1 }} />
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {items.map(({ key, unlocked }, i) => {
          const { icon: Icon, tone } = BADGE_ICONS[key];
          return (
            <motion.div key={key} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              title={t(`${key}.hint`)} className={cn("group flex flex-col items-center rounded-2xl border p-3 text-center transition", unlocked ? "border-border/80 bg-card shadow-soft hover:-translate-y-0.5 hover:shadow-lift" : "border-dashed bg-muted/40")}>
              <span className={cn("relative grid h-12 w-12 place-items-center rounded-2xl text-white", unlocked ? `bg-gradient-to-br shadow-lg ${tone}` : "bg-muted text-muted-foreground")}>
                {unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
              </span>
              <span className={cn("mt-2 line-clamp-2 text-[11px] font-semibold leading-tight", !unlocked && "text-muted-foreground")}>{t(`${key}.name`)}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/** Small rank card: "#3 of 120 · Panadura". */
export function RankTile({ icon = "trophy", label, rank, of, href, tone = "blue" }: { icon?: "trophy" | "pin" | "star"; label: string; rank: number | null; of?: number | null; href?: string; tone?: "blue" | "sky" | "amber" }) {
  const t = useT("portal.ranks");
  const Icon = icon === "pin" ? MapPin : icon === "star" ? Star : Trophy;
  const tones = { blue: "from-teal-500 to-teal-700", sky: "from-brand-400 to-brand-600", amber: "from-amber-400 to-orange-500" };
  const body = (
    <div className="group flex h-full items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", tones[tone])}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-display text-xl font-bold leading-tight">{rank ? <>#<CountUp value={rank} /></> : "—"}</p>
        {rank && of ? <p className="text-[11px] text-muted-foreground">{t("of", { n: of })}</p> : null}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}
