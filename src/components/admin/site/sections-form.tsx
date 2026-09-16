"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SaveBar } from "@/components/admin/save-bar";
import { useSettingSaver } from "@/components/admin/use-setting-saver";
import { resetSiteSettingAction, saveSiteSettingAction } from "@/actions/admin-site";
import { DEFAULT_SECTIONS, HOME_SECTIONS, type HomeSectionId, type SectionSetting } from "@/lib/site-settings-schema";
import { cn } from "@/lib/utils";

const META = new Map<HomeSectionId, (typeof HOME_SECTIONS)[number]>(HOME_SECTIONS.map((section) => [section.id, section]));
const isPinned = (id: HomeSectionId) => META.get(id)?.pinned ?? false;

export function SectionsForm({ initial }: { initial: SectionSetting[] }) {
  const [saved, setSaved] = useState(initial);
  const [sections, setSections] = useState(initial);
  const { pending, run } = useSettingSaver();

  const dirty = JSON.stringify(sections) !== JSON.stringify(saved);
  const shown = sections.filter((section) => section.visible).length;

  function move(index: number, delta: -1 | 1) {
    setSections((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length || isPinned(list[index].id) || isPinned(list[target].id)) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function setVisible(id: HomeSectionId, visible: boolean) {
    setSections((list) => list.map((section) => (section.id === id ? { ...section, visible } : section)));
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Всего секций", value: sections.length },
          { label: "Показаны", value: shown },
          { label: "Скрыты", value: sections.length - shown },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[1.2rem] border border-border bg-surface px-5 py-4 shadow-glow-sm">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.09em] text-muted">{stat.label}</p>
            <p className="mt-1 font-display text-3xl font-bold tracking-[-0.05em] text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <ol className="mt-6 space-y-2">
        {sections.map((section, index) => {
          const info = META.get(section.id);
          if (!info) return null;
          const pinned = info.pinned;
          const canMoveUp = !pinned && index > 0 && !isPinned(sections[index - 1].id);
          const canMoveDown = !pinned && index < sections.length - 1;

          return (
            <li
              key={section.id}
              className={cn(
                "flex items-center gap-3 rounded-[1.2rem] border border-border bg-surface p-3 pr-4 shadow-glow-sm transition-opacity sm:gap-4 sm:p-4",
                !section.visible && "bg-surface-sunken/50"
              )}
            >
              <span className="w-7 shrink-0 text-center font-display text-sm font-bold tabular-nums text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className={cn("min-w-0 flex-1", !section.visible && "opacity-55")}>
                <p className="flex flex-wrap items-center gap-2 font-display font-bold text-ink">
                  {info.label}
                  {pinned && (
                    <Badge variant="amber">
                      <Lock className="h-3 w-3" /> всегда сверху
                    </Badge>
                  )}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted">{info.description}</p>
              </div>

              {!pinned && (
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={!canMoveUp}
                    aria-label={`Поднять «${info.label}»`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={!canMoveDown}
                    aria-label={`Опустить «${info.label}»`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              )}

              <label className="flex shrink-0 cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink-soft">
                <span className="hidden w-20 items-center justify-end gap-1.5 sm:flex">
                  {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {section.visible ? "Видна" : "Скрыта"}
                </span>
                <Switch
                  checked={section.visible}
                  onCheckedChange={(checked) => setVisible(section.id, checked)}
                  aria-label={`Показывать «${info.label}»`}
                />
              </label>
            </li>
          );
        })}
      </ol>

      <SaveBar
        dirty={dirty}
        pending={pending}
        onSave={() =>
          run(() => saveSiteSettingAction("sections", sections), "Секции главной сохранены", () => setSaved(sections))
        }
        onDiscard={() => setSections(saved)}
        onReset={() =>
          run(() => resetSiteSettingAction("sections"), "Секции возвращены к исходным", () => {
            setSections(DEFAULT_SECTIONS);
            setSaved(DEFAULT_SECTIONS);
          })
        }
      />
    </>
  );
}
