import { Fragment, type ReactNode } from "react";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getAnimations, getSections } from "@/lib/site-settings";
import type { HomeSectionId } from "@/lib/site-settings-schema";
import { Hero } from "@/components/marketing/hero";
import { HeroStage } from "@/components/marketing/hero-stage";
import { StoryProgress } from "@/components/marketing/story-progress";
import { TrustStatsSection } from "@/components/marketing/trust-stats-section";
import { JourneySection } from "@/components/marketing/journey-section";
import { LearningDirectionsSection } from "@/components/marketing/learning-directions-section";
import { LessonShowcaseSection } from "@/components/marketing/lesson-showcase-section";
import { LearningExperienceSection } from "@/components/marketing/learning-experience-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { ResultsSection } from "@/components/marketing/results-section";
import { GridZoomSection } from "@/components/marketing/grid-zoom-section";
import { DashboardShowcaseSection } from "@/components/marketing/dashboard-showcase-section";
import { PopularCoursesSection } from "@/components/marketing/popular-courses-section";
import { InstructorsSection } from "@/components/marketing/instructors-section";
import { SummitSection } from "@/components/marketing/summit-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { VelocityMarquee } from "@/components/shared/velocity-marquee";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";

/**
 * By default the page is ordered as a parent's decision: trust → method → proof → suitable
 * programme → people → social proof → enrolment. Order and visibility are managed in
 * /bilim/admin/site/sections; hero and stats always open the page, as one pinned scene.
 */
export default async function HomePage() {
  const [locale, sections, animations] = await Promise.all([getLocale(), getSections(), getAnimations()]);
  const dict = await getDictionary(locale);

  const shown = new Set(sections.filter((section) => section.visible).map((section) => section.id));
  const order = sections.map((section) => section.id);

  const blocks: Partial<Record<HomeSectionId, ReactNode>> = {
    journey: <JourneySection labels={dict.journey} />,
    learningExperience: <LearningExperienceSection labels={dict.learningExperience} />,
    howItWorks: <HowItWorksSection labels={dict.howItWorks} />,
    results: <ResultsSection labels={dict.results} />,
    dashboard: <DashboardShowcaseSection labels={dict.dashboard} subjects={dict.gridZoom.subjects} />,
    gridZoom: <GridZoomSection labels={dict.gridZoom} />,
    directions: <LearningDirectionsSection labels={dict.directions} />,
    lesson: <LessonShowcaseSection labels={dict.lesson} />,
    popularCourses: <PopularCoursesSection labels={dict.popularCourses} />,
    instructors: <InstructorsSection labels={dict.instructors} />,
    summit: <SummitSection labels={dict.summit} />,
    testimonials: <TestimonialsSection labels={dict.testimonials} />,
    marquee: (
      <VelocityMarquee
        rows={[
          { words: Object.values(dict.gridZoom.subjects), tone: "ink", direction: 1 },
          { words: dict.marquee.words, tone: "accent", direction: -1 },
        ]}
      />
    ),
    faq: <FaqSection labels={dict.faq} />,
    cta: <CtaSection labels={dict.finalCta} />,
  };

  const storyStages = (
    [
      { id: "why-us", label: dict.story.whyUs, section: "learningExperience" },
      { id: "how-it-works", label: dict.story.howItWorks, section: "howItWorks" },
      { id: "results", label: dict.story.results, section: "results" },
      { id: "testimonials", label: dict.story.testimonials, section: "testimonials" },
      { id: "enroll", label: dict.story.enroll, section: "cta" },
    ] satisfies { id: string; label: string; section: HomeSectionId }[]
  )
    .filter((stage) => shown.has(stage.section))
    .sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section))
    .map(({ id, label }) => ({ id, label }));

  const heroScene = animations.heroScene && shown.has("hero");

  return (
    <>
      {storyStages.length > 0 && <StoryProgress stages={storyStages} navLabel={dict.story.label} />}

      {(shown.has("hero") || shown.has("stats")) && (
        <HeroStage enabled={heroScene}>
          {shown.has("hero") && <Hero pinned={heroScene} allow3d={animations.hero3d} />}
          {/* The stats bar tucks under the hero; without one it needs room of its own. */}
          {!shown.has("hero") && shown.has("stats") && <div aria-hidden className="h-28" />}
          {shown.has("stats") && <TrustStatsSection labels={dict.stats} />}
        </HeroStage>
      )}

      {sections.map((section) =>
        section.visible && blocks[section.id] ? <Fragment key={section.id}>{blocks[section.id]}</Fragment> : null
      )}
    </>
  );
}
