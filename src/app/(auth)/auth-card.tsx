import { LogoMark } from "@/components/logo";

export function AuthCard({ title, subtitle, hashtag, children, wide }: {
  title: string; subtitle?: string; hashtag?: string; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className={`w-full ${wide ? "max-w-xl" : "max-w-md"} rounded-3xl bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,.06)] sm:p-9`}>
      <LogoMark className="h-12 w-12" />
      <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      {hashtag ? (
        <div className="my-6 flex items-center gap-3 text-xs font-semibold text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />{hashtag}<span className="h-px flex-1 bg-slate-200" />
        </div>
      ) : <div className="h-6" />}
      {children}
    </div>
  );
}
