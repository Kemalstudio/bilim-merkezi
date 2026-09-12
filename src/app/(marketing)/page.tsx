import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Hero } from "@/components/marketing/hero";
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
 * The page is ordered as a parent's decision: trust → method → proof →
 * suitable programme → people → social proof → enrolment.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  const storyStages = [
    { id: "why-us", label: dict.story.whyUs },
    { id: "how-it-works", label: dict.story.howItWorks },
    { id: "results", label: dict.story.results },
    { id: "testimonials", label: dict.story.testimonials },
    { id: "enroll", label: dict.story.enroll },
  ];

  return (
    <>
      <StoryProgress stages={storyStages} navLabel={dict.story.label} />
      <Hero />
      <TrustStatsSection labels={dict.stats} />
      <JourneySection labels={dict.journey} />
      <LearningExperienceSection labels={dict.learningExperience} />
      <HowItWorksSection labels={dict.howItWorks} />
      <ResultsSection labels={dict.results} />
      <DashboardShowcaseSection labels={dict.dashboard} subjects={dict.gridZoom.subjects} />
      <GridZoomSection labels={dict.gridZoom} />
      <LearningDirectionsSection labels={dict.directions} />
      <LessonShowcaseSection labels={dict.lesson} />
      <PopularCoursesSection labels={dict.popularCourses} />
      <InstructorsSection labels={dict.instructors} />
      <SummitSection labels={dict.summit} />
      <TestimonialsSection labels={dict.testimonials} />
      <VelocityMarquee
        rows={[
          { words: Object.values(dict.gridZoom.subjects), tone: "ink", direction: 1 },
          { words: dict.marquee.words, tone: "accent", direction: -1 },
        ]}
      />
      <FaqSection labels={dict.faq} />
      <CtaSection labels={dict.finalCta} />
    </>
  );
}
