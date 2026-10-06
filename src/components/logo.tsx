import Link from "next/link";
import { cn } from "@/lib/utils";

/** "hm" monoline ligature mark in the blue brand gradient (or `currentColor` with tone="current"). */
export function LogoMark({ className, tone = "brand" }: { className?: string; tone?: "brand" | "current" | "tile" }) {
  if (tone === "tile") {
    return (
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-brand-500 text-white shadow-lg shadow-teal-500/30", className)} aria-hidden>
        <LogoMark tone="current" className="h-[62%] w-[62%]" />
      </span>
    );
  }
  const id = "hm-logo-grad";
  const stroke = tone === "brand" ? `url(#${id})` : "currentColor";
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden>
      {tone === "brand" && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1f7ae8" /><stop offset="1" stopColor="#14b0e6" /></linearGradient>
        </defs>
      )}
      <path d="M8 6v36M8 26c0-6 3.6-9.5 8-9.5s8 3.5 8 9.5v16M24 26c0-6 3.6-9.5 8-9.5s8 3.5 8 9.5v16"
        fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="7" r="3.5" fill={tone === "brand" ? "#14b0e6" : "currentColor"} />
    </svg>
  );
}

export function Logo({ href = "/", compact = false, tone = "auto", label = "HM Maths", sub }: {
  href?: string; compact?: boolean; tone?: "auto" | "dark" | "light"; label?: string; sub?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={label}>
      <LogoMark tone="tile" />
      {!compact && (
        <span className="leading-tight">
          <span className={cn("block font-display text-[15px] font-bold tracking-tight", tone === "dark" && "text-white")}>{label}</span>
          {sub ? <span className={cn("block text-[11px] font-medium", tone === "dark" ? "text-white/60" : "text-muted-foreground")}>{sub}</span> : null}
        </span>
      )}
    </Link>
  );
}
