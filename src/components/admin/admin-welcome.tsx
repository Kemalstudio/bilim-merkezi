import Link from "next/link";
import { ArrowUpRight, LayoutList, Phone, Sparkles, Type } from "lucide-react";
import { Constellation } from "@/components/marketing/constellation";

const SHORTCUTS = [
  { href: "/bilim/admin/site/texts", label: "Тексты", text: "Надписи на трёх языках", icon: Type },
  { href: "/bilim/admin/site/sections", label: "Секции главной", text: "Порядок и видимость", icon: LayoutList },
  { href: "/bilim/admin/site/animations", label: "Анимации", text: "Что двигается на сайте", icon: Sparkles },
  { href: "/bilim/admin/site/contacts", label: "Контакты", text: "Телефон, email, адрес", icon: Phone },
];

/** The dashboard's opening panel, in the same deep-water style as the site's hero. */
export function AdminWelcome({ name, isAdmin }: { name: string | null; isAdmin: boolean }) {
  const firstName = name?.split(" ")[0];

  return (
    <section className="paper-noise relative overflow-hidden rounded-[1.8rem] bg-panel p-6 text-white sm:p-9">
      <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-50" />
      <Constellation
        variant="watermark"
        className="absolute -right-20 -top-24 h-[30rem] w-[30rem] text-accent opacity-[0.1]"
      />

      <div className="relative">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-accent">Админ-панель · Bilim Merkezi</p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] sm:text-5xl">
          {firstName ? `Здравствуйте, ${firstName}.` : "Здравствуйте."}{" "}
          <span className="text-accent">Сайт под контролем.</span>
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-white/60">
          Меняйте тексты, порядок секций, анимации и контакты. Всё, что вы сохраните, сразу появится на сайте.
        </p>

        {isAdmin && (
          <div className="mt-8 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {SHORTCUTS.map(({ href, label, text, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-[1.1rem] border border-white/10 bg-white/[0.05] p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white/[0.09]"
              >
                <span className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[#0b2233]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-white/40 transition-colors group-hover:text-accent" />
                </span>
                <span className="mt-4 block font-display font-bold">{label}</span>
                <span className="mt-0.5 block text-sm text-white/50">{text}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
