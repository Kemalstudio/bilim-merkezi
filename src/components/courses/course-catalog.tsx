"use client";

import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Loader2, Search, Table2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AGE_GROUPS, DURATION_GROUPS } from "@/lib/course-levels";
import { tpl } from "@/lib/i18n/format";
import { useI18n } from "@/components/i18n-provider";

const ANY = "any";

export type CategoryOption = { slug: string; name: string; count: number };

const LEVELS = ["", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export const CATALOG_SORTS = ["popular", "rating", "start", "price-asc", "price-desc", "new"] as const;

/**
 * Catalogue controls: debounced search, level switch, sort, and category chips with counts.
 * All state lives in the URL, so results are shareable and the back button works; while the
 * server renders the next set, the results passed as children dim instead of jumping.
 */
export function CourseCatalog({
  categories,
  resultCount,
  allCount,
  children,
}: {
  categories: CategoryOption[];
  resultCount: number;
  /** Courses matching the search and level in every category, for the "all" chip. */
  allCount: number;
  children: ReactNode;
}) {
  const { t, f } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const level = searchParams.get("level") ?? "";
  const sort = searchParams.get("sort") ?? "popular";
  const age = searchParams.get("age") ?? "";
  const duration = searchParams.get("duration") ?? "";
  const view = searchParams.get("view") === "table" ? "table" : "grid";
  const [query, setQuery] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);

  // Back/forward navigation changes the URL under the input: adopt it during render. The typed
  // text is kept when it already matches (so a trailing space mid-typing is not swallowed).
  if (q !== syncedQ) {
    setSyncedQ(q);
    if (q !== query.trim()) setQuery(q);
  }

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const search = params.toString();
      startTransition(() => {
        router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Search as you type, once typing pauses.
  useEffect(() => {
    if (query.trim() === q) return;
    const timer = setTimeout(() => update({ q: query.trim() || null }), 350);
    return () => clearTimeout(timer);
  }, [query, q, update]);

  const categoryName = categories.find((c) => c.slug === category)?.name;
  const levelName = level ? f.level(level) : undefined;
  const ageGroup = AGE_GROUPS.find((group) => group.value === age);
  const ageName = ageGroup && tpl(t.catalog.ageGroup, { min: ageGroup.min, max: ageGroup.max });
  const durationName = DURATION_GROUPS.some((group) => group.value === duration)
    ? t.catalog.durations[duration as keyof typeof t.catalog.durations]
    : undefined;
  const activeFilters = [
    q && { key: "q", label: `«${q}»` },
    categoryName && { key: "category", label: categoryName },
    levelName && { key: "level", label: levelName },
    ageName && { key: "age", label: ageName },
    durationName && { key: "duration", label: durationName },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div>
      <div className="sticky top-[5.25rem] z-30 rounded-[1.3rem] border border-border/80 bg-surface/90 p-3 shadow-glow-sm backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") update({ q: query.trim() || null });
              }}
              placeholder={t.catalog.searchPlaceholder}
              aria-label={t.catalog.searchLabel}
              className="pl-11 pr-10 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  update({ q: null });
                }}
                aria-label={t.catalog.clearSearch}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div role="group" aria-label={t.catalog.levelGroup} className="flex rounded-xl bg-surface-sunken p-1">
              {LEVELS.map((option) => {
                const selected = level === option;
                return (
                  <button
                    key={option || "all"}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => update({ level: option || null })}
                    className={cn(
                      "min-h-10 flex-1 cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-95 sm:min-h-0",
                      selected ? "bg-surface text-ink shadow-glow-sm" : "text-muted hover:text-ink"
                    )}
                  >
                    {option ? f.level(option) : t.common.all}
                  </button>
                );
              })}
            </div>

            <Select value={age || ANY} onValueChange={(value) => update({ age: value === ANY ? null : value })}>
              <SelectTrigger className="whitespace-nowrap sm:w-44" aria-label={t.catalog.ageLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t.catalog.anyAge}</SelectItem>
                {AGE_GROUPS.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {tpl(t.catalog.ageGroup, { min: group.min, max: group.max })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={duration || ANY} onValueChange={(value) => update({ duration: value === ANY ? null : value })}>
              <SelectTrigger className="whitespace-nowrap sm:w-52" aria-label={t.catalog.durationLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t.catalog.anyDuration}</SelectItem>
                {DURATION_GROUPS.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {tpl(t.catalog.durationSuffix, { label: t.catalog.durations[group.value] })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(value) => update({ sort: value === "popular" ? null : value })}>
              <SelectTrigger className="sm:w-48" aria-label={t.catalog.sortLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATALOG_SORTS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t.catalog.sorts[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={t.catalog.categoriesLabel}>
          {[{ slug: "", name: t.catalog.allCategories, count: allCount }, ...categories].map((option) => {
            const selected = category === option.slug;
            const empty = option.count === 0 && !selected;
            return (
              <button
                key={option.slug || "all"}
                type="button"
                aria-pressed={selected}
                disabled={empty}
                onClick={() => update({ category: option.slug || null })}
                className={cn(
                  "flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
                  selected
                    ? "border-panel bg-panel text-white shadow-glow-sm"
                    : "border-border bg-surface text-ink-soft hover:-translate-y-0.5 hover:border-brand/40 hover:text-ink"
                )}
              >
                {option.name}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    selected ? "bg-white/15 text-white" : "bg-surface-sunken text-muted"
                  )}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2" aria-live="polite">
        <p className="mr-2 flex items-center gap-2 text-sm font-semibold text-ink">
          {isPending && <Loader2 aria-hidden className="h-4 w-4 animate-spin text-brand" />}
          {tpl(t.catalog.found, { count: f.count(resultCount, t.units.course) })}
        </p>
        {activeFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => {
              if (filter.key === "q") setQuery("");
              update({ [filter.key]: null });
            }}
            className="group flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand-ink transition-colors hover:bg-brand/20 sm:min-h-0"
          >
            {filter.label}
            <X aria-hidden className="h-3 w-3 transition-transform group-hover:rotate-90" />
            <span className="sr-only">{t.catalog.removeFilter}</span>
          </button>
        ))}
        {activeFilters.length > 1 && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              update({ q: null, category: null, level: null, age: null, duration: null });
            }}
            className="min-h-9 cursor-pointer text-xs font-bold text-muted underline-offset-4 hover:text-ink hover:underline sm:min-h-0"
          >
            {t.catalog.resetAll}
          </button>
        )}
        <div role="group" aria-label={t.catalog.viewLabel} className="ml-auto flex rounded-xl bg-surface-sunken p-1">
          {[
            { value: "grid", label: t.catalog.viewCards, icon: LayoutGrid },
            { value: "table", label: t.catalog.viewTable, icon: Table2 },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => update({ view: value === "grid" ? null : value })}
              className={cn(
                "flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 sm:min-h-0",
                view === value ? "bg-surface text-ink shadow-glow-sm" : "text-muted hover:text-ink"
              )}
            >
              <Icon aria-hidden className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("mt-5 transition-opacity duration-300", isPending && "pointer-events-none opacity-50")} aria-busy={isPending}>
        {children}
      </div>
    </div>
  );
}
