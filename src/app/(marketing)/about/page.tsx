import type { Metadata } from "next";
import { ChartNoAxesCombined, HeartHandshake, ScanSearch, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AnimeReveal } from "@/components/shared/anime-reveal";

export const metadata: Metadata = {
  title: "О нас",
  description: "Bilim Merkezi — образовательный центр с прозрачной системой подготовки к экзаменам.",
};

const values = [
  {
    icon: ScanSearch,
    title: "Сначала понимаем причину",
    description: "Диагностика показывает не только слабую тему, но и тип ошибки, который мешает баллам расти.",
  },
  {
    icon: HeartHandshake,
    title: "Бережно, но требовательно",
    description: "Поддерживаем ребёнка и одновременно держим фокус на измеримом результате.",
  },
  {
    icon: Users,
    title: "Родитель — часть команды",
    description: "Без догадок и вечного «как дела?»: прогресс, расписание и следующий шаг видны в кабинете.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Решения принимают данные",
    description: "Пробные работы меняют маршрут подготовки, если динамика идёт не по плану.",
  },
];

export default async function AboutPage() {
  const [courseCount, studentCount, categoryCount] = await Promise.all([
    prisma.course.count({ where: { published: true } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.category.count(),
  ]);

  return (
    <div>
      <section className="px-3 sm:px-5">
        <div className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-[#efb16c] px-5 py-20 text-[#14201d] sm:rounded-[2.4rem] sm:px-10 lg:py-28">
          <AnimeReveal className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <span className="eyebrow !text-[#14201d]">О центре</span>
            <div>
            <h1 className="max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
              Помогаем ребёнку увидеть: «я могу»
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#3f4e49]">
              Bilim Merkezi соединяет сильного преподавателя, понятный учебный маршрут и прозрачность для родителя. Так подготовка перестаёт быть источником тревоги и становится управляемым процессом.
            </p>
            </div>
          </AnimeReveal>

          <AnimeReveal delay={0.1} className="mx-auto mt-16 grid max-w-7xl grid-cols-3 border-t border-[#14201d]/25 pt-8">
            <div className="border-r border-[#14201d]/20">
              <p className="font-display text-4xl font-bold tracking-[-0.05em]">{courseCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#56635e]">программ</p>
            </div>
            <div className="border-r border-[#14201d]/20 px-5 sm:px-10">
              <p className="font-display text-4xl font-bold tracking-[-0.05em]">{studentCount}+</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#56635e]">учеников</p>
            </div>
            <div className="pl-5 sm:pl-10">
              <p className="font-display text-4xl font-bold tracking-[-0.05em]">{categoryCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#56635e]">направлений</p>
            </div>
          </AnimeReveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
        <AnimeReveal className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <span className="eyebrow">Наши принципы</span>
          <h2 className="section-title text-ink">Что для нас значит хорошая подготовка</h2>
        </AnimeReveal>
        <div className="mt-14 grid overflow-hidden rounded-[1.6rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => (
            <AnimeReveal key={value.title} delay={i * 0.08}>
              <div className="group h-full min-h-72 bg-surface p-7 transition-colors hover:bg-accent">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-sunken text-brand-ink group-hover:bg-[#14201d] group-hover:text-white">
                  <value.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-12 font-display text-xl font-bold leading-tight tracking-[-0.035em] text-ink">{value.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted group-hover:text-ink-soft">{value.description}</p>
              </div>
            </AnimeReveal>
          ))}
        </div>
      </section>
    </div>
  );
}
