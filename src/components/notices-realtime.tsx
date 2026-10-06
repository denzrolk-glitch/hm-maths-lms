"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/client";

/** Subscribes to new/changed notices (RLS-filtered by Supabase Realtime) and refreshes the page. */
export function NoticesRealtime({ notify = true }: { notify?: boolean }) {
  const router = useRouter();
  const t = useT("common.notices");
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notices-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, (payload) => {
        if (notify && payload.eventType === "INSERT") {
          const n = payload.new as { title?: string; tag?: string };
          toast.info(`${n.tag === "Urgent" ? "🔴 " : ""}${t("newNotice", { title: n.title ?? "" })}`);
        }
        router.refresh();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router, notify, t]);
  return null;
}
