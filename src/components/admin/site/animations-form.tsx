"use client";

import { useState } from "react";
import { Clapperboard, Film, Layers, MousePointer2, Orbit, Rows3, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SaveBar } from "@/components/admin/save-bar";
import { useSettingSaver } from "@/components/admin/use-setting-saver";
import { resetSiteSettingAction, saveSiteSettingAction } from "@/actions/admin-site";
import {
  ANIMATION_OPTIONS,
  DEFAULT_ANIMATIONS,
  type AnimationKey,
  type AnimationSettings,
} from "@/lib/site-settings-schema";
import { cn } from "@/lib/utils";

const ICONS: Record<AnimationKey, LucideIcon> = {
  intro: Clapperboard,
  pageTransition: Layers,
  heroScene: Film,
  hero3d: Orbit,
  scrollReveals: Rows3,
  cursor: MousePointer2,
};

export function AnimationsForm({ initial }: { initial: AnimationSettings }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const { pending, run } = useSettingSaver();

  const dirty = ANIMATION_OPTIONS.some((option) => value[option.key] !== saved[option.key]);
  const enabled = ANIMATION_OPTIONS.filter((option) => value[option.key]).length;

  const setAll = (on: boolean) =>
    setValue(Object.fromEntries(ANIMATION_OPTIONS.map((option) => [option.key, on])) as AnimationSettings);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-[1.4rem] border border-border bg-surface p-4 shadow-glow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-ink-soft">
          <span className="font-display text-2xl font-bold tracking-[-0.04em] text-ink">
            {enabled} из {ANIMATION_OPTIONS.length}
          </span>{" "}
          анимаций включено
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAll(true)}>
            Включить все
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAll(false)}>
            Выключить все
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {ANIMATION_OPTIONS.map((option) => {
          const Icon = ICONS[option.key];
          const on = value[option.key];
          return (
            <label
              key={option.key}
              className={cn(
                "flex cursor-pointer gap-4 rounded-[1.4rem] border bg-surface p-5 shadow-glow-sm transition-all hover:-translate-y-0.5 hover:shadow-glow-md",
                on ? "border-brand/30" : "border-border"
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                  on ? "bg-panel text-accent" : "bg-surface-sunken text-muted"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display font-bold text-ink">{option.label}</span>
                  <Switch
                    checked={on}
                    onCheckedChange={(checked) => setValue((current) => ({ ...current, [option.key]: checked }))}
                    aria-label={option.label}
                  />
                </span>
                <span className="mt-1.5 block text-sm leading-6 text-muted">{option.description}</span>
                <span className="mt-3 inline-flex rounded-full bg-surface-sunken px-2.5 py-1 text-[0.68rem] font-bold text-ink-soft">
                  {option.where}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-muted">
        Посетители, у которых в системе включено «уменьшение движения», не видят анимаций при любых настройках.
      </p>

      <SaveBar
        dirty={dirty}
        pending={pending}
        onSave={() => run(() => saveSiteSettingAction("animations", value), "Анимации сохранены", () => setSaved(value))}
        onDiscard={() => setValue(saved)}
        onReset={() =>
          run(() => resetSiteSettingAction("animations"), "Все анимации снова включены", () => {
            setValue(DEFAULT_ANIMATIONS);
            setSaved(DEFAULT_ANIMATIONS);
          })
        }
      />
    </>
  );
}
