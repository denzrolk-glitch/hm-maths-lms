"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Small "copy to clipboard" button (Student ID, bank reference…). */
export function CopyButton({ value, className, label = false }: { value: string; className?: string; label?: boolean }) {
  const t = useT("common.copy");
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      toast.success(t("copied"));
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard unavailable (http / old browser) — silently ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={t("copy")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-xs font-semibold transition",
        label ? "h-8 px-2.5" : "h-7 w-7 justify-center",
        done ? "text-success" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className,
      )}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label ? <span>{done ? t("copied") : t("copy")}</span> : null}
    </button>
  );
}
