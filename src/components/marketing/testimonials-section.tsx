import { prisma } from "@/lib/prisma";
import { getI18n } from "@/lib/i18n/server";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { SplitHeading } from "@/components/shared/split-heading";
import { TestimonialReveal } from "@/components/marketing/testimonial-reveal";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export async function TestimonialsSection({ labels }: { labels: Dictionary["testimonials"] }) {
  // Each review is shown as a large scroll-revealed quote, so a handful reads best.
  const reviews = await prisma.review.findMany({
    where: { rating: { gte: 4 }, comment: { not: null } },
    include: { user: { select: { name: true } }, course: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  if (reviews.length === 0) return null;
  const { t } = await getI18n();

  const items = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment ?? "",
    userName: review.user.name ?? t.common.parent,
    courseTitle: review.course.title,
  }));

  return (
    <section id="testimonials" className="scroll-mt-24 px-3 sm:px-5">
      <div className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-panel py-20 text-white sm:rounded-[2.4rem] lg:py-28">
        <div aria-hidden className="science-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <AnimeReveal className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <span className="eyebrow !text-accent">{labels.eyebrow}</span>
            <SplitHeading className="section-title max-w-3xl text-white">{labels.title}</SplitHeading>
          </AnimeReveal>

          <div className="mt-14">
            <TestimonialReveal items={items} />
          </div>
        </div>
      </div>
    </section>
  );
}
