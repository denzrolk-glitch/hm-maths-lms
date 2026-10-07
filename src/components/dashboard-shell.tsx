"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, BookOpen, ChevronDown, ChevronRight, ClipboardList, CreditCard, FileText, Flame, GraduationCap, Home, LayoutDashboard,
  LogOut, Megaphone, Menu, Moon, Package, PlayCircle, ShoppingBag, Sun, Trophy, User, Users, X, type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { LogoMark } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/client";
import { cn, initials } from "@/lib/utils";
import { STREAK_KEYS, hottestStreak, type Streaks } from "@/lib/papers";
import { STREAK_META } from "@/components/portal/progress-widgets";

const ICONS = {
  dashboard: LayoutDashboard, classes: BookOpen, free: PlayCircle, exams: ClipboardList, papers: FileText, trophy: Trophy,
  payments: CreditCard, store: ShoppingBag, notices: Bell, profile: User, students: Users, megaphone: Megaphone,
  package: Package, grad: GraduationCap, home: Home,
} satisfies Record<string, LucideIcon>;
export type IconKey = keyof typeof ICONS;

export type ShellItem = { href: string; label: string; icon: IconKey; badge?: number; exact?: boolean };
export type ShellGroup = { label: string; items: ShellItem[] };
export type Streak = Streaks;

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

  const StreakCard = () => {
    if (!streak) return null;
    const hot = hottestStreak(streak);
    const Icon = hot ? STREAK_META[hot.key].icon : Flame;
    return (
      <Link href="/dashboard/papers#streaks" className={cn("group relative block overflow-hidden rounded-2xl p-3 text-white shadow-lg transition hover:-translate-y-0.5",
        hot ? cn("bg-gradient-to-br", STREAK_META[hot.key].tone) : "bg-gradient-to-br from-[#1d1a17] to-[#0b0b0b]")}>
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-xl transition group-hover:scale-125" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20"><Icon className={cn("h-[18px] w-[18px]", hot && "animate-flicker")} /></span>
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-bold leading-tight">
              {hot ? `${ts(`types.${hot.key}.name`)} · ${hot.value.current}` : ts("none")}
            </p>
            <p className="truncate text-[11px] text-white/80">{hot ? ts("papersRow", { n: hot.value.current }) : ts("noneSub")}</p>
          </div>
        </div>
        <div className="relative mt-2.5 flex gap-1">
          {STREAK_KEYS.map((k) => {
            const KIcon = STREAK_META[k].icon;
            const v = streak[k].current;
            return (
              <span key={k} title={`${ts(`types.${k}.name`)}: ${v}`}
                className={cn("flex h-6 flex-1 items-center justify-center gap-0.5 rounded-md text-[10px] font-bold", v > 0 ? "bg-white/25" : "bg-black/15 text-white/45")}>
                <KIcon className="h-3 w-3" />{v}
              </span>
            );
          })}
        </div>
      </Link>
    );
  };

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
          <ScrollFade className="mt-4"><Nav layout="side" /></ScrollFade>
          <div className="space-y-3 pt-3">
            <StreakCard />
            <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-brand-500 text-xs font-bold text-white">{initials(user.name)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{user.subtitle}</p>
              </div>
              <form action="/auth/logout" method="post">
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
                      <form action="/auth/logout" method="post">
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
              <ScrollFade><Nav layout="drawer" /></ScrollFade>
              <div className="mt-4 space-y-3 border-t pt-4">
                <StreakCard />
                <div className="flex items-center justify-between">
                  <LanguageSwitcher />
                  <form action="/auth/logout" method="post">
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

/** Scrollable column with fade edges + a bouncing "more below" button, so it's obvious the list scrolls. */
function ScrollFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ up: false, down: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdges({ up: el.scrollTop > 4, down: el.scrollTop + el.clientHeight < el.scrollHeight - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, []);
  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <div ref={ref} className="scrollbar-thin h-full overflow-y-auto overscroll-contain px-3 pb-2">{children}</div>
      <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-card to-transparent transition-opacity", edges.up ? "opacity-100" : "opacity-0")} />
      <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card via-card/80 to-transparent transition-opacity", edges.down ? "opacity-100" : "opacity-0")} />
      <button type="button" aria-label="Scroll down" tabIndex={-1}
        onClick={() => ref.current?.scrollBy({ top: ref.current.clientHeight * 0.7, behavior: "smooth" })}
        className={cn("absolute bottom-1 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full border border-border bg-card text-primary shadow-md transition",
          edges.down ? "animate-bounce opacity-100" : "pointer-events-none opacity-0")}>
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

