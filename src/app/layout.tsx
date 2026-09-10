import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { getLocale } from "@/lib/i18n/get-locale";
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

const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("theme")==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: "Bilim Merkezi — подготовка к экзаменам",
    template: "%s — Bilim Merkezi",
  },
  description:
    "Подготовка школьников к экзаменам: диагностика знаний, личный маршрут, небольшие группы и прозрачный прогресс для родителей.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-ink">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
