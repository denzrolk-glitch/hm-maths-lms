"use client";
import { Lock } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordInput } from "@/components/password-input";
import { changePasswordAction, updateProfileAction } from "@/app/dashboard/actions";
import { useT } from "@/i18n/client";
import { DISTRICTS, TOWNS } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useT("portal.profile");
  const tc = useT("common");
  const locked: [string, string | number | null][] = [
    [t("mobile"), profile.mobile],
    [t("alYear"), profile.al_year],
    [t("nic"), profile.nic],
  ];
  return (
    <ActionForm action={updateProfileAction} className="space-y-6">
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("lockedTitle")}</p>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="h-3 w-3" /> {t("locked")}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {locked.map(([label, value], i) => (
            <div key={label} className={cn("rounded-xl border bg-muted/40 px-3.5 py-3", i === 2 && "col-span-2 sm:col-span-1")}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-0.5 truncate font-mono text-sm font-semibold">{value ?? tc("dash")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("editable")}</p>
        <Field label={t("fullName")} htmlFor="full_name"><Input id="full_name" name="full_name" defaultValue={profile.full_name} required minLength={3} maxLength={120} autoComplete="name" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("school")} htmlFor="school"><Input id="school" name="school" defaultValue={profile.school ?? ""} maxLength={120} /></Field>
          <Field label={t("district")} htmlFor="district">
            <Select id="district" name="district" defaultValue={profile.district ?? ""}>
              <option value="">{tc("dash")}</option>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={t("town")} htmlFor="town">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {TOWNS.map((x) => (
              <label key={x} className="cursor-pointer">
                <input type="radio" name="town" value={x} defaultChecked={profile.town === x} className="peer sr-only" />
                <span className="flex h-10 items-center justify-center rounded-lg border px-2 text-center text-sm font-medium transition hover:border-teal-500/50 peer-checked:border-teal-600 peer-checked:bg-teal-50 peer-checked:text-teal-700 peer-focus-visible:ring-2 peer-focus-visible:ring-ring dark:peer-checked:bg-teal-500/10 dark:peer-checked:text-teal-300">
                  {tc(`towns.${x}`)}
                </span>
              </label>
            ))}
          </div>
        </Field>
      </section>

      <section id="address" className="scroll-mt-24 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("deliveryTitle")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("deliveryHint")}</p>
        </div>
        <Field label={t("address")} htmlFor="address">
          <Textarea id="address" name="address" rows={2} defaultValue={profile.address ?? ""} required minLength={8} maxLength={300} autoComplete="street-address" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
          <Field label={t("city")} htmlFor="city"><Input id="city" name="city" defaultValue={profile.city ?? ""} required minLength={2} maxLength={80} autoComplete="address-level2" /></Field>
          <Field label={t("postal")} htmlFor="postal_code"><Input id="postal_code" name="postal_code" defaultValue={profile.postal_code ?? ""} inputMode="numeric" pattern="\d{5}" maxLength={5} autoComplete="postal-code" /></Field>
        </div>
      </section>

      <div className="flex justify-end border-t pt-4">
        <SubmitButton pendingText={tc("actions.saving")}>{tc("actions.saveChanges")}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  const t = useT("portal.profile");
  return (
    <ActionForm action={changePasswordAction} className="space-y-4" resetOnSuccess>
      <Field label={t("current")} htmlFor="current"><PasswordInput id="current" name="current" autoComplete="current-password" required /></Field>
      <Field label={t("new")} htmlFor="password"><PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} meter required /></Field>
      <Field label={t("confirm")} htmlFor="confirm"><PasswordInput id="confirm" name="confirm" autoComplete="new-password" required /></Field>
      <SubmitButton variant="outline" pendingText={t("updating")}>{t("change")}</SubmitButton>
    </ActionForm>
  );
}
