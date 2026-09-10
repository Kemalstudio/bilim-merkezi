import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Hero } from "@/components/marketing/hero";
import { StoryProgress } from "@/components/marketing/story-progress";
import { TrustStatsSection } from "@/components/marketing/trust-stats-section";
import { LearningDirectionsSection } from "@/components/marketing/learning-directions-section";
import { LearningExperienceSection } from "@/components/marketing/learning-experience-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { ResultsSection } from "@/components/marketing/results-section";
import { PopularCoursesSection } from "@/components/marketing/popular-courses-section";
import { InstructorsSection } from "@/components/marketing/instructors-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
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
      <LearningExperienceSection labels={dict.learningExperience} />
      <HowItWorksSection labels={dict.howItWorks} />
      <ResultsSection labels={dict.results} />
      <LearningDirectionsSection labels={dict.directions} />
      <PopularCoursesSection labels={dict.popularCourses} />
      <InstructorsSection labels={dict.instructors} />
      <TestimonialsSection labels={dict.testimonials} />
      <FaqSection labels={dict.faq} />
      <CtaSection labels={dict.finalCta} />
    </>
  );
}
