import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getT } from "@/i18n/server";
import { SITE } from "@/content/site";
import { publicImage } from "@/lib/public-image";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getT("auth.side");
  const img = publicImage(SITE.authImage);
  return (
    <div className="grid grid-cols-1 min-h-dvh bg-[#f4f6fa] lg:grid-cols-[1.15fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#0b0b0b] lg:block">
        {img ? (
          <Image src={img} alt={t("imageAlt")} fill priority sizes="55vw" className="object-cover grayscale" />
        ) : (
          <>
            <div className="bg-hex absolute inset-0" />
            <div className="absolute -left-40 top-1/4 h-[520px] w-[520px] rounded-full bg-brand-500/15 blur-3xl" />
            <span className="absolute -right-10 top-10 select-none font-display text-[26rem] font-black leading-none text-white/[0.04]">∫</span>
            <div className="absolute right-16 top-24 space-y-3 font-mono text-sm text-white/25">
              <p>d/dx (sin x) = cos x</p><p>∫ eˣ dx = eˣ + C</p><p>F = ma</p><p>v² = u² + 2as</p>
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
        <Link href="/" className="absolute left-8 top-8 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20">
          <ArrowLeft className="h-4 w-4" /> {t("home")}
        </Link>
        <div className="absolute inset-x-10 bottom-12 max-w-xl">
          <LogoMark className="mb-6 h-14 w-14" />
          <p className="font-display text-5xl font-extrabold leading-[1.1] text-white xl:text-6xl">
            {t("taglineBefore")} <span className="text-brand-500">{t("taglineHighlight")}</span> {t("taglineAfter")}
          </p>
          <p className="mt-4 text-white/70">{t("subtitle")}</p>
        </div>
      </aside>
      <main className="flex min-h-dvh flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link href="/" className="flex items-center gap-2 lg:invisible" aria-label={t("home")}><LogoMark className="h-9 w-9" /></Link>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-start justify-center px-4 pb-10 sm:items-center">{children}</div>
      </main>
    </div>
  );
}
