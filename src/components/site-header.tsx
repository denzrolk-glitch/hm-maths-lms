import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export async function SiteHeader() {
  const { user, profile } = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/#classes" className="hover:text-foreground">Classes</Link>
          <Link href="/#centers" className="hover:text-foreground">Centers</Link>
          <Link href="/#features" className="hover:text-foreground">Why HM Maths</Link>
          <Link href="/store" className="hover:text-foreground">Store</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link href={profile?.role === "admin" ? "/admin" : "/dashboard"} className={buttonVariants({ size: "sm" })}>
              {profile?.role === "admin" ? "Admin panel" : "My dashboard"}
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Log in</Link>
              <Link href="/register" className={buttonVariants({ size: "sm" })}>Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p>© {new Date().getFullYear()} Hasitha Madusanka · Combined Mathematics. All rights reserved.</p>
        <p className="text-xs">Recordings are watermarked. Sharing or re-recording is prohibited.</p>
      </div>
    </footer>
  );
}
