"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, BookOpen, ChevronRight, ClipboardList, CreditCard, FileText, Flame, GraduationCap, Home, LayoutDashboard,
  LogOut, Megaphone, Menu, Moon, Package, PlayCircle, ShoppingBag, Sun, Trophy, User, Users, X, type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { LogoMark } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { logoutAction } from "@/app/auth-actions";
import { useT } from "@/i18n/client";
import { cn, initials } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard, classes: BookOpen, free: PlayCircle, exams: ClipboardList, papers: FileText, trophy: Trophy,
  payments: CreditCard, store: ShoppingBag, notices: Bell, profile: User, students: Users, megaphone: Megaphone,
  package: Package, grad: GraduationCap, home: Home,
} satisfies Record<string, LucideIcon>;
export type IconKey = keyof typeof ICONS;

export type ShellItem = { href: string; label: string; icon: IconKey; badge?: number; exact?: boolean };
export type ShellGroup = { label: string; items: ShellItem[] };
export type Streak = { current: number; best: number; week: boolean[] };

const isId = (s: string) => /^[0-9a-f-]{20,}$/i.test(s);

export function DashboardShell({ area, groups, tabs, user, notices, menu, streak, crumbNs, children }: {
  area: "student" | "admin";
  groups: ShellGroup[];
  /** hrefs shown in the mobile bottom bar (max 4, the 5th button opens the full menu). */
  tabs: string[];
  user: { name: string; subtitle: string };
  notices?: { href: string; count: number };
  menu: ShellItem[];
  streak?: Streak | null;
  crumbNs: string;
  children: React.ReactNode;
}) {
  const tc = useT("common");
  const tCrumb = useT(crumbNs);
  const ts = useT("portal.streak");
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [account, setAccount] = useState(false);
  const accRef = useRef<HTMLDivElement>(null);
  const all = groups.flatMap((g) => g.items);
  const isActive = (i: Pick<ShellItem, "href" | "exact">) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/"));
  // Most specific active item wins (e.g. /admin/papers over /admin).
  const current = all.filter(isActive).sort((a, b) => b.href.length - a.href.length)[0];
  const activeHref = current?.href;
  const home = area === "admin" ? "/admin" : "/dashboard";

  useEffect(() => { setDrawer(false); setAccount(false); }, [pathname]);
  useEffect(() => {
    if (!account) return;
    const close = (e: PointerEvent) => { if (accRef.current && !accRef.current.contains(e.target as Node)) setAccount(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [account]);

  const segs = pathname.split("/").filter(Boolean);
  const crumbs = segs.slice(1).map((s, i) => ({ href: "/" + segs.slice(0, i + 2).join("/"), s }))
    .filter((c) => !["class", "product", "lessons"].includes(c.s))
    .map((c) => ({ href: c.href, label: isId(c.s) ? tCrumb("details") : tCrumb(c.s) }));

  const Nav = ({ layout }: { layout: string }) => (
    <nav className="space-y-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">{g.label}</p>
          <div className="space-y-0.5">
            {g.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = item.href === activeHref;
              return (
                <Link key={item.href} href={item.href}
                  className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                    active ? "text-primary" : "text-foreground/70 hover:bg-accent/70 hover:text-foreground")}>
                  {active && (
                    <motion.span layoutId={`${layout}-pill`} className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/15 to-brand-400/10 ring-1 ring-primary/15"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                  )}
                  {active && <motion.span layoutId={`${layout}-bar`} className="absolute -left-3 bottom-2 top-2 w-1 rounded-r-full bg-primary" />}
                  <Icon className={cn("relative h-[18px] w-[18px] transition-transform group-hover:scale-110", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="relative truncate">{item.label}</span>
                  {item.badge ? <span className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 text-[10px] font-bold text-white">{item.badge > 99 ? "99+" : item.badge}</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const StreakCard = () => streak ? (
    <Link href="/dashboard/papers" className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-brand-500 p-4 text-white shadow-lg shadow-teal-600/25">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-xl transition group-hover:scale-125" />
      <div className="relative flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20"><Flame className={cn("h-5 w-5", streak.current > 0 && "animate-flicker text-amber-200")} /></span>
        <div>
          <p className="font-display text-xl font-bold leading-none">{ts("days", { n: streak.current })}</p>
          <p className="mt-1 text-[11px] text-white/80">{ts("label")}</p>
        </div>
      </div>
      <div className="relative mt-3 flex justify-between gap-1">
        {streak.week.map((on, i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full", on ? "bg-white" : "bg-white/25")} />)}
      </div>
    </Link>
  ) : null;

  const tabItems = tabs.map((h) => all.find((i) => i.href === h)).filter(Boolean) as ShellItem[];

  return (
    <div className="min-h-dvh bg-background bg-mesh text-foreground">
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] p-3 lg:block">
        <div className="flex h-full flex-col rounded-[22px] border border-border/70 bg-card/85 p-3 shadow-soft backdrop-blur-xl dark:border-white/10">
          <Link href={home} className="flex items-center gap-3 px-2 py-2">
            <LogoMark tone="tile" />
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-bold tracking-tight">{tc("brand.short")}</span>
              <span className="block text-[11px] font-medium text-muted-foreground">{area === "admin" ? tc("shell.adminConsole") : tc("brand.sub")}</span>
            </span>
          </Link>
          <div className="scrollbar-none mt-4 flex-1 overflow-y-auto px-3"><Nav layout="side" /></div>
          <div className="space-y-3 pt-3">
            <StreakCard />
            <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-brand-500 text-xs font-bold text-white">{initials(user.name)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{user.subtitle}</p>
              </div>
              <form action={logoutAction}>
                <button type="submit" aria-label={tc("actions.logout")} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        {/* ── Top bar ── */}
        <header className="glass sticky top-0 z-30 border-b border-border/60 dark:border-white/10">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
            <button type="button" onClick={() => setDrawer(true)} aria-label={tc("shell.openMenu")} className="-ml-1 grid h-10 w-10 place-items-center rounded-xl hover:bg-accent lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <Link href={home} className="lg:hidden" aria-label={tc("brand.short")}><LogoMark tone="tile" className="h-9 w-9" /></Link>
            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
              <Link href={home} aria-label={tc("actions.home")} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"><Home className="h-4 w-4" /></Link>
              {crumbs.map((c, i) => (
                <span key={c.href} className="flex min-w-0 items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  {i === crumbs.length - 1
                    ? <span className="truncate font-semibold">{c.label}</span>
                    : <Link href={c.href} className="truncate text-muted-foreground transition hover:text-foreground">{c.label}</Link>}
                </span>
              ))}
              {!crumbs.length && <span className="font-semibold">{current?.label}</span>}
            </nav>
            <div className="ml-auto flex items-center gap-1">
              <LanguageSwitcher className="hidden sm:inline-flex" />
              <ThemeButton label={tc("shell.toggleTheme")} />
              {notices && (
                <Link href={notices.href} aria-label={tc("shell.notifications")} className="relative grid h-10 w-10 place-items-center rounded-xl text-foreground/70 transition hover:bg-accent hover:text-foreground">
                  <Bell className="h-5 w-5" />
                  {notices.count > 0 && (
                    <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-card">
                      {notices.count > 9 ? "9+" : notices.count}
                    </span>
                  )}
                </Link>
              )}
              <div ref={accRef} className="relative ml-1">
                <button type="button" onClick={() => setAccount((m) => !m)} aria-label={tc("shell.account")} aria-expanded={account}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-brand-500 font-display text-sm font-bold text-white shadow-md shadow-teal-500/25 transition hover:scale-105">
                  {initials(user.name)}
                </button>
                <AnimatePresence>
                  {account && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-border/80 bg-popover p-2 shadow-2xl dark:border-white/10">
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{user.subtitle}</p>
                      </div>
                      <div className="my-1 h-px bg-border" />
                      {menu.map((m) => {
                        const Icon = ICONS[m.icon];
                        return (
                          <Link key={m.href} href={m.href} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground">
                            <Icon className="h-4 w-4 text-muted-foreground" /> {m.label}
                          </Link>
                        );
                      })}
                      <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground">
                        <Home className="h-4 w-4 text-muted-foreground" /> {tc("shell.backToSite")}
                      </Link>
                      <form action={logoutAction}>
                        <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
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

        {/* ── Page ── */}
        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
          <motion.div key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            {children}
          </motion.div>
        </main>
        <footer className="mx-auto hidden max-w-7xl justify-end gap-4 px-6 pb-8 text-xs text-muted-foreground lg:flex">
          <Link href="/#support" className="font-medium transition hover:text-primary">{tc("shell.helpDesk")}</Link>
          <span className="font-medium">© {new Date().getFullYear()} {tc("brand.short")}</span>
        </footer>
      </div>

      {/* ── Mobile bottom bar ── */}
      <nav className="glass fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border/70 p-1.5 shadow-lift dark:border-white/10 lg:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${tabItems.length + 1}, minmax(0, 1fr))` }}>
          {tabItems.map((item) => {
            const Icon = ICONS[item.icon];
            const active = item.href === activeHref;
            return (
              <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-semibold">
                {active && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-gradient-to-b from-teal-500/15 to-brand-400/10" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <Icon className={cn("relative h-5 w-5 transition", active ? "-translate-y-0.5 text-primary" : "text-muted-foreground")} />
                <span className={cn("relative max-w-full truncate px-1", active ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setDrawer(true)} className="relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-semibold text-muted-foreground">
            <Menu className="h-5 w-5" /><span>{tc("shell.more")}</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[320px] flex-col bg-card p-4 shadow-2xl lg:hidden"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 320 }}>
              <div className="mb-5 flex items-center justify-between">
                <Link href={home} className="flex items-center gap-2.5"><LogoMark tone="tile" /><span className="font-display font-bold">{tc("brand.short")}</span></Link>
                <button type="button" aria-label={tc("shell.closeMenu")} onClick={() => setDrawer(false)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-accent"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-3"><Nav layout="drawer" /></div>
              <div className="mt-4 space-y-3 border-t pt-4">
                <StreakCard />
                <div className="flex items-center justify-between">
                  <LanguageSwitcher />
                  <form action={logoutAction}>
                    <button type="submit" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"><LogOut className="h-4 w-4" /> {tc("actions.logout")}</button>
                  </form>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeButton({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button type="button" aria-label={label} onClick={() => setTheme(dark ? "light" : "dark")}
      className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl text-foreground/70 transition hover:bg-accent hover:text-foreground">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? "moon" : "sun"} initial={{ y: -16, opacity: 0, rotate: -60 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: 16, opacity: 0, rotate: 60 }} transition={{ duration: 0.2 }}>
          {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
