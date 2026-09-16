"use client";

import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, pluralizeRu } from "@/lib/utils";

export type CategoryOption = { slug: string; name: string; count: number };

const LEVELS = [
  { value: "", label: "Любой уровень" },
  { value: "BEGINNER", label: "Начальный" },
  { value: "INTERMEDIATE", label: "Средний" },
  { value: "ADVANCED", label: "Продвинутый" },
];

export const CATALOG_SORTS = [
  { value: "popular", label: "Популярные" },
  { value: "rating", label: "С высоким рейтингом" },
  { value: "start", label: "Скоро старт" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
  { value: "new", label: "Новые" },
] as const;

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
  /** Courses matching the search and level in every category, for the "Все" chip. */
  allCount: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const level = searchParams.get("level") ?? "";
  const sort = searchParams.get("sort") ?? "popular";
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
  const levelName = LEVELS.find((l) => l.value === level && l.value)?.label;
  const activeFilters = [
    q && { key: "q", label: `«${q}»` },
    categoryName && { key: "category", label: categoryName },
    levelName && { key: "level", label: levelName },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div>
      <div className="sticky top-[5.25rem] z-30 rounded-[1.3rem] border border-border/80 bg-surface/90 p-3 shadow-glow-sm backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") update({ q: query.trim() || null });
              }}
              placeholder="Курс, тема урока или преподаватель"
              aria-label="Поиск курсов"
              className="pl-11 pr-10 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  update({ q: null });
                }}
                aria-label="Очистить поиск"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div role="group" aria-label="Уровень" className="flex rounded-xl bg-surface-sunken p-1">
              {LEVELS.map((option) => {
                const selected = level === option.value;
                return (
                  <button
                    key={option.value || "all"}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => update({ level: option.value || null })}
                    className={cn(
                      "flex-1 cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200 active:scale-95",
                      selected ? "bg-surface text-ink shadow-glow-sm" : "text-muted hover:text-ink"
                    )}
                  >
                    {option.value ? option.label : "Все"}
                  </button>
                );
              })}
            </div>

            <Select value={sort} onValueChange={(value) => update({ sort: value === "popular" ? null : value })}>
              <SelectTrigger className="sm:w-52" aria-label="Сортировка">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATALOG_SORTS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Категории">
          {[{ slug: "", name: "Все направления", count: allCount }, ...categories].map((option) => {
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
                  "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
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
          Найдено {resultCount} {pluralizeRu(resultCount, ["курс", "курса", "курсов"])}
        </p>
        {activeFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => {
              if (filter.key === "q") setQuery("");
              update({ [filter.key]: null });
            }}
            className="group flex cursor-pointer items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand-ink transition-colors hover:bg-brand/20"
          >
            {filter.label}
            <X aria-hidden className="h-3 w-3 transition-transform group-hover:rotate-90" />
            <span className="sr-only">— убрать фильтр</span>
          </button>
        ))}
        {activeFilters.length > 1 && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              update({ q: null, category: null, level: null });
            }}
            className="cursor-pointer text-xs font-bold text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Сбросить всё
          </button>
        )}
      </div>

      <div className={cn("mt-5 transition-opacity duration-300", isPending && "pointer-events-none opacity-50")} aria-busy={isPending}>
        {children}
      </div>
    </div>
  );
}
