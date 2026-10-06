import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { createCaptcha } from "@/lib/captcha";
import { AuthCard } from "../auth-card";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT("auth.register"))("metaTitle") };
}

export default async function RegisterPage() {
  const t = await getT("auth.register");
  return (
    <AuthCard wide title={t("title")} subtitle={t("subtitle")} hashtag={t("hashtag")}>
      <RegisterForm initialCaptcha={createCaptcha()} />
    </AuthCard>
  );
}
