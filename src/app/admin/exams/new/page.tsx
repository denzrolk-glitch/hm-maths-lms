import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, PageHeader } from "@/components/ui/misc";
import { ExamForm } from "../../forms";
import { getT } from "@/i18n/server";

export default async function NewExamPage() {
  const { supabase } = await requireAdmin();
  const t = await getT("admin.exams");
  const { data: classes } = await supabase.from("classes").select("id, title").order("title");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("new")} />
      {classes?.length ? <Card><CardContent className="pt-5"><ExamForm classes={classes} /></CardContent></Card> :
        <Alert>{t("needClass")} <Link href="/admin/classes/new" className={buttonVariants({ variant: "link", size: "sm" })}>{t("newClass")}</Link></Alert>}
    </div>
  );
}
