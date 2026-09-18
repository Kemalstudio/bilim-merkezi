import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { LottieIcon } from "@/components/shared/lottie-icon";
import { SplitHeading } from "@/components/shared/split-heading";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.about.metaTitle, description: t.about.metaDescription };
}

// Each icon plays when its card is hovered (see public/lottie/CREDITS.md).
// In the same order as `about.values` in the dictionaries.
const VALUE_ANIMATIONS = [
  "/lottie/value-scan.json",
  "/lottie/value-care.json",
  "/lottie/value-team.json",
  "/lottie/value-growth.json",
];

export default async function AboutPage() {
  const [courseCount, studentCount, directions, { t }] = await Promise.all([
    prisma.course.count({ where: { published: true } }),
    prisma.child.count(),
    prisma.course.groupBy({ by: ["categoryId"], where: { published: true } }),
    getI18n(),
  ]);
  const categoryCount = directions.length;
  const a = t.about;
  const values = a.values.map((value, index) => ({ ...value, animation: VALUE_ANIMATIONS[index] }));

  return (
    <div>
      <section className="px-3 sm:px-5">
        <div className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-[#f0b968] px-5 py-20 text-[#0b2233] sm:rounded-[2.4rem] sm:px-10 lg:py-28">
          <AnimeReveal className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <span className="eyebrow !text-[#0b2233]">{a.eyebrow}</span>
            <div>
            <h1 className="max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
              {a.title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#2f4d63]">
              {a.lead}
            </p>
            </div>
          </AnimeReveal>

          <AnimeReveal delay={0.1} className="mx-auto mt-16 grid max-w-7xl grid-cols-3 border-t border-[#0b2233]/25 pt-8">
            <div className="border-r border-[#0b2233]/20">
              <p className="font-display text-4xl font-bold tracking-[-0.05em]">{courseCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#4d7a94]">{a.programs}</p>
            </div>
            <div className="border-r border-[#0b2233]/20 px-5 sm:px-10">
              <p className="font-display text-4xl font-bold tracking-[-0.05em]">{studentCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#4d7a94]">{a.students}</p>
            </div>
            <div className="pl-5 sm:pl-10">
              <p className="font-display text-4xl font-bold tracking-[-0.05em]">{categoryCount}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#4d7a94]">{a.directions}</p>
            </div>
          </AnimeReveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
        <AnimeReveal className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <span className="eyebrow">{a.principles}</span>
          <SplitHeading className="section-title text-ink">{a.principlesTitle}</SplitHeading>
        </AnimeReveal>
        <div className="mt-14 grid overflow-hidden rounded-[1.6rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => (
            <AnimeReveal key={value.title} delay={i * 0.08}>
              <div className="group h-full min-h-72 bg-surface p-7 transition-colors hover:bg-accent">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-sunken p-1.5 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 dark:bg-[#dbe6ee]">
                  <LottieIcon src={value.animation} trigger="hover" className="h-full w-full" />
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
