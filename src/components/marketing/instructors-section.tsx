import { prisma } from "@/lib/prisma";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { SplitHeading } from "@/components/shared/split-heading";
import { InstructorShowcase } from "@/components/marketing/instructor-showcase";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export async function InstructorsSection({ labels }: { labels: Dictionary["instructors"] }) {
  const courses = await prisma.course.findMany({
    where: { published: true },
    distinct: ["instructorName"],
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      instructorName: true,
      instructorTitle: true,
      instructorAvatar: true,
      category: { select: { name: true, slug: true } },
    },
  });

  if (courses.length === 0) return null;

  const items = courses.map((course) => ({
    name: course.instructorName,
    title: course.instructorTitle,
    avatar: course.instructorAvatar,
    category: course.category,
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <AnimeReveal className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <span className="eyebrow">{labels.eyebrow}</span>
        <div>
          <SplitHeading className="section-title text-ink">{labels.title}</SplitHeading>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">{labels.subtitle}</p>
        </div>
      </AnimeReveal>

      <InstructorShowcase items={items} />
    </section>
  );
}
