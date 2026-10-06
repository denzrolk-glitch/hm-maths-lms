"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { newCaptchaAction, registerAction } from "@/app/auth-actions";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/misc";
import { PasswordInput } from "@/components/password-input";
import { useT } from "@/i18n/client";
import { AL_YEARS, DISTRICTS, TOWNS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Captcha = { image: string; token: string };

export function RegisterForm({ initialCaptcha }: { initialCaptcha: Captcha }) {
  const t = useT("auth.register");
  const tc = useT("common");
  const [captcha, setCaptcha] = useState(initialCaptcha);
  const [answer, setAnswer] = useState("");
  const [loading, start] = useTransition();
  const refresh = () => start(async () => { setCaptcha(await newCaptchaAction()); setAnswer(""); });
  const h = "h-11";

  return (
    <ActionForm action={registerAction} className="space-y-4" toasts={false}
      onError={(s) => { if (s?.fieldErrors?.captcha || s?.error) refresh(); }}>
      {(state) => { const fe = state?.fieldErrors ?? {}; return (<>
        {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
        {state?.ok ? <Alert variant="success">{state.message} <Link className="underline" href="/login">{t("signIn")}</Link></Alert> : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("firstName")} htmlFor="first_name" error={fe.first_name}>
            <Input id="first_name" name="first_name" autoComplete="given-name" placeholder={t("firstNamePlaceholder")} className={h} required />
          </Field>
          <Field label={t("lastName")} htmlFor="last_name" error={fe.last_name}>
            <Input id="last_name" name="last_name" autoComplete="family-name" placeholder={t("lastNamePlaceholder")} className={h} required />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("mobile")} htmlFor="mobile" error={fe.mobile} hint={t("mobileHint")}>
            <Input id="mobile" name="mobile" inputMode="tel" autoComplete="tel" placeholder={t("mobilePlaceholder")} className={h} required />
          </Field>
          <Field label={t("nic")} htmlFor="nic" error={fe.nic}>
            <Input id="nic" name="nic" placeholder={t("nicPlaceholder")} className={h} required />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("alYear")} htmlFor="al_year" error={fe.al_year}>
            <Select id="al_year" name="al_year" defaultValue="" className={h} required>
              <option value="" disabled>{t("selectYear")}</option>
              {AL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </Field>
          <Field label={t("town")} htmlFor="town" error={fe.town}>
            <Select id="town" name="town" defaultValue="" className={h} required>
              <option value="" disabled>{t("selectTown")}</option>
              {TOWNS.map((x) => <option key={x} value={x}>{tc(`towns.${x}`)}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("school")} htmlFor="school" error={fe.school}>
            <Input id="school" name="school" placeholder={t("schoolPlaceholder")} className={h} required />
          </Field>
          <Field label={t("district")} htmlFor="district" error={fe.district}>
            <Select id="district" name="district" defaultValue="" className={h} required>
              <option value="" disabled>{t("selectDistrict")}</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={t("password")} htmlFor="password" error={fe.password}>
          <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} className={h} meter required />
        </Field>
        <Field label={t("repeat")} htmlFor="confirm" error={fe.confirm}>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" className={h} required />
        </Field>
        <Field label={t("captcha")} htmlFor="captcha" error={fe.captcha} hint={t("captchaHint")}>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={captcha.image} alt={t("captchaAlt")} width={150} height={48} className="h-11 w-[150px] shrink-0 rounded-lg border" />
            <button type="button" onClick={refresh} aria-label={t("captchaRefresh")} disabled={loading}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-slate-500 hover:bg-slate-50 hover:text-slate-800">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <input type="hidden" name="captcha_token" value={captcha.token} />
            <Input id="captcha" name="captcha" inputMode="numeric" autoComplete="off" placeholder={t("captchaPlaceholder")} className={h}
              value={answer} onChange={(e) => setAnswer(e.target.value)} required />
          </div>
        </Field>
        <SubmitButton className="h-12 w-full rounded-xl text-base" pendingText={t("pending")}>{t("submit")}</SubmitButton>
        <p className="text-center text-sm text-slate-500">
          {t("haveAccount")} <Link href="/login" className="font-semibold text-primary hover:underline">{t("signIn")}</Link>
        </p>
        <p className="text-center text-xs text-slate-400">{t("terms")}</p>
      </>); }}
    </ActionForm>
  );
}
