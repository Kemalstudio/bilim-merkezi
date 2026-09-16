import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { CardDeck } from "@/components/shared/card-deck";
import { LottieIcon } from "@/components/shared/lottie-icon";
import { SplitHeading } from "@/components/shared/split-heading";
import { CourseRecommender } from "@/components/marketing/course-recommender";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// Animated icons play when their card is hovered. Each file is coloured for its own card:
// light surface, navy chip on the sand card, and a translucent chip on the deep-water card.
const groupAnimations = {
  languages: "/lottie/dir-languages.json",
  science: "/lottie/dir-science.json",
  it: "/lottie/dir-it.json",
} as const;

export async function LearningDirectionsSection({ labels }: { labels: Dictionary["directions"] }) {
  const categories = await prisma.category.findMany({ select: { slug: true } });
  const availableSlugs = new Set(categories.map((c) => c.slug));

  const groups = (Object.keys(labels.groups) as Array<keyof typeof labels.groups>).map((key) => {
    const group = labels.groups[key];
    const isAvailable = !!group.categorySlug && availableSlugs.has(group.categorySlug);
    return { key, ...group, isAvailable, animation: groupAnimations[key] };
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <AnimeReveal className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <span className="eyebrow">{labels.eyebrow}</span>
        <div>
          <SplitHeading className="section-title text-ink">{labels.title}</SplitHeading>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">{labels.subtitle}</p>
        </div>
      </AnimeReveal>

      <CardDeck className="mt-14 grid gap-4 [perspective:1400px] sm:grid-cols-3">
        {groups.map((group, i) => (
          <div key={group.key} className="relative [perspective:900px]">
            <div
              className={cn(
                // Only translate/shadow transition: a transform transition would fight the GSAP tilt.
                "group flex min-h-80 h-full flex-col rounded-[1.5rem] border p-6 transition-[translate,box-shadow] duration-300 sm:p-7",
                group.isAvailable
                  ? "border-border bg-surface hover:-translate-y-1 hover:shadow-glow-md"
                  : "border-dashed border-border bg-surface-sunken/50",
                i === 1 && "border-accent bg-accent text-[#0b2233]",
                i === 2 && "border-panel bg-panel text-white"
              )}
            >
              <div data-deal className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl bg-surface-sunken p-1.5 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110",
                    // The first icon is drawn in navy, so its chip stays light in dark mode too.
                    i === 0 && "dark:bg-[#dbe6ee]",
                    i === 1 && "bg-[#0b2233]",
                    i === 2 && "bg-white/10"
                  )}
                >
                  <LottieIcon src={group.animation} trigger="hover" className="h-full w-full" />
                </span>
                <span className={cn("font-display text-xs font-bold text-muted", i === 1 && "text-[#4a7690]", i === 2 && "text-white/40")}>0{i + 1}</span>
              </div>
              <h3 data-deal className={cn("mt-12 font-display text-xl font-bold tracking-[-0.035em] text-ink", i > 0 && "text-current")}>{group.title}</h3>
              <div data-deal className="mt-4 flex flex-wrap gap-2">
                {group.chips.map((chip) => (
                  <Badge key={chip} variant="neutral" className={cn(i === 1 && "border-black/10 bg-black/[0.06] text-[#0b2233]", i === 2 && "border-white/10 bg-white/[0.07] text-white/70")}>
                    {chip}
                  </Badge>
                ))}
              </div>
              <div data-deal className="mt-auto pt-8">
                {group.isAvailable ? (
                  <Link
                    href={`/courses?category=${group.categorySlug}`}
                    className={cn("inline-flex items-center gap-1.5 text-sm font-bold text-brand-ink", i > 0 && "text-current")}
                  >
                    {labels.recommender.resultCta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <Badge variant="amber">{labels.comingSoon}</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardDeck>

      <div className="mt-6">
        <AnimeReveal>
          <CourseRecommender labels={labels.recommender} />
        </AnimeReveal>
      </div>
    </section>
  );
}
