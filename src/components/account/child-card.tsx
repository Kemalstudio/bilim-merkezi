import Link from "next/link";
import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ChildSummary } from "@/lib/children-data";
import { ChildAvatar } from "@/components/account/child-avatar";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { tpl } from "@/lib/i18n/format";

/** Overview card: who the child is, where they stand, and where it is heading. */
export async function ChildCard({ child }: { child: ChildSummary }) {
  const { t, f } = await getI18n();
  return (
    <Link
      href={`/account/children/${child.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-glow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start gap-3">
        <ChildAvatar
          firstName={child.firstName}
          lastName={child.lastName}
          hue={child.avatarHue}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-ink">
            {child.firstName} {child.lastName}
          </p>
          <p className="text-sm text-muted">
            {child.grade != null ? `${f.grade(child.grade)} · ` : ""}
            {f.count(child.activeCourses, t.units.course)}
          </p>
        </div>
        <ArrowUpRight
          aria-hidden
          className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-brand-ink"
        />
      </div>

      {child.latestExam ? (
        <div className="flex items-end justify-between gap-3 rounded-xl bg-surface-sunken p-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted">{child.latestExam.examName}</p>
            <p className="font-display text-2xl font-bold text-ink">
              {child.latestExam.percent}
              <span className="text-base text-muted">%</span>
            </p>
          </div>
          <TrendBadge trend={child.trend} firstLabel={t.account.firstResult} unit={t.format.pp} />
        </div>
      ) : (
        <p className="rounded-xl bg-surface-sunken p-4 text-xs text-muted">
          {t.account.cardNoResults}
        </p>
      )}
    </Link>
  );
}

function TrendBadge({ trend, firstLabel, unit }: { trend: number | null; firstLabel: string; unit: string }) {
  if (trend == null) {
    return <span className="text-xs text-muted">{firstLabel}</span>;
  }

  const Icon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const tone =
    trend > 0 ? "text-emerald bg-emerald/10" : trend < 0 ? "text-rose bg-rose/10" : "text-muted bg-border/60";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone
      )}
    >
      <Icon aria-hidden className="h-3.5 w-3.5" />
      {tpl(unit, { value: `${trend > 0 ? "+" : ""}${trend}` })}
    </span>
  );
}
