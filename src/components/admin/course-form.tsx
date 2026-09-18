"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/image-upload";
import type { CourseActionState } from "@/actions/admin-courses";
import { cn, pluralizeRu } from "@/lib/utils";
import { DEFAULT_COURSE_FORMAT, formatMinutes, totalHoursLabel, weeksLabel } from "@/lib/course-schedule";
import { LANGUAGE_LADDER, TRACK_NAMES } from "@/lib/course-levels";

type LessonDraft = { key: string; title: string; durationMin: number; topicsText: string };
type WeekDraft = { key: string; title: string; goal: string; lessons: LessonDraft[] };

export type CourseFormValues = {
  title: string;
  summary: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  lessonsPerWeek: number;
  weeklyHoursMin: number;
  weeklyHoursMax: number;
  startDate?: string | null;
  price: string;
  discountPrice?: string | null;
  categoryId: string;
  instructorName: string;
  instructorTitle?: string | null;
  instructorBio?: string | null;
  coverImage?: string | null;
  published: boolean;
  featured: boolean;
  outcomes: string[];
  skills: string[];
  requirements: string[];
  audience: string[];
  ageMin?: number | null;
  ageMax?: number | null;
  groupSize?: number | null;
  teachingLanguage?: string | null;
  certificate: boolean;
  track?: string | null;
  levelCode?: string | null;
  modules: { title: string; goal: string | null; lessons: { title: string; durationMin: number; topics: string[] }[] }[];
};

const LIST_FIELDS = [
  { name: "outcomes", label: "Чему научится ребёнок", placeholder: "Решать уравнения с дробями" },
  { name: "skills", label: "Навыки (теги)", placeholder: "Логика" },
  { name: "requirements", label: "Что нужно знать заранее", placeholder: "Знать таблицу умножения" },
  { name: "audience", label: "Для кого курс", placeholder: "Ученикам 5–7 классов" },
] as const;

function makeKey() {
  return Math.random().toString(36).slice(2);
}

// A typical week: two 90-minute lessons and a longer practical one.
const DEFAULT_DURATIONS = [90, 90, 120];

function emptyLesson(index: number): LessonDraft {
  return { key: makeKey(), title: "", durationMin: DEFAULT_DURATIONS[index] ?? 90, topicsText: "" };
}

function emptyWeek(lessonCount: number): WeekDraft {
  return { key: makeKey(), title: "", goal: "", lessons: Array.from({ length: lessonCount }, (_, i) => emptyLesson(i)) };
}

export function CourseForm({
  categories,
  action,
  initialData,
  submitLabel,
}: {
  categories: { id: string; name: string }[];
  action: (prevState: CourseActionState, formData: FormData) => Promise<CourseActionState>;
  initialData?: CourseFormValues;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(initialData?.lessonsPerWeek ?? DEFAULT_COURSE_FORMAT.lessonsPerWeek);
  const [weeklyHoursMin, setWeeklyHoursMin] = useState(initialData?.weeklyHoursMin ?? DEFAULT_COURSE_FORMAT.weeklyHoursMin);
  const [weeklyHoursMax, setWeeklyHoursMax] = useState(initialData?.weeklyHoursMax ?? DEFAULT_COURSE_FORMAT.weeklyHoursMax);
  const [weeks, setWeeks] = useState<WeekDraft[]>(() =>
    initialData?.modules.length
      ? initialData.modules.map((week) => ({
          key: makeKey(),
          title: week.title,
          goal: week.goal ?? "",
          lessons: week.lessons.map((lesson) => ({
            key: makeKey(),
            title: lesson.title,
            durationMin: lesson.durationMin,
            topicsText: lesson.topics.join("\n"),
          })),
        }))
      : [emptyWeek(initialData?.lessonsPerWeek ?? DEFAULT_COURSE_FORMAT.lessonsPerWeek)]
  );
  const [published, setPublished] = useState(initialData?.published ?? true);
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [certificate, setCertificate] = useState(initialData?.certificate ?? true);
  const [track, setTrack] = useState(initialData?.track ?? "");

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  const format = { lessonsPerWeek, weeklyHoursMin, weeklyHoursMax };
  const totalLessons = weeks.reduce((sum, week) => sum + week.lessons.length, 0);
  const mismatchedWeeks = weeks.filter((week) => week.lessons.length !== lessonsPerWeek).length;

  function updateWeek(weekKey: string, patch: Partial<WeekDraft>) {
    setWeeks((prev) => prev.map((week) => (week.key === weekKey ? { ...week, ...patch } : week)));
  }
  function updateLesson(weekKey: string, lessonKey: string, patch: Partial<LessonDraft>) {
    setWeeks((prev) =>
      prev.map((week) =>
        week.key === weekKey
          ? { ...week, lessons: week.lessons.map((lesson) => (lesson.key === lessonKey ? { ...lesson, ...patch } : lesson)) }
          : week
      )
    );
  }
  function moveWeek(index: number, delta: number) {
    setWeeks((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function addLesson(weekKey: string) {
    setWeeks((prev) =>
      prev.map((week) => (week.key === weekKey ? { ...week, lessons: [...week.lessons, emptyLesson(week.lessons.length)] } : week))
    );
  }
  function removeLesson(weekKey: string, lessonKey: string) {
    setWeeks((prev) =>
      prev.map((week) => (week.key === weekKey ? { ...week, lessons: week.lessons.filter((lesson) => lesson.key !== lessonKey) } : week))
    );
  }
  /** Brings a week to the course format: adds empty lessons or drops the last ones. */
  function fitWeek(weekKey: string) {
    setWeeks((prev) =>
      prev.map((week) => {
        if (week.key !== weekKey) return week;
        const lessons = week.lessons.slice(0, lessonsPerWeek);
        while (lessons.length < lessonsPerWeek) lessons.push(emptyLesson(lessons.length));
        return { ...week, lessons };
      })
    );
  }

  const modulesJson = JSON.stringify(
    weeks.map((week) => ({
      title: week.title,
      goal: week.goal.trim() || undefined,
      lessons: week.lessons.map((lesson) => ({
        title: lesson.title,
        durationMin: lesson.durationMin,
        topics: lesson.topicsText
          .split("\n")
          .map((topic) => topic.trim())
          .filter(Boolean),
      })),
    }))
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="modulesJson" value={modulesJson} />
      <input type="hidden" name="published" value={published ? "on" : ""} />
      <input type="hidden" name="featured" value={featured ? "on" : ""} />
      <input type="hidden" name="certificate" value={certificate ? "on" : ""} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Название курса</Label>
            <Input id="title" name="title" defaultValue={initialData?.title} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="summary">Краткое описание</Label>
            <Textarea id="summary" name="summary" rows={2} defaultValue={initialData?.summary} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Полное описание</Label>
            <Textarea id="description" name="description" rows={5} defaultValue={initialData?.description} required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoryId">Категория</Label>
              <Select name="categoryId" defaultValue={initialData?.categoryId}>
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="level">Уровень</Label>
              <Select name="level" defaultValue={initialData?.level ?? "BEGINNER"}>
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Начальный</SelectItem>
                  <SelectItem value="INTERMEDIATE">Средний</SelectItem>
                  <SelectItem value="ADVANCED">Продвинутый</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Дата старта</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={initialData?.startDate ? initialData.startDate.slice(0, 10) : ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Цена, $</Label>
              <Input id="price" name="price" type="number" min={0} step="0.01" defaultValue={initialData?.price} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discountPrice">Со скидкой</Label>
              <Input
                id="discountPrice"
                name="discountPrice"
                type="number"
                min={0}
                step="0.01"
                defaultValue={initialData?.discountPrice ?? ""}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Обложка курса</Label>
            <ImageUpload name="coverImage" defaultValue={initialData?.coverImage} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instructorName">Имя преподавателя</Label>
            <Input id="instructorName" name="instructorName" defaultValue={initialData?.instructorName} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instructorTitle">Должность преподавателя</Label>
            <Input id="instructorTitle" name="instructorTitle" defaultValue={initialData?.instructorTitle ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instructorBio">О преподавателе</Label>
            <Textarea id="instructorBio" name="instructorBio" rows={3} defaultValue={initialData?.instructorBio ?? ""} />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink-soft">
              <Switch checked={published} onCheckedChange={setPublished} /> Опубликован
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink-soft">
              <Switch checked={featured} onCheckedChange={setFeatured} /> Рекомендуемый
            </label>
          </div>
        </div>
      </div>

      <section className="rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Что увидят родители на странице курса</h2>
        <p className="mt-1 text-sm text-muted">Каждый пункт — с новой строки. Пустые списки на странице не показываются.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {LIST_FIELDS.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Textarea
                id={field.name}
                name={field.name}
                rows={4}
                placeholder={field.placeholder}
                defaultValue={initialData?.[field.name].join("\n") ?? ""}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ageMin">Возраст: от</Label>
            <Input id="ageMin" name="ageMin" type="number" min={3} max={18} defaultValue={initialData?.ageMin ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ageMax">Возраст: до</Label>
            <Input id="ageMax" name="ageMax" type="number" min={3} max={18} defaultValue={initialData?.ageMax ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="groupSize">Учеников в группе, до</Label>
            <Input id="groupSize" name="groupSize" type="number" min={1} max={50} defaultValue={initialData?.groupSize ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="teachingLanguage">Язык обучения</Label>
            <Input
              id="teachingLanguage"
              name="teachingLanguage"
              placeholder="Туркменский, русский"
              defaultValue={initialData?.teachingLanguage ?? ""}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="track">Линейка курсов</Label>
            <Input
              id="track"
              name="track"
              list="course-tracks"
              placeholder="english"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
            />
            <datalist id="course-tracks">
              {Object.entries(TRACK_NAMES).map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="levelCode">Ступень в линейке</Label>
            <Select name="levelCode" defaultValue={initialData?.levelCode ?? undefined} disabled={!track.trim()}>
              <SelectTrigger id="levelCode">
                <SelectValue placeholder="Не выбрана" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_LADDER.map((step) => (
                  <SelectItem key={step.code} value={step.code}>
                    {step.code} · {step.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 self-end pb-2 text-sm font-semibold text-ink-soft lg:col-span-2">
            <Switch checked={certificate} onCheckedChange={setCertificate} /> Выдаём сертификат по итогам курса
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          Курсы одной линейки (например, english A1 → A2 → B1) показываются на странице как путь по уровням.
        </p>
      </section>

      <section className="rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Формат обучения</h2>
        <p className="mt-1 text-sm text-muted">
          В каждой неделе программы — одинаковое число уроков. Часы в неделю включают уроки, практику и домашние задания.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lessonsPerWeek">Уроков в неделю</Label>
            <Input
              id="lessonsPerWeek"
              name="lessonsPerWeek"
              type="number"
              min={1}
              max={7}
              value={lessonsPerWeek}
              onChange={(e) => setLessonsPerWeek(Number(e.target.value) || 1)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weeklyHoursMin">Часов в неделю: от</Label>
            <Input
              id="weeklyHoursMin"
              name="weeklyHoursMin"
              type="number"
              min={1}
              max={60}
              value={weeklyHoursMin}
              onChange={(e) => setWeeklyHoursMin(Number(e.target.value) || 1)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weeklyHoursMax">Часов в неделю: до</Label>
            <Input
              id="weeklyHoursMax"
              name="weeklyHoursMax"
              type="number"
              min={1}
              max={60}
              value={weeklyHoursMax}
              onChange={(e) => setWeeklyHoursMax(Number(e.target.value) || 1)}
              required
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-surface-sunken px-3 py-1.5 text-ink-soft">{weeksLabel(weeks.length)}</span>
          <span className="rounded-full bg-surface-sunken px-3 py-1.5 text-ink-soft">
            {totalLessons} {pluralizeRu(totalLessons, ["урок", "урока", "уроков"])} всего
          </span>
          <span className="rounded-full bg-surface-sunken px-3 py-1.5 text-ink-soft">{totalHoursLabel(weeks.length, format)} учёбы</span>
          {mismatchedWeeks > 0 && (
            <span className="rounded-full bg-rose/10 px-3 py-1.5 text-rose">
              {mismatchedWeeks} {pluralizeRu(mismatchedWeeks, ["неделя не совпадает", "недели не совпадают", "недель не совпадают"])} с форматом
            </span>
          )}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Программа по неделям</h2>
            <p className="mt-1 text-sm text-muted">Темы урока пишите по одной на строку — они появятся на странице курса.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setWeeks((prev) => [...prev, emptyWeek(lessonsPerWeek)])}>
            <Plus className="h-4 w-4" /> Добавить неделю
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {weeks.map((week, weekIndex) => {
            const classMinutes = week.lessons.reduce((sum, lesson) => sum + lesson.durationMin, 0);
            const fits = week.lessons.length === lessonsPerWeek;
            return (
              <div key={week.key} className="rounded-[1.4rem] border border-border bg-surface-sunken/50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-panel px-3 py-1 text-xs font-bold text-white">Неделя {weekIndex + 1}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      fits ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose"
                    )}
                  >
                    {week.lessons.length} из {lessonsPerWeek} {pluralizeRu(lessonsPerWeek, ["урока", "уроков", "уроков"])}
                  </span>
                  <span className="text-xs text-muted">{formatMinutes(classMinutes)} с преподавателем</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" aria-label="Выше" disabled={weekIndex === 0} onClick={() => moveWeek(weekIndex, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Ниже"
                      disabled={weekIndex === weeks.length - 1}
                      onClick={() => moveWeek(weekIndex, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Удалить неделю"
                      onClick={() => setWeeks((prev) => prev.filter((w) => w.key !== week.key))}
                    >
                      <Trash2 className="h-4 w-4 text-rose" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    aria-label={`Тема недели ${weekIndex + 1}`}
                    placeholder="Тема недели"
                    value={week.title}
                    onChange={(e) => updateWeek(week.key, { title: e.target.value })}
                  />
                  <Input
                    aria-label={`Итог недели ${weekIndex + 1}`}
                    placeholder="Итог недели: что ученик сможет"
                    value={week.goal}
                    onChange={(e) => updateWeek(week.key, { goal: e.target.value })}
                  />
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  {week.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.key} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Урок {lessonIndex + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Удалить урок ${lessonIndex + 1}`}
                          onClick={() => removeLesson(week.key, lesson.key)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted" />
                        </Button>
                      </div>
                      <Input
                        aria-label="Название урока"
                        placeholder="Название урока"
                        value={lesson.title}
                        onChange={(e) => updateLesson(week.key, lesson.key, { title: e.target.value })}
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          aria-label="Длительность, минут"
                          type="number"
                          min={1}
                          value={lesson.durationMin}
                          onChange={(e) => updateLesson(week.key, lesson.key, { durationMin: Number(e.target.value) || 0 })}
                          className="w-24"
                        />
                        <span className="text-xs text-muted">мин</span>
                      </div>
                      <Textarea
                        aria-label="Темы урока"
                        placeholder={"Темы урока — по одной на строку"}
                        rows={3}
                        value={lesson.topicsText}
                        onChange={(e) => updateLesson(week.key, lesson.key, { topicsText: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => addLesson(week.key)}>
                    <Plus className="h-3.5 w-3.5" /> Добавить урок
                  </Button>
                  {!fits && (
                    <Button type="button" variant="subtle" size="sm" onClick={() => fitWeek(week.key)}>
                      Привести к {lessonsPerWeek} {pluralizeRu(lessonsPerWeek, ["уроку", "урокам", "урокам"])}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Button type="submit" size="lg" className="w-fit" disabled={isPending}>
        {isPending ? "Сохранение..." : submitLabel}
      </Button>
    </form>
  );
}
