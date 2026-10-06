"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, BookOpen, ChevronRight, ClipboardList, CreditCard, GraduationCap, Home, LayoutDashboard, LogOut, Menu,
  PlayCircle, ShoppingCart, User, X, type LucideIcon,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { logoutAction } from "@/app/auth-actions";
import { useT } from "@/i18n/client";
import { cn, initials } from "@/lib/utils";

const NAV: { href: string; key: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/classes", key: "classes", icon: BookOpen },
  { href: "/dashboard/free-zone", key: "free", icon: PlayCircle },
  { href: "/dashboard/exams", key: "exams", icon: ClipboardList },
  { href: "/dashboard/payments", key: "payments", icon: CreditCard },
];
const SKIP = new Set(["class", "product", "lessons"]);
const isId = (s: string) => /^[0-9a-f-]{20,}$/i.test(s);

export function PortalShell({ user, noticeCount, children }: {
  user: { name: string; studentId: string | null; isAdmin: boolean }; noticeCount: number; children: React.ReactNode;
}) {
  const t = useT("portal");
  const tc = useT("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const active = (h: string, exact?: boolean) => (exact ? pathname === h : pathname === h || pathname.startsWith(h + "/"));

  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);

  const segs = pathname.split("/").filter(Boolean);
  const crumbs = segs.map((s, i) => ({ s, href: "/" + segs.slice(0, i + 1).join("/") }))
    .filter((c) => !SKIP.has(c.s))
    .map((c) => ({ href: c.href, label: isId(c.s) ? t("crumbs.details") : t(`crumbs.${c.s}`) }));

  return (
    <div className="portal min-h-dvh bg-[#f4f6fa] dark:bg-[#090b0e] text-foreground">
      <header className="sticky top-0 z-40 bg-[#17191e]/95 text-white backdrop-blur">
        <div className="container flex h-16 items-center gap-4">
          <button type="button" onClick={() => setOpen(true)} aria-label={tc("shell.openMenu")} className="-ml-2 grid h-10 w-10 place-items-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" aria-label={tc("brand.short")}><LogoMark className="h-9 w-9" /></Link>
          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className={cn("relative rounded-lg px-3 py-2 text-[13px] font-medium transition", active(n.href, n.exact) ? "text-white" : "text-white/60 hover:text-white")}>
                {t(`nav.${n.key}`)}
                {active(n.href, n.exact) && <motion.span layoutId="portal-nav" className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-teal-500" />}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitcher tone="dark" className="hidden sm:inline-flex" />
            <Link href="/dashboard/notices" aria-label={tc("shell.notifications")} className="relative grid h-10 w-10 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
              <Bell className="h-5 w-5" />
              {noticeCount > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-teal-500 px-1 text-[10px] font-bold">{noticeCount > 9 ? "9+" : noticeCount}</span>}
            </Link>
            <Link href="/dashboard/store" aria-label={tc("shell.cart")} className="grid h-10 w-10 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <div ref={menuRef} className="relative ml-1">
              <button type="button" onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }} aria-label={tc("shell.account")} aria-expanded={menu}
                className="grid h-10 w-10 place-items-center rounded-full bg-white font-display text-sm font-bold text-teal-700 ring-2 ring-white/10 transition hover:ring-teal-500">
                {initials(user.name)}
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl bg-white dark:bg-[#1a1d24] p-2 text-slate-800 dark:text-slate-100 shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{user.studentId ?? tc("idCard.admin")}</p>
                    </div>
                    <div className="my-1 h-px bg-slate-100 dark:bg-white/10" />
                    <MenuLink href="/dashboard/profile" icon={User} onSelect={() => setMenu(false)}>{t("nav.profile")}</MenuLink>
                    <MenuLink href="/dashboard/payments" icon={CreditCard} onSelect={() => setMenu(false)}>{t("nav.payments")}</MenuLink>
                    {user.isAdmin && <MenuLink href="/admin" icon={GraduationCap} onSelect={() => setMenu(false)}>{t("nav.admin")}</MenuLink>}
                    <MenuLink href="/" icon={Home} onSelect={() => setMenu(false)}>{tc("shell.backToSite")}</MenuLink>
                    <form action={logoutAction}>
                      <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                        <LogOut className="h-4 w-4" /> {tc("actions.logout")}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#17191e] p-4 text-white lg:hidden"
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}>
              <div className="mb-6 flex items-center justify-between">
                <LogoMark className="h-9 w-9" />
                <button type="button" aria-label={tc("shell.closeMenu")} onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10"><X className="h-5 w-5" /></button>
              </div>
              <nav className="flex flex-col gap-1">
                {[...NAV, { href: "/dashboard/store", key: "store", icon: ShoppingCart }, { href: "/dashboard/notices", key: "notices", icon: Bell }, { href: "/dashboard/profile", key: "profile", icon: User }].map((n) => (
                  <Link key={n.href} href={n.href}
                    className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active(n.href, "exact" in n ? n.exact : false) ? "bg-teal-600 text-white" : "text-white/70 hover:bg-white/5")}>
                    <n.icon className="h-4 w-4" /> {t(`nav.${n.key}`)}
                  </Link>
                ))}
                {user.isAdmin && <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"><GraduationCap className="h-4 w-4" /> {t("nav.admin")}</Link>}
              </nav>
              <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
                <LanguageSwitcher tone="dark" />
                <form action={logoutAction}>
                  <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-white/5"><LogOut className="h-4 w-4" /> {tc("actions.logout")}</button>
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[230px] bg-[#17191e] dark:bg-[#12151b] border-b border-black/5 dark:border-white/5" aria-hidden />
        <main className="container relative pb-16 pt-5">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-white/50">
            <Link href="/dashboard" aria-label={tc("actions.home")} className="hover:text-white"><Home className="h-3.5 w-3.5" /></Link>
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3" />
                {i === crumbs.length - 1 ? <span className="font-medium text-white">{c.label}</span> : <Link href={c.href} className="hover:text-white">{c.label}</Link>}
              </span>
            ))}
          </nav>
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
        <footer className="container flex justify-end gap-4 pb-8 text-xs text-slate-600 dark:text-slate-400">
          <Link href="/#support" className="hover:text-teal-600 dark:hover:text-white transition font-medium">{tc("shell.helpDesk")}</Link>
          <span className="font-medium">© {new Date().getFullYear()} {tc("brand.short")}</span>
        </footer>
      </div>
    </div>
  );
}

function MenuLink({ href, icon: Icon, onSelect, children }: { href: string; icon: LucideIcon; onSelect?: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onSelect} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10">
      <Icon className="h-4 w-4 text-slate-400" /> {children}
    </Link>
  );
}
