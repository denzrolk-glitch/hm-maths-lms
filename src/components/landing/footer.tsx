import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Music2, Phone, Youtube } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { getT } from "@/i18n/server";
import { SITE } from "@/content/site";

export async function LandingFooter() {
  const t = await getT("landing");
  const socials = [
    { href: SITE.social.facebook, Icon: Facebook, label: "Facebook" },
    { href: SITE.social.youtube, Icon: Youtube, label: "YouTube" },
    { href: SITE.social.tiktok, Icon: Music2, label: "TikTok" },
    { href: SITE.social.instagram, Icon: Instagram, label: "Instagram" },
  ].filter((s) => s.href);
  const links = [["classes", "/#classes"], ["story", "/#story"], ["store", "/store"], ["support", "/#support"]] as const;
  return (
    <footer className="border-t border-white/10 bg-[#050505] text-white/60">
      <div className="container grid grid-cols-1 gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <LogoMark className="h-12 w-12" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{t("footer.blurb")}</p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-white">{t("footer.links")}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {links.map(([k, href]) => <li key={k}><Link href={href} className="hover:text-brand-400">{t(`nav.${k}`)}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-white">{t("footer.contact")}</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />{SITE.contact.address}</li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /><a href={`mailto:${SITE.contact.email}`} className="hover:text-white">{SITE.contact.email}</a></li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /><a href={`tel:${SITE.contact.phone.replace(/\s/g, "")}`} className="hover:text-white">{SITE.contact.phone}</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-white">{t("footer.follow")}</h3>
          <div className="mt-4 flex gap-2">
            {socials.map(({ href, Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 transition hover:border-brand-500 hover:bg-brand-500 hover:text-white">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="container flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <p className="text-white/40">{t("footer.notice")}</p>
        </div>
      </div>
    </footer>
  );
}
