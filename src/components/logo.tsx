import Link from "next/link";
import { cn } from "@/lib/utils";

/** "hm" monoline ligature mark. Colour follows `currentColor` unless `tone="brand"`. */
export function LogoMark({ className, tone = "brand" }: { className?: string; tone?: "brand" | "current" }) {
  const stroke = tone === "brand" ? "#f46a1c" : "currentColor";
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden>
      <path d="M8 6v36M8 26c0-6 3.6-9.5 8-9.5s8 3.5 8 9.5v16M24 26c0-6 3.6-9.5 8-9.5s8 3.5 8 9.5v16"
        fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="7" r="3.5" fill={tone === "brand" ? "#f05b06" : "currentColor"} />
    </svg>
  );
}

export function Logo({ href = "/", compact = false, tone = "auto", label = "HM Maths", sub }: {
  href?: string; compact?: boolean; tone?: "auto" | "dark" | "light"; label?: string; sub?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={label}>
      <LogoMark />
      {!compact && (
        <span className="leading-tight">
          <span className={cn("block font-display text-[15px] font-bold tracking-tight", tone === "dark" && "text-white")}>{label}</span>
          {sub ? <span className={cn("block text-[11px] font-medium", tone === "dark" ? "text-white/60" : "text-muted-foreground")}>{sub}</span> : null}
        </span>
      )}
    </Link>
  );
}
