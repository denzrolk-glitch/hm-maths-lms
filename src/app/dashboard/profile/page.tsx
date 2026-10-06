import { requireUser } from "@/lib/auth";
import { StudentIdCard } from "@/components/student-id-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { getFormat, getT } from "@/i18n/server";
import { PasswordForm, ProfileForm } from "./profile-forms";

export async function generateMetadata() {
  return { title: (await getT("portal.nav"))("profile") };
}

export default async function ProfilePage() {
  const { profile } = await requireUser();
  const [t, f] = await Promise.all([getT("portal.profile"), getFormat()]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[400px_1fr]">
        <Card id="id" className="scroll-mt-24 h-fit">
          <CardHeader><CardTitle className="text-base">{t("idTitle")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <StudentIdCard profile={profile} />
            <p className="text-center text-xs text-muted-foreground">{t("idHint", { date: f.date(profile.created_at) })}</p>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card><CardHeader><CardTitle className="text-base">{t("details")}</CardTitle></CardHeader><CardContent><ProfileForm profile={profile} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">{t("password")}</CardTitle></CardHeader><CardContent><PasswordForm /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
