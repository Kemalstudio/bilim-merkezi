"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SaveBar } from "@/components/admin/save-bar";
import { useSettingSaver } from "@/components/admin/use-setting-saver";
import { resetTextsAction, saveTextsAction } from "@/actions/admin-site";
import { locales, type Locale } from "@/lib/i18n/config";
import { LANGUAGE_META, isPlainObject, type JsonValue } from "@/lib/site-settings-schema";
import { cn } from "@/lib/utils";

/** Readable names for the dictionary keys that come up most; anything else is split from camelCase. */
const KEY_LABELS: Record<string, string> = {
  title: "Заголовок",
  subtitle: "Подзаголовок",
  description: "Описание",
  eyebrow: "Надпись над заголовком",
  badge: "Бейдж",
  text: "Текст",
  label: "Подпись",
  cta: "Текст кнопки",
  ctaPrimary: "Главная кнопка",
  ctaSecondary: "Вторая кнопка",
  titleStart: "Заголовок — начало",
  titleHighlight: "Заголовок — выделенная часть",
  points: "Пункты",
  items: "Элементы",
  question: "Вопрос",
  questions: "Вопросы",
  answer: "Ответ",
  q: "Вопрос",
  a: "Ответ",
  prompt: "Подпись под вопросами",
  options: "Варианты ответа",
  words: "Слова",
  stages: "Этапы",
  scenes: "Сцены",
  steps: "Шаги",
  number: "Номер",
  chips: "Метки",
  groups: "Группы",
  categorySlug: "Категория курсов (slug)",
  stats: "Цифры",
  students: "Ученики",
  courses: "Программы",
  rating: "Оценка",
  report: "Карточка отчёта",
  subject: "Предмет",
  week: "Неделя",
  weekShort: "Неделя, коротко",
  score: "Балл",
  homework: "Домашние задания",
  nextStep: "Следующий шаг",
  columns: "Колонки",
  rights: "Права",
  resultTitle: "Заголовок результата",
};

const labelFor = (key: string) =>
  KEY_LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (char) => char.toUpperCase());

/** An empty value shaped like `template`, for a newly added list item. */
function blankLike(template: JsonValue | undefined): JsonValue {
  if (Array.isArray(template)) return [];
  if (isPlainObject(template)) {
    return Object.fromEntries(Object.entries(template).map(([key, child]) => [key, blankLike(child as JsonValue)]));
  }
  if (typeof template === "number") return 0;
  if (typeof template === "boolean") return false;
  if (template === null) return null;
  return "";
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-30",
        danger && "hover:bg-rose/10 hover:text-rose"
      )}
    >
      {children}
    </button>
  );
}

type FieldProps = {
  label: string;
  template: JsonValue;
  value: JsonValue | undefined;
  onChange: (value: JsonValue) => void;
  /** Objects inside the group get a titled frame; the group itself does not. */
  framed?: boolean;
  /** A list's simple items show no label of their own. */
  bare?: boolean;
};

/** Renders an editor for any dictionary value, following the shape of the shipped texts. */
function Field({ label, template, value, onChange, framed = false, bare = false }: FieldProps) {
  if (Array.isArray(template)) {
    return <ListField label={label} template={template} value={Array.isArray(value) ? value : []} onChange={onChange} />;
  }

  if (isPlainObject(template)) {
    const object = isPlainObject(value) ? value : {};
    const grid = (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(template).map(([key, child]) => {
          const wide = Array.isArray(child) || isPlainObject(child) || (typeof child === "string" && child.length > 60);
          return (
            <div key={key} className={cn("min-w-0", wide && "md:col-span-2")}>
              <Field
                label={labelFor(key)}
                template={child as JsonValue}
                value={object[key] as JsonValue | undefined}
                onChange={(next) => onChange({ ...object, [key]: next } as JsonValue)}
                framed
              />
            </div>
          );
        })}
      </div>
    );
    if (!framed) return grid;
    return (
      <fieldset className="rounded-[1.1rem] border border-border p-4 pt-3">
        <legend className="px-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-muted">{label}</legend>
        {grid}
      </fieldset>
    );
  }

  const text = typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
  const multiline = (typeof template === "string" && template.length > 70) || text.length > 70;
  const handle = (raw: string) =>
    onChange(template === null && raw === "" ? null : typeof template === "number" ? Number(raw) : raw);

  const control = multiline ? (
    <Textarea value={text} rows={3} onChange={(event) => handle(event.target.value)} aria-label={bare ? label : undefined} className="min-h-20" />
  ) : (
    <Input
      value={text}
      type={typeof template === "number" ? "number" : "text"}
      onChange={(event) => handle(event.target.value)}
      aria-label={bare ? label : undefined}
    />
  );

  if (bare) return control;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      {control}
    </label>
  );
}

function ListField({
  label,
  template,
  value,
  onChange,
}: {
  label: string;
  template: JsonValue[];
  value: JsonValue[];
  onChange: (value: JsonValue) => void;
}) {
  const itemTemplate = template[0] ?? "";
  const simple = !Array.isArray(itemTemplate) && !isPlainObject(itemTemplate);

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <fieldset className="rounded-[1.1rem] border border-border bg-surface-sunken/40 p-4 pt-3">
      <legend className="px-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-muted">
        {label} · {value.length}
      </legend>

      <ol className="space-y-2">
        {value.map((item, index) => {
          const controls = (
            <div className="flex shrink-0 items-center gap-0.5">
              <IconButton label="Выше" onClick={() => move(index, -1)} disabled={index === 0}>
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton label="Ниже" onClick={() => move(index, 1)} disabled={index === value.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton label="Удалить" danger onClick={() => onChange(value.filter((_, i) => i !== index))}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          );
          const field = (
            <Field
              label={`${label} ${index + 1}`}
              template={itemTemplate}
              value={item}
              onChange={(next) => onChange(value.map((current, i) => (i === index ? next : current)))}
              bare={simple}
            />
          );

          return simple ? (
            <li key={index} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-right font-display text-xs font-bold tabular-nums text-muted">{index + 1}</span>
              <div className="min-w-0 flex-1">{field}</div>
              {controls}
            </li>
          ) : (
            <li key={index} className="rounded-xl border border-border bg-surface p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-sm font-bold text-ink">№ {index + 1}</span>
                {controls}
              </div>
              {field}
            </li>
          );
        })}
      </ol>

      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => onChange([...value, blankLike(itemTemplate)])}>
        <Plus className="h-4 w-4" /> Добавить
      </Button>
    </fieldset>
  );
}

export function TextGroupEditor({
  group,
  templates,
  initial,
  edited: initiallyEdited,
  initialLocale,
}: {
  group: string;
  /** The shipped texts of this group per language: the shape and the reset target. */
  templates: Record<Locale, JsonValue>;
  /** What the site shows now, edits included. */
  initial: Record<Locale, JsonValue>;
  edited: Record<Locale, boolean>;
  initialLocale: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [edited, setEdited] = useState(initiallyEdited);
  const { pending, run } = useSettingSaver();

  const isDirty = (code: Locale) => !same(values[code], saved[code]);

  function save() {
    const code = locale;
    const value = values[code];
    run(() => saveTextsAction(code, group, value), `Тексты сохранены · ${LANGUAGE_META[code].label}`, () => {
      setSaved((current) => ({ ...current, [code]: value }));
      setEdited((current) => ({ ...current, [code]: !same(value, templates[code]) }));
    });
  }

  function reset() {
    const code = locale;
    run(() => resetTextsAction(code, group), `Исходные тексты возвращены · ${LANGUAGE_META[code].label}`, () => {
      setValues((current) => ({ ...current, [code]: templates[code] }));
      setSaved((current) => ({ ...current, [code]: templates[code] }));
      setEdited((current) => ({ ...current, [code]: false }));
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Язык текстов">
        {locales.map((code) => (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={code === locale}
            onClick={() => setLocale(code)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              code === locale
                ? "border-panel bg-panel text-white"
                : "border-border bg-surface text-ink-soft hover:border-brand/40 hover:text-ink"
            )}
          >
            <span className="text-base leading-none">{LANGUAGE_META[code].flag}</span>
            {LANGUAGE_META[code].label}
            {isDirty(code) && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="не сохранено" />}
            {edited[code] && (
              <Badge variant="amber" className="px-2 py-0.5">
                изменено
              </Badge>
            )}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted">
        Пустое поле останется пустым и на сайте. «Сбросить к исходным» возвращает тексты, с которыми сайт был создан.
      </p>

      <div className="mt-5 rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm sm:p-7">
        <Field
          key={locale}
          label=""
          template={templates[locale]}
          value={values[locale]}
          onChange={(next) => setValues((current) => ({ ...current, [locale]: next }))}
        />
      </div>

      <SaveBar
        dirty={isDirty(locale)}
        pending={pending}
        onSave={save}
        onDiscard={() => setValues((current) => ({ ...current, [locale]: saved[locale] }))}
        onReset={edited[locale] ? reset : undefined}
      />
    </>
  );
}
