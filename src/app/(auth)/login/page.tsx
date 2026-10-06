import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { AuthCard } from "../auth-card";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT("auth.login"))("metaTitle") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, t] = await Promise.all([searchParams, getT("auth.login")]);
  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <LoginForm next={next} />
    </AuthCard>
  );
}
