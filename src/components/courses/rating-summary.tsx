import { Star } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

/** Average rating and how the reviews spread over 5…1 stars. */
export async function RatingSummary({ ratings }: { ratings: number[] }) {
  if (ratings.length === 0) return null;
  const { t, f } = await getI18n();

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const rows = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratings.filter((rating) => rating === stars).length;
    return { stars, count, share: count / ratings.length };
  });

  return (
    <div className="flex flex-col gap-5 rounded-[1.4rem] border border-border bg-surface p-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="shrink-0 text-center sm:w-36">
        <p className="font-display text-5xl font-bold tracking-[-0.05em] text-ink">{average.toFixed(1)}</p>
        <div className="mt-1 flex justify-center gap-0.5 text-amber" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="h-4 w-4" fill={i < Math.round(average) ? "currentColor" : "none"} />
          ))}
        </div>
        <p className="mt-1 text-xs font-semibold text-muted">{f.count(ratings.length, t.units.review)}</p>
      </div>
      <ul className="flex flex-1 flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.stars} className="flex items-center gap-3 text-xs font-semibold text-ink-soft">
            <span className="flex w-8 items-center gap-0.5 tabular-nums">
              {row.stars}
              <Star aria-hidden className="h-3 w-3 fill-current text-amber" />
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
              <span className="block h-full rounded-full bg-amber" style={{ width: `${row.share * 100}%` }} />
            </span>
            <span className="w-10 text-right tabular-nums text-muted">{Math.round(row.share * 100)}%</span>
            <span className="sr-only">— {f.count(row.count, t.units.review)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
