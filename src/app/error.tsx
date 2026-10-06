"use client";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT("common.error");
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="font-display text-xl font-bold">{t("title")}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t("text")}</p>
      {error.digest ? <p className="font-mono text-xs text-muted-foreground">{t("reference", { digest: error.digest })}</p> : null}
      <Button onClick={reset}>{t("retry")}</Button>
    </main>
  );
}
