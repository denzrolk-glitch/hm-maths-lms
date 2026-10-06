import Link from "next/link";
import { Bell, Pin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getNotices } from "@/lib/data";
import { NoticesRealtime } from "@/components/notices-realtime";
import { NoticeTagBadge } from "@/components/status-badge";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { NOTICE_TAGS } from "@/lib/constants";
import { getFormat, getT } from "@/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  return { title: (await getT("portal.nav"))("notices") };
}

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const valid = NOTICE_TAGS.find((x) => x === tag);
  const { supabase } = await requireUser();
  const [t, tc, f] = await Promise.all([getT("portal.notices"), getT("common"), getFormat()]);
  const notices = await getNotices(supabase, 100, valid);
  const { data: classes } = await supabase.from("classes").select("id, title");
  const className = new Map((classes ?? []).map((c) => [c.id, c.title]));
  const pill = (active: boolean) => cn("rounded-full px-4 py-1.5 text-xs font-semibold transition", active ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "bg-card border text-muted-foreground hover:text-foreground hover:border-primary/30");

  return (
    <div>
      <NoticesRealtime />
      <PageHeader title={t("title")} description={t("subtitle")}>
        <Link href="/dashboard/notices" className={pill(!valid)}>{t("all")}</Link>
        {NOTICE_TAGS.map((x) => (
          <Link key={x} href={`/dashboard/notices?tag=${encodeURIComponent(x)}`} className={pill(valid === x)}>{tc(`noticeTags.${x}`)}</Link>
        ))}
      </PageHeader>
      {!notices.length ? <EmptyState icon={Bell} title={t("empty")} description={t("emptyText")} /> : (
        <div className="space-y-3">
          {notices.map((n) => (
            <article key={n.id} className={cn("rounded-2xl border border-transparent bg-card p-5 shadow-soft", n.tag === "Urgent" && "border-destructive/40", n.is_pinned && "ring-1 ring-primary/30")}>
              <div className="flex flex-wrap items-center gap-2">
                <NoticeTagBadge tag={n.tag} />
                {n.is_pinned && <span className="flex items-center gap-1 text-xs font-medium text-primary"><Pin className="h-3 w-3" />{t("pinned")}</span>}
                {n.class_id && <span className="text-xs text-muted-foreground">· {className.get(n.class_id) ?? t("class")}</span>}
                {n.target_year && <span className="text-xs text-muted-foreground">· {t("batch", { year: n.target_year })}</span>}
                <span className="ml-auto text-xs text-muted-foreground">{f.dateTime(n.created_at)}</span>
              </div>
              <h2 className="mt-2 font-display text-lg font-semibold">{n.title}</h2>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{n.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
