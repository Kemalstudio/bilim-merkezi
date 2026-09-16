import { AnimeReveal } from "@/components/shared/anime-reveal";
import { SplitHeading } from "@/components/shared/split-heading";
import { MethodCardStack } from "@/components/marketing/method-card-stack";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function LearningExperienceSection({ labels }: { labels: Dictionary["learningExperience"] }) {
  return (
    <section id="why-us" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 lg:py-36">
      <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <AnimeReveal className="lg:sticky lg:top-28 lg:self-start">
          <span className="eyebrow">{labels.eyebrow}</span>
          <SplitHeading className="section-title mt-6 max-w-xl text-ink">{labels.title}</SplitHeading>
          <p className="mt-7 max-w-md text-base leading-7 text-muted">{labels.subtitle}</p>
        </AnimeReveal>

        <MethodCardStack items={labels.items} />
      </div>
    </section>
  );
}
