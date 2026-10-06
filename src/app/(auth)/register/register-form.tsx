"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { GraduationCap, KeyRound, MapPin, RefreshCw, UserRound, type LucideIcon } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { newCaptchaAction, registerAction } from "@/app/auth-actions";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/misc";
import { PasswordInput } from "@/components/password-input";
import { useT } from "@/i18n/client";
import { AL_YEARS, DISTRICTS, TOWNS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Captcha = { image: string; token: string };

function Step({ n, icon: Icon, title, hint, children }: { n: number; icon: LucideIcon; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-3">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-brand-500 text-white shadow-md shadow-primary/25">
          <Icon className="h-[18px] w-[18px]" />
          <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-card text-[10px] font-bold text-primary ring-2 ring-primary/20">{n}</span>
        </span>
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold">{title}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      {children}
    </fieldset>
  );
}

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
        <Step n={1} icon={UserRound} title={t("steps.personal")}>
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
        </Step>
        <Step n={2} icon={GraduationCap} title={t("steps.school")}>
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
        </Step>
        <Step n={3} icon={MapPin} title={t("steps.address")} hint={t("addressHint")}>
          <Field label={t("address")} htmlFor="address" error={fe.address}>
            <Textarea id="address" name="address" autoComplete="street-address" rows={2} placeholder={t("addressPlaceholder")} required minLength={8} maxLength={300} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
            <Field label={t("city")} htmlFor="city" error={fe.city}>
              <Input id="city" name="city" autoComplete="address-level2" placeholder={t("cityPlaceholder")} className={h} required />
            </Field>
            <Field label={t("postal")} htmlFor="postal_code" error={fe.postal_code}>
              <Input id="postal_code" name="postal_code" inputMode="numeric" autoComplete="postal-code" pattern="\d{5}" maxLength={5} placeholder="12500" className={h} />
            </Field>
          </div>
        </Step>
        <Step n={4} icon={KeyRound} title={t("steps.security")}>
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
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border text-muted-foreground hover:bg-accent hover:text-foreground">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <input type="hidden" name="captcha_token" value={captcha.token} />
            <Input id="captcha" name="captcha" inputMode="numeric" autoComplete="off" placeholder={t("captchaPlaceholder")} className={h}
              value={answer} onChange={(e) => setAnswer(e.target.value)} required />
          </div>
        </Field>
        </Step>
        <SubmitButton className="h-12 w-full rounded-xl text-base" pendingText={t("pending")}>{t("submit")}</SubmitButton>
        <p className="text-center text-sm text-muted-foreground">
          {t("haveAccount")} <Link href="/login" className="font-semibold text-primary hover:underline">{t("signIn")}</Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">{t("terms")}</p>
      </>); }}
    </ActionForm>
  );
}
