import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { ScheduleItem } from "@/lib/children-data";

const dayFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });
const timeFormatter = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });
const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });

/** Upcoming lessons, newest first, with the child's name when it is shared. */
export function ScheduleTimeline({
  items,
  showChildName = false,
}: {
  items: ScheduleItem[];
  showChildName?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
        <CalendarDays aria-hidden className="h-4 w-4 shrink-0" />
        Ближайших занятий пока нет — расписание появится после подтверждения записи.
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {items.map((item) => {
        const start = new Date(item.startsAt);
        return (
          <li
            key={item.id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-glow-sm"
          >
            <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-surface-sunken py-2">
              <span className="font-display text-sm font-bold text-ink">
                {dayFormatter.format(start)}
              </span>
              <span className="text-[11px] uppercase text-muted">
                {weekdayFormatter.format(start)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
              <p className="truncate text-xs text-muted">
                {item.courseTitle}
                {showChildName && item.childName ? ` · ${item.childName}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden className="h-3 w-3" />
                <time dateTime={item.startsAt}>{timeFormatter.format(start)}</time>
              </span>
              {item.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden className="h-3 w-3" /> {item.location}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
