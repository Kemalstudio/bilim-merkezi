"use client";

import { Fragment, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaveBar } from "@/components/admin/save-bar";
import { useSettingSaver } from "@/components/admin/use-setting-saver";
import { ReportPreview } from "@/components/admin/site/report-preview";
import { resetSiteSettingAction, saveSiteSettingAction } from "@/actions/admin-site";
import { locales } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  DEFAULT_HERO_REPORT,
  LANGUAGE_META,
  heroReportSchema,
  type HeroReportSettings,
} from "@/lib/site-settings-schema";

const MAX_CHECKPOINTS = 8;
const MAX_TOPICS = 4;

type Checkpoint = HeroReportSettings["checkpoints"][number];
type Topic = HeroReportSettings["topics"][number];

const toInt = (raw: string) => {
  const number = Number.parseInt(raw, 10);
  return Number.isNaN(number) ? 0 : number;
};
const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const iconButton =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-rose/10 hover:text-rose disabled:pointer-events-none disabled:opacity-30";

export function HeroReportForm({
  initial,
  labels,
}: {
  initial: HeroReportSettings;
  labels: Dictionary["hero"]["report"];
}) {
  const [report, setReport] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const { pending, run } = useSettingSaver();

  const dirty = JSON.stringify(report) !== JSON.stringify(saved);

  const updateCheckpoint = (index: number, patch: Partial<Checkpoint>) =>
    setReport((current) => ({
      ...current,
      checkpoints: current.checkpoints.map((checkpoint, i) => (i === index ? { ...checkpoint, ...patch } : checkpoint)),
    }));

  const updateTopic = (index: number, patch: Partial<Topic>) =>
    setReport((current) => ({
      ...current,
      topics: current.topics.map((topic, i) => (i === index ? { ...topic, ...patch } : topic)),
    }));

  const addCheckpoint = () =>
    setReport((current) => {
      const last = current.checkpoints[current.checkpoints.length - 1];
      return {
        ...current,
        checkpoints: [...current.checkpoints, { week: Math.min(52, (last?.week ?? 0) + 2), score: last?.score ?? 60 }],
      };
    });

  const addTopic = () =>
    setReport((current) => ({
      ...current,
      topics: [...current.topics, { label: { ru: "", en: "", tm: "" }, from: 20, to: 60 }],
    }));

  function save() {
    const parsed = heroReportSchema.safeParse(report);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте поля карточки");
      return;
    }
    run(() => saveSiteSettingAction("heroReport", parsed.data), "Карточка отчёта сохранена", () => {
      setReport(parsed.data);
      setSaved(parsed.data);
    });
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <section className="rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Пробные экзамены</h2>
                <p className="mt-1 max-w-lg text-sm leading-6 text-muted">
                  Точки графика по неделям. При прокрутке главной недели идут от первой к последней, и балл меняется вместе с
                  линией. Небольшая просадка делает историю честнее.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCheckpoint}
                disabled={report.checkpoints.length >= MAX_CHECKPOINTS}
              >
                <Plus className="h-4 w-4" /> Точка
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-x-3 gap-y-2">
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted">#</span>
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted">Неделя</span>
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted">Балл из 100</span>
              <span />
              {report.checkpoints.map((checkpoint, index) => (
                <Fragment key={index}>
                  <span className="font-display text-sm font-bold tabular-nums text-ink-soft">{index + 1}</span>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={checkpoint.week}
                    onChange={(event) => updateCheckpoint(index, { week: toInt(event.target.value) })}
                    aria-label={`Неделя, точка ${index + 1}`}
                    className="h-10"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={checkpoint.score}
                    onChange={(event) => updateCheckpoint(index, { score: toInt(event.target.value) })}
                    aria-label={`Балл, точка ${index + 1}`}
                    className="h-10"
                  />
                  <button
                    type="button"
                    className={iconButton}
                    disabled={report.checkpoints.length <= 2}
                    onClick={() =>
                      setReport((current) => ({
                        ...current,
                        checkpoints: current.checkpoints.filter((_, i) => i !== index),
                      }))
                    }
                    aria-label={`Удалить точку ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Fragment>
              ))}
            </div>
          </section>

          <section className="rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Темы</h2>
                <p className="mt-1 max-w-lg text-sm leading-6 text-muted">
                  Полоски под графиком: сколько темы было освоено в первую неделю и сколько сейчас. Название нужно на всех
                  трёх языках.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addTopic} disabled={report.topics.length >= MAX_TOPICS}>
                <Plus className="h-4 w-4" /> Тема
              </Button>
            </div>

            {report.topics.length === 0 ? (
              <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">
                Тем нет — в карточке будет только график.
              </p>
            ) : (
              <ol className="mt-5 space-y-3">
                {report.topics.map((topic, index) => (
                  <li key={index} className="rounded-[1.1rem] border border-border bg-surface-sunken/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-ink">Тема {index + 1}</span>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() =>
                          setReport((current) => ({ ...current, topics: current.topics.filter((_, i) => i !== index) }))
                        }
                        aria-label={`Удалить тему ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      {locales.map((locale) => (
                        <label key={locale} className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold text-muted">
                            {LANGUAGE_META[locale].flag} {LANGUAGE_META[locale].label}
                          </span>
                          <Input
                            value={topic.label[locale]}
                            onChange={(event) => updateTopic(index, { label: { ...topic.label, [locale]: event.target.value } })}
                            className="h-10"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_7rem_minmax(0,1fr)] sm:items-end">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-muted">Было, %</span>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={topic.from}
                          onChange={(event) => updateTopic(index, { from: toInt(event.target.value) })}
                          className="h-10"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-muted">Стало, %</span>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={topic.to}
                          onChange={(event) => updateTopic(index, { to: toInt(event.target.value) })}
                          className="h-10"
                        />
                      </label>
                      <div aria-hidden className="relative mb-4 h-2 overflow-hidden rounded-full bg-border">
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-brand-start"
                          style={{ width: `${clampPercent(topic.to)}%` }}
                        />
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-accent"
                          style={{ width: `${clampPercent(Math.min(topic.from, topic.to))}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="h-fit xl:sticky xl:top-6">
          <p className="eyebrow mb-3">Предпросмотр</p>
          <ReportPreview report={report} labels={labels} />
        </aside>
      </div>

      <SaveBar
        dirty={dirty}
        pending={pending}
        onSave={save}
        onDiscard={() => setReport(saved)}
        onReset={() =>
          run(() => resetSiteSettingAction("heroReport"), "Карточка возвращена к исходной", () => {
            setReport(DEFAULT_HERO_REPORT);
            setSaved(DEFAULT_HERO_REPORT);
          })
        }
      />
    </>
  );
}
