import { KeyRound, LogIn, Mail, Phone, Download, UserRound, type LucideIcon } from "lucide-react";
import type { Ui } from "@/lib/i18n/ui";
import type { Formatter } from "@/lib/i18n/format";

export type ActivityEntry = {
  id: string;
  action: string;
  createdAt: Date;
  provider: string | null;
  device: string | null;
};

const ICONS: Record<string, LucideIcon> = {
  "auth.signin": LogIn,
  "auth.password_changed": KeyRound,
  "auth.password_set": KeyRound,
  "auth.email_changed": Mail,
  "auth.phone_changed": Phone,
  "account.data_exported": Download,
};

/** The last things that happened on the account, newest first. Rendered on the server. */
export function ActivityList({ entries, t, f }: { entries: ActivityEntry[]; t: Ui; f: Formatter }) {
  const events = t.settings.security.events as Record<string, string>;
  const via = t.settings.security.via as Record<string, string>;

  if (entries.length === 0) return <p className="text-sm text-muted">{t.settings.security.activityEmpty}</p>;

  return (
    <ol className="flex flex-col divide-y divide-border rounded-2xl border border-border">
      {entries.map((entry) => {
        const Icon = ICONS[entry.action] ?? UserRound;
        const label = events[entry.action] ?? t.settings.security.unknownEvent;
        const how = entry.action === "auth.signin" && entry.provider ? via[entry.provider] : null;
        const details = [how, entry.device].filter(Boolean).join(" · ");
        return (
          <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-ink-soft">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{label}</p>
              {details && <p className="truncate text-xs text-muted">{details}</p>}
            </div>
            <time dateTime={entry.createdAt.toISOString()} className="shrink-0 text-right text-xs leading-5 text-muted">
              {f.shortDate(entry.createdAt)}
              <br />
              {f.time(entry.createdAt)}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
