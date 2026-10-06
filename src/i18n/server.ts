import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { MESSAGES } from "./messages";
import { makeT } from "./translate";
import { formatDate, formatDateTime, formatMonth } from "@/lib/utils";

export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^si\b/i.test(accept) ? "si" : DEFAULT_LOCALE;
});

export async function getMessages() {
  return MESSAGES[await getLocale()];
}

/** Server-side translator. `const t = await getT("portal"); t("dashboard.title")` */
export async function getT(ns?: string) {
  return makeT(await getMessages(), ns);
}

/** Locale-aware date formatters for server components. */
export async function getFormat() {
  const locale = await getLocale();
  const months = (await getT("common")).raw<string[]>("months");
  return {
    locale,
    month: (m: string) => formatMonth(m, months),
    dateTime: (iso: string | null | undefined) => formatDateTime(iso, locale),
    date: (iso: string | null | undefined) => formatDate(iso, locale),
  };
}
