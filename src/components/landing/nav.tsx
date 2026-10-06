"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

const LINKS = [
  ["announcements", "/#announcements"],
  ["story", "/#story"],
  ["testimonials", "/#testimonials"],
  ["classes", "/#classes"],
  ["channels", "/#channels"],
  ["support", "/#support"],
] as const;

/** Floating pill navbar (pb.lk style). `account` = where the main button should lead. */
export function LandingNav({ account }: { account: "guest" | "student" | "admin" }) {
  const t = useT("landing.nav");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const cta = account === "admin" ? { href: "/admin", label: t("admin") }
    : account === "student" ? { href: "/dashboard", label: t("dashboard") }
    : { href: "/login", label: t("login") };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <motion.nav
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-white/10 py-2 pl-5 pr-2 transition-all duration-300",
          scrolled ? "bg-[#0d0c0b]/85 shadow-2xl shadow-black/60 backdrop-blur-xl" : "bg-white/[0.03] backdrop-blur-md",
        )}
      >
        <Link href="/" aria-label="HM Maths" className="flex items-center gap-2"><LogoMark className="h-8 w-8" /></Link>
        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map(([k, href]) => (
            <Link key={k} href={href} className="rounded-full px-3.5 py-2 text-[13px] font-medium text-white/80 transition hover:bg-white/5 hover:text-white">
              {t(k)}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher tone="dark" className="hidden sm:inline-flex" />
          <Link href={cta.href} className="rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_0_24px_rgba(240,91,6,.35)] transition hover:bg-brand-400">
            {cta.label}
          </Link>
          <button type="button" onClick={() => setOpen(true)} aria-label={t("menu")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:bg-white/10 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="m-3 rounded-3xl border border-white/10 bg-[#0d0c0b] p-5" onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <LogoMark className="h-8 w-8" />
                <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-1">
                {LINKS.map(([k, href]) => (
                  <Link key={k} href={href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-base font-medium text-white/85 hover:bg-white/5">
                    {t(k)}
                  </Link>
                ))}
                <Link href="/store" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-base font-medium text-white/85 hover:bg-white/5">{t("store")}</Link>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <LanguageSwitcher tone="dark" />
                <Link href={cta.href} className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">{cta.label}</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
