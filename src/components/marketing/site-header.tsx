import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLanguages } from "@/lib/site-settings";
import { Logo } from "@/components/marketing/logo";
import { NavLinks } from "@/components/marketing/nav-links";
import { UserMenu } from "@/components/marketing/user-menu";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import { HeaderShell } from "@/components/marketing/header-shell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const [session, locale, languages] = await Promise.all([auth(), getLocale(), getLanguages()]);
  const dict = await getDictionary(locale);

  return (
    <HeaderShell>
      <Logo />

      <NavLinks labels={dict.nav} className="hidden md:flex" />

      <div className="flex items-center gap-2">
        <LanguageSwitcher locale={locale} available={languages.enabled} label={dict.nav.language} />
        <ThemeToggle className="hidden sm:flex" />

        {session?.user ? (
          <UserMenu user={session.user} labels={dict.nav} />
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">{dict.nav.login}</Link>
            </Button>
            <Button asChild size="sm" className="group">
              <Link href="/register">
                {dict.nav.register}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        )}
        <MobileNav user={session?.user ?? null} labels={dict.nav} />
      </div>
    </HeaderShell>
  );
}
