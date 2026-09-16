import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toCourseCardData } from "@/lib/course-mappers";
import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { HorizontalGallery } from "@/components/shared/horizontal-gallery";
import { SplitHeading } from "@/components/shared/split-heading";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export async function PopularCoursesSection({ labels }: { labels: Dictionary["popularCourses"] }) {
  const courses = await prisma.course.findMany({
    where: { published: true, featured: true },
    include: { category: true, reviews: { select: { rating: true } }, _count: { select: { modules: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  if (courses.length === 0) return null;

  return (
    <section className="pb-28">
      <HorizontalGallery
        header={
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-6 border-t border-border pt-14 sm:flex-row sm:items-end">
              <div>
                <span className="eyebrow">{labels.eyebrow}</span>
                <SplitHeading className="mt-5 font-display text-3xl font-bold tracking-[-0.05em] text-ink sm:text-5xl">
                  {labels.title}
                </SplitHeading>
              </div>
              <Button asChild variant="ghost">
                <Link href="/courses">
                  {labels.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        }
      >
        {courses.map((course) => (
          <div key={course.slug} className="flex w-[min(82vw,26rem)] shrink-0 snap-start [&>*]:w-full">
            <CourseCard course={toCourseCardData(course)} />
          </div>
        ))}
        <Link
          href="/courses"
          className="group flex w-[min(70vw,20rem)] shrink-0 snap-start flex-col justify-between gap-10 rounded-[1.45rem] bg-accent p-7 text-[#0b2233] transition-colors duration-300 hover:bg-accent-soft"
        >
          <span className="font-display text-4xl font-bold leading-none tracking-[-0.05em]">{labels.cta}</span>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0b2233] text-accent transition-transform duration-300 group-hover:translate-x-1.5">
            <ArrowRight className="h-5 w-5" />
          </span>
        </Link>
      </HorizontalGallery>
    </section>
  );
}
