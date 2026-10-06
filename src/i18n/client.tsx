"use client";
import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import { makeT, type Messages } from "./translate";

const Ctx = createContext<{ locale: Locale; messages: Messages } | null>(null);

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, messages }}>{children}</Ctx.Provider>;
}

export function useLocale() {
  return useContext(Ctx)?.locale ?? "en";
}

/** Client-side translator. `const t = useT("auth"); t("login.title")` */
export function useT(ns?: string) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
  return useMemo(() => makeT(ctx.messages, ns), [ctx.messages, ns]);
}
