import type { Profile } from "@/lib/types";
import { LogoMark } from "@/components/logo";
import { getT } from "@/i18n/server";
import { initials } from "@/lib/utils";

export async function StudentIdCard({ profile }: { profile: Profile }) {
  const t = await getT("common");
  return (
    <div className="relative mx-auto aspect-[1.586] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-teal-600 to-brand-500 p-5 text-white shadow-2xl shadow-black/20">
      <div className="bg-hex absolute inset-0 opacity-60" />
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
      <span className="absolute -bottom-10 -right-4 select-none font-display text-[10rem] font-black leading-none text-white/5">∑</span>
      <div className="relative flex items-center gap-2">
        <LogoMark className="h-8 w-8" />
        <div className="leading-tight">
          <p className="font-display text-sm font-bold">{t("brand.short")}</p>
          <p className="text-[10px] text-white/70">{t("idCard.subtitle")}</p>
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 font-display text-xl font-bold ring-1 ring-white/20">
          {initials(profile.full_name)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{profile.full_name}</p>
          <p className="font-mono text-sm tracking-wider text-brand-400">{profile.student_id ?? t("idCard.admin")}</p>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-3 gap-2 text-[10px]">
        {[[t("idCard.alYear"), profile.al_year ?? t("dash")], [t("idCard.center"), t(`towns.${profile.town}`)], [t("idCard.nic"), profile.nic ?? t("dash")]].map(([k, v]) => (
          <div key={String(k)}>
            <p className="uppercase tracking-wide text-white/60">{k}</p>
            <p className="truncate text-xs font-semibold">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
