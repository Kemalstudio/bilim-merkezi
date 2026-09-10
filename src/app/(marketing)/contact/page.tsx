import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { Constellation } from "@/components/marketing/constellation";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Свяжитесь с командой Bilim Merkezi.",
};

const channels = [
  { icon: Mail, label: "Email", value: "hello@bilim.tm", href: "mailto:hello@bilim.tm" },
  { icon: Phone, label: "Телефон", value: "+993 12 345 678", href: "tel:+99312345678" },
  { icon: MapPin, label: "Адрес", value: "Ашхабад, Туркменистан", href: undefined },
  { icon: Clock, label: "Часы работы", value: "Пн–Пт, 9:00–18:00", href: undefined },
];

export default function ContactPage() {
  return (
    <div className="pb-24">
      <section className="px-3 sm:px-5">
        <div className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-[#10241f] px-5 py-20 text-white sm:rounded-[2.4rem] sm:px-10 lg:py-28">
          <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-40" />
          <Constellation
            variant="watermark"
            className="absolute -bottom-40 -right-28 h-[38rem] w-[38rem] text-accent opacity-[0.09]"
          />
          <AnimeReveal className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <span className="eyebrow !text-accent">Контакты</span>
            <div>
              <h1 className="max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
                Давайте обсудим цель вашего ребёнка
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/55">
                Ответим на вопросы о программе, формате и поступлении. Спокойно, по делу и без
                навязчивых продаж.
              </p>
            </div>
          </AnimeReveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid overflow-hidden rounded-[1.6rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ icon: Icon, label, value, href }, index) => (
            <AnimeReveal key={label} delay={index * 0.07} className="bg-surface">
              <div className="group min-h-64 bg-surface p-7 transition-colors hover:bg-accent">
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-sunken text-brand-ink group-hover:bg-[#14201d] group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="font-display text-xs font-bold text-muted">0{index + 1}</span>
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
