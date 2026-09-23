import Link from "next/link";
import { Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getContacts } from "@/lib/site-settings";
import { phoneHref } from "@/lib/site-settings-schema";

export async function SiteFooter() {
  const locale = await getLocale();
  const [dict, contacts] = await Promise.all([getDictionary(locale), getContacts()]);
  const t = dict.footer;

  const columns = [
    {
      title: t.columns.platform.title,
      links: [
        { href: "/courses", label: t.columns.platform.catalog },
        { href: "/library", label: t.columns.platform.library },
        { href: "/about", label: t.columns.platform.about },
        { href: "/contact", label: t.columns.platform.contact },
      ],
    },
    {
      title: t.columns.categories.title,
      links: [
        { href: "/courses?category=math", label: t.columns.categories.math },
        { href: "/courses?category=science", label: t.columns.categories.science },
        { href: "/courses?category=languages", label: t.columns.categories.languages },
        { href: "/courses?category=programming", label: t.columns.categories.programming },
      ],
    },
    {
      title: t.columns.account.title,
      links: [
        { href: "/login", label: t.columns.account.login },
        { href: "/register", label: t.columns.account.register },
        { href: "/account", label: t.columns.account.account },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-panel text-white">
      <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-25" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Logo tone="light" />
            <p className="max-w-xs text-sm leading-6 text-white/50">{t.description}</p>
            <div className="flex flex-col gap-2 text-sm text-white/65">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" /> {contacts.address}
              </span>
              <a href={`mailto:${contacts.email}`} className="flex min-h-10 items-center gap-2 transition-colors hover:text-accent sm:min-h-0">
                <Mail className="h-4 w-4 text-accent" /> {contacts.email}
              </a>
              <a href={phoneHref(contacts.phone)} className="flex min-h-10 items-center gap-2 transition-colors hover:text-accent sm:min-h-0">
                <Phone className="h-4 w-4 text-accent" /> {contacts.phone}
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-0.5 sm:gap-2.5">
              <h4 className="mb-1.5 font-display text-sm font-bold text-white sm:mb-0">{col.title}</h4>
              {col.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex min-h-10 items-center gap-1 text-sm text-white/60 transition-colors hover:text-accent sm:min-h-0"
                >
                  {link.label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="relative mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row">
          <span>© {new Date().getFullYear()} Bilim Merkezi. {t.rights}</span>
          <span>{t.paymentNote}</span>
        </div>
      </div>
    </footer>
  );
}
