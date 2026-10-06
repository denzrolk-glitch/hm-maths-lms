import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Sinhala, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getMessages, getT } from "@/i18n/server";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sinhala = Noto_Sans_Sinhala({ subsets: ["sinhala"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sinhala", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("common.meta");
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
    keywords: t.raw<string[]>("keywords"),
  };
}

export const viewport: Viewport = { themeColor: "#050505" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} ${sinhala.variable} min-h-dvh font-sans`}>
        <I18nProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
