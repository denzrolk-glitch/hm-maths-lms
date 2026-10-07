"use client";
import Link from "next/link";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { loginAction } from "@/app/auth-actions";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/misc";
import { PasswordInput } from "@/components/password-input";
import { useT } from "@/i18n/client";
import { SITE } from "@/content/site";
import { whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/brand-icons";

export function LoginForm({ next }: { next?: string }) {
  const t = useT("auth.login");
  const [forgot, setForgot] = useState(false);
  return (
    <ActionForm action={loginAction} className="space-y-4" toasts={false}>
      {(state) => (<>
        <input type="hidden" name="next" value={next ?? ""} />
        {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
        <Field label={t("identifier")} htmlFor="identifier" hint={t("identifierHint")}>
          <Input id="identifier" name="identifier" autoComplete="username" placeholder={t("identifierPlaceholder")} className="h-11" required />
        </Field>
        <Field label={t("password")} htmlFor="password">
          <PasswordInput id="password" name="password" autoComplete="current-password" className="h-11" required />
        </Field>
        <div className="flex justify-end">
          <button type="button" onClick={() => setForgot((f) => !f)} className="text-sm font-semibold text-primary hover:underline">{t("forgot")}</button>
        </div>
        {forgot ? (
          <Alert>
            {t("forgotHint")}{" "}
            <a className="inline-flex items-center gap-1 font-semibold underline" target="_blank" rel="noopener noreferrer"
              href={whatsappLink(SITE.contact.whatsapp, t("forgotText")) ?? "#"}><WhatsAppIcon /> WhatsApp</a>
          </Alert>
        ) : null}
        <SubmitButton className="h-12 w-full rounded-xl text-base" pendingText={t("pending")}>{t("submit")}</SubmitButton>
        <p className="text-center text-sm text-slate-500">
          {t("noAccount")} <Link href="/register" className="font-semibold text-primary hover:underline">{t("signUp")}</Link>
        </p>
      </>)}
    </ActionForm>
  );
}
