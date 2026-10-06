import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page title block used at the top of every dashboard page. */
export function PageHeader({ title, description, children, className, icon: Icon, eyebrow }: {
  title: string; description?: React.ReactNode; children?: React.ReactNode; className?: string; icon?: LucideIcon; eyebrow?: string;
}) {
  return (
    <div className={cn("ph mb-6 flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon ? (
          <span className="mt-0.5 hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-brand-500 text-white shadow-lg shadow-teal-500/25 sm:grid">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p> : null}
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, children }: {
  icon: LucideIcon; title: string; description?: string; children?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-primary/25 bg-card px-6 py-14 text-center shadow-soft">
      <div className="bg-dots absolute inset-0 opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]" aria-hidden />
      <div className="relative mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-50 to-brand-50 text-primary ring-1 ring-primary/15 dark:from-teal-500/10 dark:to-brand-500/10">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="relative font-display text-lg font-semibold">{title}</h3>
      {description ? <p className="relative mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {children ? <div className="relative mt-5">{children}</div> : null}
    </div>
  );
}

export function Alert({ variant = "info", children, className }: {
  variant?: "info" | "error" | "success"; children: React.ReactNode; className?: string;
}) {
  const Icon = variant === "error" ? AlertCircle : variant === "success" ? CheckCircle2 : Info;
  const styles = {
    info: "border-primary/25 bg-primary/5 text-foreground",
    error: "border-destructive/30 bg-destructive/10 text-destructive",
    success: "border-success/30 bg-success/10 text-success",
  }[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-xl border p-3 text-sm", styles, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const TONES = {
  blue: "from-teal-500 to-teal-600 shadow-teal-500/30",
  sky: "from-brand-400 to-brand-600 shadow-brand-500/30",
  violet: "from-violet-500 to-indigo-500 shadow-violet-500/30",
  amber: "from-amber-400 to-orange-500 shadow-amber-500/30",
  green: "from-emerald-400 to-emerald-600 shadow-emerald-500/30",
  rose: "from-rose-400 to-pink-500 shadow-rose-500/30",
} as const;
export type Tone = keyof typeof TONES;

export function StatCard({ label, value, icon: Icon, hint, tone = "blue", className }: {
  label: string; value: React.ReactNode; icon: LucideIcon; hint?: React.ReactNode; tone?: Tone; className?: string;
}) {
  return (
    <div className={cn("group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift dark:border-white/10", className)}>
      <div className={cn("pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-[0.08] transition group-hover:scale-125", TONES[tone])} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", TONES[tone])}><Icon className="h-[18px] w-[18px]" /></span>
      </div>
      <p className="mt-2 truncate font-display text-[26px] font-bold tracking-tight">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Table({ className, bare, ...p }: React.TableHTMLAttributes<HTMLTableElement> & { bare?: boolean }) {
  return (
    <div className={cn("w-full overflow-x-auto bg-card", bare ? "border-t" : "rounded-2xl border border-border/80 shadow-soft dark:border-white/10")}>
      <table className={cn("w-full text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:bg-muted/50 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground [&_thead]:border-b [&_tbody_tr]:border-b [&_tbody_tr]:transition-colors [&_tbody_tr:last-child]:border-0 [&_tbody_tr:hover]:bg-accent/40", className)} {...p} />
    </div>
  );
}
