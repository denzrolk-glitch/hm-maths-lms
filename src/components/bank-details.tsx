import { Landmark } from "lucide-react";
import { SITE } from "@/content/site";
import { getT } from "@/i18n/server";

export async function BankDetails({ amount, stacked = false }: { amount?: string; stacked?: boolean }) {
  const t = await getT("common.bank");
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 font-display font-semibold"><Landmark className="h-4 w-4 text-primary" /> {t("title")}</div>
      {amount && <p className="text-sm">{t("amount")} <b className="font-display text-base">{amount}</b></p>}
      <div className={stacked ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
        {SITE.bankAccounts.map((b) => (
          <div key={b.bank + b.accountNumber} className="rounded-xl border bg-muted/40 p-3 text-sm">
            <p className="font-semibold">{b.bank}</p>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
              <dt className="text-muted-foreground">{t("name")}</dt><dd className="font-medium">{b.accountName}</dd>
              <dt className="text-muted-foreground">{t("account")}</dt><dd className="font-mono font-semibold tracking-wide">{b.accountNumber}</dd>
              <dt className="text-muted-foreground">{t("branch")}</dt><dd>{b.branch}</dd>
            </dl>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("reference")}</p>
    </div>
  );
}
