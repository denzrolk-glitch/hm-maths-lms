"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/db/client";
import { useT } from "@/i18n/client";

/** Polls for new/changed notices (RLS-filtered) every 30 s while the tab is visible and refreshes the page. */
export function NoticesRealtime({ notify = true }: { notify?: boolean }) {
  const router = useRouter();
  const t = useT("common.notices");
  const last = useRef<string | null>(null);
  useEffect(() => {
    const db = createClient();
    let stop = false;
    const check = async () => {
      if (stop || document.visibilityState !== "visible") return;
      const { data } = await db.from("notices").select("id, title, tag, created_at").order("created_at", { ascending: false }).limit(1);
      const top = (data?.[0] ?? null) as { id: string; title?: string; tag?: string } | null;
      const sig = top ? top.id : "none";
      if (last.current === null) { last.current = sig; return; }
      if (sig !== last.current) {
        last.current = sig;
        if (notify && top) toast.info(`${top.tag === "Urgent" ? "🔴 " : ""}${t("newNotice", { title: top.title ?? "" })}`);
        router.refresh();
      }
    };
    check();
    const id = setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    return () => { stop = true; clearInterval(id); document.removeEventListener("visibilitychange", check); };
  }, [router, notify, t]);
  return null;
}
