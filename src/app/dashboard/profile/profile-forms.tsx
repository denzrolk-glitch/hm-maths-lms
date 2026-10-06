"use client";
import { ActionForm } from "@/components/action-form";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordInput } from "@/components/password-input";
import { changePasswordAction, updateProfileAction } from "@/app/dashboard/actions";
import { useT } from "@/i18n/client";
import { DISTRICTS, TOWNS } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const t = useT("portal.profile");
  const tc = useT("common");
  return (
    <ActionForm action={updateProfileAction} className="space-y-4">
      <Field label={t("fullName")} htmlFor="full_name"><Input id="full_name" name="full_name" defaultValue={profile.full_name} required minLength={3} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("mobile")} hint={t("locked")}><Input value={profile.mobile ?? ""} disabled readOnly /></Field>
        <Field label={t("nic")} hint={t("locked")}><Input value={profile.nic ?? ""} disabled readOnly /></Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("school")} htmlFor="school"><Input id="school" name="school" defaultValue={profile.school ?? ""} /></Field>
        <Field label={t("district")} htmlFor="district">
          <Select id="district" name="district" defaultValue={profile.district ?? ""}>
            <option value="">{tc("dash")}</option>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("town")} htmlFor="town">
          <Select id="town" name="town" defaultValue={profile.town}>{TOWNS.map((x) => <option key={x} value={x}>{tc(`towns.${x}`)}</option>)}</Select>
        </Field>
        <Field label={t("alYear")}><Input value={profile.al_year ?? ""} disabled readOnly /></Field>
      </div>
      <SubmitButton pendingText={tc("actions.saving")}>{tc("actions.saveChanges")}</SubmitButton>
    </ActionForm>
  );
}

export function PasswordForm() {
  const t = useT("portal.profile");
  return (
    <ActionForm action={changePasswordAction} className="space-y-4" resetOnSuccess>
      <Field label={t("current")} htmlFor="current"><PasswordInput id="current" name="current" autoComplete="current-password" required /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("new")} htmlFor="password"><PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} meter required /></Field>
        <Field label={t("confirm")} htmlFor="confirm"><PasswordInput id="confirm" name="confirm" autoComplete="new-password" required /></Field>
      </div>
      <SubmitButton variant="outline" pendingText={t("updating")}>{t("change")}</SubmitButton>
    </ActionForm>
  );
}
