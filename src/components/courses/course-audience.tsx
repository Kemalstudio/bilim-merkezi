import { CircleDot, ClipboardCheck, Sparkles } from "lucide-react";

/** "Для кого курс" and "Что нужно знать заранее", side by side. */
export function CourseAudience({ audience, requirements }: { audience: string[]; requirements: string[] }) {
  const columns = [
    { title: "Для кого курс", icon: Sparkles, items: audience },
    { title: "Что нужно знать заранее", icon: ClipboardCheck, items: requirements },
  ].filter((column) => column.items.length > 0);
  if (columns.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {columns.map(({ title, icon: Icon, items }) => (
        <section key={title} className="rounded-[1.4rem] border border-border bg-surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-[-0.03em] text-ink">
            <Icon aria-hidden className="h-5 w-5 text-accent-deep" />
            {title}
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-ink-soft">
                <CircleDot aria-hidden className="mt-1 h-3.5 w-3.5 shrink-0 text-brand" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
