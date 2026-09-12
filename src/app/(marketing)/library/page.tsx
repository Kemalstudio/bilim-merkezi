import type { Metadata } from "next";
import { Download, FileArchive, FileImage, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AnimeReveal } from "@/components/shared/anime-reveal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Библиотека",
  description: "Учебные материалы, конспекты и пособия для студентов Bilim Merkezi.",
};

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  zip: FileArchive,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
};

function formatSize(kb: number | null) {
  if (!kb) return null;
  if (kb < 1024) return `${kb} КБ`;
  return `${(kb / 1024).toFixed(1)} МБ`;
}

export default async function LibraryPage() {
  const resources = await prisma.libraryResource.findMany({
    where: { published: true },
    include: { course: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <section className="px-3 sm:px-5">
        <div className="paper-noise relative mx-auto max-w-[1400px] overflow-hidden rounded-[1.8rem] bg-accent px-5 py-20 text-[#0b2233] sm:rounded-[2.4rem] sm:px-10 lg:py-24">
          <AnimeReveal className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <span className="eyebrow !text-[#0b2233]">Библиотека Bilim</span>
            <div>
            <h1 className="max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-7xl">
              Материалы, которые помогают закрепить результат
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#41607a]">
              Конспекты, памятки и тренировочные работы к программам — всё нужное собрано в одном месте.
            </p>
            </div>
          </AnimeReveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        {resources.length === 0 ? (
          <EmptyState icon={FileText} title="Пока нет материалов" description="Скоро здесь появятся учебные пособия." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {resources.map((resource, i) => {
              const Icon = FILE_ICONS[resource.fileType] ?? FileText;
              return (
                <AnimeReveal key={resource.id} delay={i * 0.05}>
                  <a
                    href={resource.fileUrl}
                    download
                    className="group flex min-h-44 items-start gap-4 rounded-[1.4rem] border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-glow-md"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-[#0b2233]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-bold tracking-[-0.03em] text-ink transition-colors group-hover:text-brand-ink">
                        {resource.title}
                      </h3>
                      {resource.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{resource.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {resource.course && <Badge variant="neutral">{resource.course.title}</Badge>}
                        <span className="text-xs uppercase text-muted">{resource.fileType}</span>
                        {formatSize(resource.fileSizeKb) && (
                          <span className="text-xs text-muted">· {formatSize(resource.fileSizeKb)}</span>
                        )}
                      </div>
                    </div>
                    <Download className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-brand-ink" />
                  </a>
                </AnimeReveal>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
