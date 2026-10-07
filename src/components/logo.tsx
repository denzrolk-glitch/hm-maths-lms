import Link from "next/link";
import { cn } from "@/lib/utils";

/** "hm" monoline ligature mark in the HM orange gradient; tone="tile" = black tile with the orange mark (or `currentColor` with tone="current"). */
export function LogoMark({ className, tone = "brand" }: { className?: string; tone?: "brand" | "current" | "tile" }) {
  if (tone === "tile") {
    return (
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0b0b0b] shadow-lg shadow-black/30 ring-1 ring-white/10", className)} aria-hidden>
        <LogoMark tone="brand" className="h-[64%] w-[64%] drop-shadow-[0_0_8px_rgba(240,91,6,.45)]" />
      </span>
    );
  }
  const id = "hm-logo-grad";
  const stroke = tone === "brand" ? `url(#${id})` : "currentColor";
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden>
      {tone === "brand" && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f05b06" /><stop offset="1" stopColor="#fb923c" /></linearGradient>
        </defs>
      )}
      <path d="M8 6v36M8 26c0-6 3.6-9.5 8-9.5s8 3.5 8 9.5v16M24 26c0-6 3.6-9.5 8-9.5s8 3.5 8 9.5v16"
        fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="7" r="3.5" fill={tone === "brand" ? "#fb923c" : "currentColor"} />
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
