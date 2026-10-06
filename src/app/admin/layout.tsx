import { DashboardShell, type ShellGroup, type ShellItem } from "@/components/dashboard-shell";
import { requireAdmin } from "@/lib/auth";
import { getT } from "@/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireAdmin();
  const [t, tg] = await Promise.all([getT("admin.nav"), getT("admin.navGroups")]);
  const [{ count: pending }, { count: pendingOrders }] = await Promise.all([
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const groups: ShellGroup[] = [
    { label: tg("manage"), items: [
      { href: "/admin", label: t("overview"), icon: "dashboard", exact: true },
      { href: "/admin/payments", label: t("payments"), icon: "payments", badge: pending ?? 0 },
      { href: "/admin/classes", label: t("classes"), icon: "classes" },
      { href: "/admin/students", label: t("students"), icon: "students" },
    ] },
    { label: tg("assess"), items: [
      { href: "/admin/papers", label: t("papers"), icon: "papers" },
      { href: "/admin/exams", label: t("exams"), icon: "exams" },
    ] },
    { label: tg("engage"), items: [
      { href: "/admin/notices", label: t("notices"), icon: "megaphone" },
      { href: "/admin/store", label: t("store"), icon: "package", badge: pendingOrders ?? 0 },
      { href: "/dashboard", label: t("studentView"), icon: "grad", exact: true },
    ] },
  ];
  const menu: ShellItem[] = [{ href: "/dashboard", label: t("studentView"), icon: "grad" }];
  return (
    <DashboardShell area="admin" groups={groups} menu={menu} crumbNs="admin.crumbs"
      tabs={["/admin", "/admin/payments", "/admin/papers", "/admin/students"]}
      user={{ name: profile.full_name, subtitle: t("administrator") }}>
      {children}
    </DashboardShell>
  );
}
