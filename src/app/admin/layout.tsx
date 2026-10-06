import { AppShell, type NavItem } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { getT } from "@/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireAdmin();
  const t = await getT("admin.nav");
  const [{ count: pending }, { count: pendingOrders }] = await Promise.all([
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const nav: NavItem[] = [
    { href: "/admin", label: t("overview"), icon: "dashboard", exact: true },
    { href: "/admin/payments", label: t("payments"), icon: "payments", badge: pending ?? 0 },
    { href: "/admin/classes", label: t("classes"), icon: "classes" },
    { href: "/admin/exams", label: t("exams"), icon: "exams" },
    { href: "/admin/notices", label: t("notices"), icon: "megaphone" },
    { href: "/admin/students", label: t("students"), icon: "students" },
    { href: "/admin/store", label: t("store"), icon: "package", badge: pendingOrders ?? 0 },
    { href: "/dashboard", label: t("studentView"), icon: "grad", exact: true },
  ];
  return (
    <AppShell area="admin" nav={nav} user={{ name: profile.full_name, subtitle: t("administrator") }}>
      {children}
    </AppShell>
  );
}
