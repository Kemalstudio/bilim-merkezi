import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { getAnimations } from "@/lib/site-settings";
import { getI18n } from "@/lib/i18n/server";
import { LANGUAGE_TAGS } from "@/lib/i18n/format";
import { siteUrl } from "@/lib/site-url";
import { I18nProvider } from "@/components/i18n-provider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

// The "js" class also gates the first-load curtain, so it never sticks without scripts, and
// "intro-seen" hides it before first paint once it has played this session (key shared with
// IntroOverlay).
const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");try{if(localStorage.getItem("theme")==="dark"){d.classList.add("dark");}}catch(e){}try{if(sessionStorage.getItem("bilim:intro-seen")==="1"){d.classList.add("intro-seen");}}catch(e){}})();`;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t.site.title, template: "%s — Bilim Merkezi" },
    description: t.site.description,
    openGraph: { siteName: "Bilim Merkezi", type: "website", title: t.site.title, description: t.site.description },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [{ locale, t }, animations] = await Promise.all([getI18n(), getAnimations()]);

  return (
    <html
      lang={LANGUAGE_TAGS[locale]}
      // Read by the scroll reveal components; switched in /bilim/admin/site/animations.
      data-reveals={animations.scrollReveals ? undefined : "off"}
      suppressHydrationWarning
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-ink">
        <I18nProvider locale={locale} t={t}>
          {children}
        </I18nProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
