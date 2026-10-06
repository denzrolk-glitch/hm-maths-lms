import { PortalShell } from "@/components/portal-shell";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireUser();
  // Notices from the last 7 days → bell badge.
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count } = await supabase.from("notices").select("id", { count: "exact", head: true }).gte("created_at", since);
  return (
    <PortalShell user={{ name: profile.full_name, studentId: profile.student_id, isAdmin: profile.role === "admin" }} noticeCount={count ?? 0}>
      {children}
    </PortalShell>
  );
}
