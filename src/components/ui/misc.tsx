import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page title block. Inside the student portal it sits on the dark header band (see `.portal .ph` in globals.css). */
export function PageHeader({ title, description, children, className }: {
  title: string; description?: React.ReactNode; children?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("ph mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, children }: {
  icon: LucideIcon; title: string; description?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border dark:border-white/10 bg-card px-6 py-14 text-center shadow-[0_3px_4px_rgba(0,0,0,.03)]">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5"><Icon className="h-7 w-7" /></div>
      <h3 className="font-display font-semibold">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function Alert({ variant = "info", children, className }: {
  variant?: "info" | "error" | "success"; children: React.ReactNode; className?: string;
}) {
  const Icon = variant === "error" ? AlertCircle : variant === "success" ? CheckCircle2 : Info;
  const styles = {
    info: "border-primary/30 bg-primary/5 text-foreground",
    error: "border-destructive/30 bg-destructive/10 text-destructive",
    success: "border-success/30 bg-success/10 text-success",
  }[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", styles, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint }: { label: string; value: React.ReactNode; icon: LucideIcon; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border dark:border-white/10 bg-card p-5 shadow-[0_3px_4px_rgba(0,0,0,.03)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Table({ className, bare, ...p }: React.TableHTMLAttributes<HTMLTableElement> & { bare?: boolean }) {
  return (
    <div className={cn("w-full overflow-x-auto bg-card", bare ? "border-t" : "rounded-2xl border border-border dark:border-white/10 shadow-[0_3px_4px_rgba(0,0,0,.03)]")}>
      <table className={cn("w-full text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground [&_thead]:border-b [&_tbody_tr]:border-b [&_tbody_tr:last-child]:border-0 [&_tbody_tr:hover]:bg-muted/30", className)} {...p} />
    </div>
  );
}
