import { prisma } from "@/lib/prisma";
import { RollingNumber } from "@/components/shared/rolling-number";
import { AnimeReveal } from "@/components/shared/anime-reveal";

type StatsLabels = { eyebrow: string; students: string; courses: string; categories: string; rating: string };

/** A small live dot: a steady centre with a soft ping around it. */
function PulseDot({ tone }: { tone: string }) {
  return (
    <span aria-hidden className="absolute right-4 top-4 flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${tone}`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${tone}`} />
    </span>
  );
}

export async function TrustStatsSection({ labels }: { labels: StatsLabels }) {
  const [studentCount, courseCount, categoryCount, ratingAgg] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.course.count({ where: { published: true } }),
    prisma.category.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
  ]);

  const avgRating = ratingAgg._avg.rating ?? 4.8;

  const stats = [
    { value: studentCount, suffix: "+", label: labels.students },
    { value: courseCount, suffix: "", label: labels.courses },
    { value: categoryCount, suffix: "", label: labels.categories },
  ];

  return (
    <section data-trust-stats className="relative z-10 -mt-24 px-4 sm:px-6">
      <AnimeReveal stagger={0.1} className="mx-auto grid max-w-6xl grid-cols-2 overflow-hidden rounded-[1.5rem] border border-border/80 bg-surface shadow-glow-lg sm:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className="relative border-b border-r border-border p-5 sm:border-b-0 sm:p-7">
              <PulseDot tone={index === 1 ? "bg-rose" : "bg-accent-deep"} />
              <p className="font-display text-3xl font-bold tracking-[-0.05em] text-ink sm:text-4xl">
                <RollingNumber value={stat.value.toLocaleString("ru-RU")} suffix={stat.suffix} delay={index * 0.12} />
              </p>
              <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.09em] text-muted">{stat.label}</p>
            </div>
          ))}
          <div className="relative border-b border-r border-border p-5 sm:border-b-0 sm:border-r-0 sm:p-7">
            <PulseDot tone="bg-amber" />
            <p className="flex items-start gap-1.5 font-display text-3xl font-bold tracking-[-0.05em] text-ink sm:text-4xl">
              <RollingNumber value={avgRating.toFixed(1)} delay={stats.length * 0.12} />
              <span className="text-xl leading-[1.9] text-amber sm:leading-[2.1]">★</span>
            </p>
            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.09em] text-muted">{labels.rating}</p>
          </div>
      </AnimeReveal>
    </section>
  );
}
