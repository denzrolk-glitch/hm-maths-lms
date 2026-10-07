"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award, BookOpenCheck, CircleCheckBig, Crown, Flame, Gem, Lock, MapPin, Medal, Rocket, Star, Target, TrendingUp, Trophy, Zap,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/i18n/client";
import { CountUp } from "@/components/motion";
import { cn } from "@/lib/utils";
import { STREAK_KEYS, nextMilestone, type BadgeKey, type StreakKey, type Streaks } from "@/lib/papers";

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
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d14b03" /><stop offset="1" stopColor="#fb923c" /></linearGradient>
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

export const STREAK_META: Record<StreakKey, { icon: LucideIcon; tone: string }> = {
  top3: { icon: Crown, tone: "from-amber-300 to-yellow-500" },
  top10: { icon: Trophy, tone: "from-orange-400 to-rose-500" },
  score75: { icon: Star, tone: "from-fuchsia-400 to-violet-600" },
  pass50: { icon: CircleCheckBig, tone: "from-emerald-400 to-teal-600" },
  improve: { icon: TrendingUp, tone: "from-sky-400 to-cyan-600" },
  attend: { icon: Flame, tone: "from-orange-500 to-red-600" },
};

/** Performance streaks: top 3 / top 10 / 75+ / 50+ / improving / weekly papers. */
export function StreakPanel({ streaks, className }: { streaks: Streaks; className?: string }) {
  const t = useT("portal.streak");
  return (
    <div className={cn("rounded-3xl border border-border/80 bg-card p-5 shadow-soft", className)}>
      <div className="mb-4">
        <p className="font-display text-lg font-bold">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {STREAK_KEYS.map((k, i) => {
          const { icon: Icon, tone } = STREAK_META[k];
          const v = streaks[k];
          const goal = nextMilestone(v.current);
          const on = v.current > 0;
          return (
            <motion.div key={k} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              title={t(`types.${k}.rule`)}
              className={cn("relative overflow-hidden rounded-2xl border p-3.5 transition", on ? "border-transparent bg-gradient-to-br text-white shadow-lift " + tone : "border-dashed bg-muted/40")}>
              {on && <div className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/20 blur-xl" />}
              <div className="relative flex items-center gap-2.5">
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", on ? "bg-white/20" : "bg-muted text-muted-foreground")}>
                  <Icon className={cn("h-[18px] w-[18px]", on && k === "attend" && "animate-flicker")} />
                </span>
                <p className={cn("min-w-0 text-xs font-semibold leading-tight", !on && "text-muted-foreground")}>{t(`types.${k}.name`)}</p>
              </div>
              <p className="relative mt-3 font-display text-3xl font-extrabold leading-none"><CountUp value={v.current} /></p>
              <p className={cn("relative mt-1 text-[11px]", on ? "text-white/85" : "text-muted-foreground")}>{t(`types.${k}.rule`)}</p>
              <div className={cn("relative mt-2.5 h-1.5 overflow-hidden rounded-full", on ? "bg-white/25" : "bg-muted")}>
                <motion.span className={cn("block h-full rounded-full", on ? "bg-white" : "bg-muted-foreground/30")}
                  initial={{ width: 0 }} whileInView={{ width: `${Math.min(100, (v.current / goal) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} />
              </div>
              <p className={cn("relative mt-1.5 flex justify-between text-[10px] font-medium", on ? "text-white/80" : "text-muted-foreground")}>
                <span>{t("best", { n: v.best })}</span><span>{t("next", { n: goal })}</span>
              </p>
            </motion.div>
          );
        })}
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
  townChampion: { icon: MapPin, tone: "from-emerald-400 to-teal-600" },
  champion: { icon: Crown, tone: "from-amber-300 to-yellow-500" },
  papers10: { icon: BookOpenCheck, tone: "from-violet-400 to-indigo-600" },
  hot10: { icon: Trophy, tone: "from-orange-400 to-rose-500" },
  pass50x5: { icon: CircleCheckBig, tone: "from-emerald-400 to-teal-600" },
  score75x3: { icon: Award, tone: "from-fuchsia-400 to-violet-600" },
  improve3: { icon: TrendingUp, tone: "from-sky-400 to-cyan-600" },
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
