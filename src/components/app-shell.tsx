"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, BookOpen, ClipboardList, CreditCard, GraduationCap, LayoutDashboard, LogOut, Menu, Package,
  PlayCircle, ShoppingBag, User, Users, X, Megaphone, type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { logoutAction } from "@/app/auth-actions";
import { cn, initials } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "@/components/language-switcher";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, free: PlayCircle, classes: BookOpen, store: ShoppingBag, exams: ClipboardList,
  notices: Bell, profile: User, payments: CreditCard, students: Users, megaphone: Megaphone, package: Package,
  grad: GraduationCap,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number; exact?: boolean };

export function AppShell({ nav, user, children, area }: {
  nav: NavItem[]; user: { name: string; subtitle: string }; children: React.ReactNode; area: "student" | "admin";
}) {
  const t = useT("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/"));

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item);
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate}
            className={cn("relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
            {active && <motion.span layoutId={`nav-${area}`} className="absolute inset-0 rounded-lg bg-teal-600" transition={{ type: "spring", duration: 0.4 }} />}
            <Icon className="relative h-4 w-4" />
            <span className="relative">{item.label}</span>
            {item.badge ? <span className="relative ml-auto rounded-full bg-warning px-1.5 text-[10px] font-bold text-warning-foreground">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );

  const UserBox = () => (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-500 text-xs font-bold text-white">
        {initials(user.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.subtitle}</p>
      </div>
      <form action={logoutAction}>
        <button type="submit" aria-label={t("actions.logout")} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#f4f6fa] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 bg-[#17191e] p-4 text-white lg:flex [&_.text-muted-foreground]:text-white/55">
        <div className="flex items-center justify-between px-1">
          <Logo tone="dark" label={t("brand.short")} sub={t("brand.sub")} href={area === "admin" ? "/admin" : "/dashboard"} />
        </div>
        {area === "admin" && <span className="mx-1 w-fit rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">{t("shell.admin")}</span>}
        <div className="flex-1 overflow-y-auto"><NavList /></div>
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <LanguageSwitcher tone="dark" />
        </div>
        <UserBox />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl lg:hidden">
        <button aria-label={t("shell.openMenu")} onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-accent"><Menu className="h-5 w-5" /></button>
        <Logo compact label={t("brand.short")} href={area === "admin" ? "/admin" : "/dashboard"} />
        <LanguageSwitcher />
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 bg-[#17191e] p-4 text-white lg:hidden [&_.text-muted-foreground]:text-white/55"
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}>
              <div className="flex items-center justify-between">
                <Logo label={t("brand.short")} sub={t("brand.sub")} />
                <button aria-label={t("shell.closeMenu")} onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-accent"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto"><NavList onNavigate={() => setOpen(false)} /></div>
              <UserBox />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-w-0">
        <motion.div key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
          className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </motion.div>
      </main>
    </div>
  );
}
