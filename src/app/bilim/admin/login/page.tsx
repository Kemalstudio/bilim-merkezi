import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { Constellation } from "@/components/marketing/constellation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Вход в админ-панель",
  robots: { index: false, follow: false },
};

const FEATURES = ["Секции и их порядок", "Тексты на трёх языках", "Анимации и карточки", "Контакты и языки"];

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="grid min-h-screen flex-1 gap-3 bg-background p-3 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="paper-noise relative hidden overflow-hidden rounded-[2rem] bg-panel p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-50" />
        <Constellation
          variant="watermark"
          className="absolute -right-24 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 text-accent opacity-[0.12]"
        />
        <Logo tone="light" className="relative w-fit" />
        <div className="relative max-w-xl">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-accent">Админ-панель</p>
          <p className="mt-6 font-display text-5xl font-bold leading-[1.01] tracking-[-0.06em] xl:text-6xl">
            Весь сайт — <span className="text-accent">в ваших руках.</span>
          </p>
          <p className="mt-6 max-w-md leading-7 text-white/55">
            Меняйте тексты, порядок секций и анимации без программиста. Всё, что вы сохраните, сразу появится на сайте.
          </p>
          <div className="mt-9 grid gap-3 text-sm text-white/60 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <span key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" /> {feature}
              </span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/35">Bilim Merkezi · доступ только для команды</p>
      </section>

      <section className="relative flex items-center justify-center px-2 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          <div className="rounded-[1.6rem] border border-border bg-surface p-6 shadow-glow-md sm:p-9">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-panel text-accent">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold tracking-[-0.03em] text-ink">Вход в админ-панель</h1>
            <p className="mt-1 text-sm text-muted">Для сотрудников Bilim Merkezi</p>
            <div className="mt-7">
              <AdminLoginForm callbackUrl={callbackUrl} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
