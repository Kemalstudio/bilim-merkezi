import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { Constellation } from "@/components/marketing/constellation";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="grid min-h-screen flex-1 gap-3 bg-background p-3 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="paper-noise relative hidden overflow-hidden rounded-[2rem] bg-[#10241f] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-50" />
        <Constellation
          variant="watermark"
          className="absolute -right-24 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 text-accent opacity-[0.12]"
        />
        <Logo className="relative w-fit [&_span]:!text-white" />
        <div className="relative max-w-xl">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-accent">Кабинет родителя</p>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.01] tracking-[-0.06em] xl:text-6xl">
            Весь прогресс ребёнка — в одном спокойном месте.
          </h1>
          <div className="mt-9 grid gap-3 text-sm text-white/60 sm:grid-cols-2">
            {["Баллы и динамика", "Расписание занятий", "Статус записи", "Безопасный доступ"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" /> {item}
              </span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/35">Bilim Merkezi · Ашхабад</p>
      </section>

      <section className="relative flex items-center justify-center px-2 py-10 sm:px-8">
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center lg:hidden">
          <Logo />
        </div>
        <div className="rounded-[1.6rem] border border-border bg-surface p-6 shadow-glow-md sm:p-9">{children}</div>
      </div>
      </section>
    </main>
  );
}
