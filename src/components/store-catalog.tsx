import Image from "next/image";
import Link from "next/link";
import { BookOpen, Package } from "lucide-react";
import type { ClassRow, Product } from "@/lib/types";
import { ClassCard } from "@/components/class-card";
import { EmptyState } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";
import { getT } from "@/i18n/server";
import { formatLKR } from "@/lib/utils";

/** Per-class state for the signed-in student: has access this month, or a slip waiting for review. */
export type ClassOwnership = Record<string, "owned" | "pending">;

export async function StoreCatalog({ classes, products, owned }: { classes: ClassRow[]; products: Product[]; owned?: ClassOwnership }) {
  const t = await getT("portal.store");
  const paid = classes.filter((c) => !c.is_free);
  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-1 font-display text-xl font-bold text-slate-900 dark:text-white">{t("classesTitle")}</h2>
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">{t("classesText")}</p>
        {paid.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paid.map((c) => (
              <ClassCard key={c.id} cls={c} href={owned?.[c.id] === "owned" ? `/dashboard/classes/${c.id}` : `/dashboard/store/class/${c.id}`}
                footer={owned?.[c.id] === "owned" ? (
                  <span className="flex items-center gap-2"><Badge variant="success"><CheckCircle2 /> {t("owned")}</Badge><span className={buttonVariants({ size: "sm", variant: "outline" })}>{t("open")}</span></span>
                ) : owned?.[c.id] === "pending" ? (
                  <Badge variant="warning"><Clock /> {t("pending")}</Badge>
                ) : <span className={buttonVariants({ size: "sm" })}>{t("enroll")}</span>} />
            ))}
          </div>
        ) : (
          <EmptyState icon={BookOpen} title={t("noClasses")} description={t("noClassesText")} />
        )}
      </section>
      <section>
        <h2 className="mb-1 font-display text-xl font-bold text-slate-900 dark:text-white">{t("booksTitle")}</h2>
        <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">{t("booksText")}</p>
        {products.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <Link key={p.id} href={`/dashboard/store/product/${p.id}`} className="group overflow-hidden rounded-2xl border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-teal-600 to-brand-400">
                  {p.image_url ? <Image src={p.image_url} alt={p.title} fill sizes="300px" className="object-cover" /> :
                    <Package className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/40" />}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-primary">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                  <p className="mt-3 font-display font-bold">{formatLKR(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={Package} title={t("noBooks")} description={t("noBooksText")} />
        )}
      </section>
    </div>
  );
}
