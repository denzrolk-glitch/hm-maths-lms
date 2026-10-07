import { DashboardShell, type ShellGroup, type ShellItem } from "@/components/dashboard-shell";
import { normalizeStreaks, type PaperStats } from "@/lib/papers";
import { requireUser } from "@/lib/auth";
import { getT } from "@/i18n/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireUser();
  const [t, tg] = await Promise.all([getT("portal.nav"), getT("portal.navGroups")]);
  // Notices from the last 7 days → bell badge. get_my_paper_stats() → performance streaks for the sidebar card.
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [{ count }, activity] = await Promise.all([
    supabase.from("notices").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.rpc("get_my_paper_stats"),
  ]);
  const streak = activity.error || !activity.data ? null : normalizeStreaks(activity.data as PaperStats);

  const groups: ShellGroup[] = [
    { label: tg("learn"), items: [
      { href: "/dashboard", label: t("dashboard"), icon: "dashboard", exact: true },
      { href: "/dashboard/classes", label: t("classes"), icon: "classes" },
      { href: "/dashboard/free-zone", label: t("free"), icon: "free" },
    ] },
    { label: tg("compete"), items: [
      { href: "/dashboard/papers", label: t("papers"), icon: "papers" },
      { href: "/dashboard/leaderboard", label: t("leaderboard"), icon: "trophy" },
      { href: "/dashboard/exams", label: t("exams"), icon: "exams" },
    ] },
    { label: tg("account"), items: [
      { href: "/dashboard/store", label: t("store"), icon: "store" },
      { href: "/dashboard/payments", label: t("payments"), icon: "payments" },
      { href: "/dashboard/notices", label: t("notices"), icon: "notices", badge: count ?? 0 },
      { href: "/dashboard/profile", label: t("profile"), icon: "profile" },
    ] },
  ];
  const menu: ShellItem[] = [
    { href: "/dashboard/profile", label: t("profile"), icon: "profile" },
    { href: "/dashboard/payments", label: t("payments"), icon: "payments" },
    ...(profile.role === "admin" ? [{ href: "/admin", label: t("admin"), icon: "grad" } as ShellItem] : []),
  ];
  return (
    <DashboardShell area="student" groups={groups} menu={menu} crumbNs="portal.crumbs"
      tabs={["/dashboard", "/dashboard/classes", "/dashboard/papers", "/dashboard/leaderboard"]}
      user={{ name: profile.full_name, subtitle: profile.student_id ?? t("admin") }}
      notices={{ href: "/dashboard/notices", count: count ?? 0 }} streak={streak}>
      {children}
    </DashboardShell>
  );
}
