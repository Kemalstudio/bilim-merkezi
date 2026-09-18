import type { Metadata } from "next";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { LottieIcon } from "@/components/shared/lottie-icon";
import { Constellation } from "@/components/marketing/constellation";
import { getContacts } from "@/lib/site-settings";
import { phoneHref } from "@/lib/site-settings-schema";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.contact.metaTitle, description: t.contact.metaDescription };
}

export default async function ContactPage() {
  // Managed in /bilim/admin/site/contacts.
  const [contacts, { t }] = await Promise.all([getContacts(), getI18n()]);
  const c = t.contact;

  // Each icon plays when its card is hovered (see public/lottie/CREDITS.md).
  const channels = [
    { animation: "/lottie/contact-email.json", label: c.email, value: contacts.email, href: `mailto:${contacts.email}` },
    { animation: "/lottie/contact-phone.json", label: c.phone, value: contacts.phone, href: phoneHref(contacts.phone) },
    { animation: "/lottie/contact-location.json", label: c.address, value: contacts.address, href: undefined },
    ...(contacts.hours
      ? [{ animation: "/lottie/contact-clock.json", label: c.hours, value: contacts.hours, href: undefined }]
      : []),
  ];

  return (
    <div className="pb-24">
      <section className="px-3 sm:px-5">
        <div className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-panel px-5 py-20 text-white sm:rounded-[2.4rem] sm:px-10 lg:py-28">
          <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-40" />
          <Constellation
            variant="watermark"
            className="absolute -bottom-40 -right-28 h-[38rem] w-[38rem] text-accent opacity-[0.09]"
          />
          <AnimeReveal className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <span className="eyebrow !text-accent">{c.eyebrow}</span>
            <div>
              <h1 className="max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
                {c.title}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/55">
                {c.lead}
              </p>
            </div>
          </AnimeReveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid overflow-hidden rounded-[1.6rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ animation, label, value, href }, index) => (
            <AnimeReveal key={label} delay={index * 0.07} className="bg-surface">
              <div className="group min-h-64 bg-surface p-7 transition-colors hover:bg-accent">
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-sunken p-1.5 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 dark:bg-[#dbe6ee]">
                    <LottieIcon src={animation} trigger="hover" className="h-full w-full" />
                  </span>
                  <span className="font-display text-xs font-bold text-muted transition-transform duration-300 group-hover:-translate-y-0.5">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-12 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
                  {label}
                </p>
                {href ? (
                  <a
                    href={href}
                    className="mt-2 block break-words font-display text-lg font-bold tracking-[-0.03em] text-ink hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="mt-2 font-display text-lg font-bold tracking-[-0.03em] text-ink">
                    {value}
                  </p>
                )}
              </div>
            </AnimeReveal>
          ))}
        </div>
      </section>
    </div>
  );
}
