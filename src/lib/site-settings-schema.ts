import { z } from "zod";
import { locales, type Locale } from "@/lib/i18n/config";

/*
 * What the "Сайт" pages of /bilim/admin can change, as plain data: the catalogs the forms
 * render, the zod schemas the server actions validate with, and the defaults the site uses
 * while nothing is saved. No database access here, so client components can import it.
 */

export type SettingKey = "sections" | "animations" | "contacts" | "languages" | "heroReport";

/** Text edits are stored per language, one row each. */
export const textsKey = (locale: Locale) => `texts.${locale}` as const;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/* ── Home page sections ─────────────────────────────────────────────────────────────── */

type SectionMeta = { id: string; label: string; description: string; pinned: boolean };

export const HOME_SECTIONS = [
  { id: "hero", label: "Первый экран", description: "Заголовок, кнопки и карточка отчёта", pinned: true },
  { id: "stats", label: "Цифры доверия", description: "Ученики, программы, направления и оценка", pinned: true },
  { id: "journey", label: "Путь ученика", description: "Три этапа с 8 по 11 класс", pinned: false },
  { id: "learningExperience", label: "Почему мы", description: "Как устроено обучение", pinned: false },
  { id: "howItWorks", label: "Как проходит подготовка", description: "Шаги подготовки по порядку", pinned: false },
  { id: "results", label: "Результаты учеников", description: "Реальные баллы и их распределение", pinned: false },
  { id: "dashboard", label: "Кабинет родителя", description: "Превью личного кабинета", pinned: false },
  { id: "gridZoom", label: "Все предметы", description: "Сетка предметов экзамена", pinned: false },
  { id: "directions", label: "Направления обучения", description: "Группы направлений и подбор курса", pinned: false },
  { id: "lesson", label: "Как устроена подготовка", description: "Темы собираются в систему", pinned: false },
  { id: "popularCourses", label: "Популярные курсы", description: "Курсы из каталога", pinned: false },
  { id: "instructors", label: "Преподаватели", description: "Команда преподавателей", pinned: false },
  { id: "summit", label: "Вершина", description: "Сцена с горой при прокрутке", pinned: false },
  { id: "testimonials", label: "Отзывы родителей", description: "Отзывы из базы", pinned: false },
  { id: "marquee", label: "Бегущая строка", description: "Предметы и ключевые слова", pinned: false },
  { id: "faq", label: "Частые вопросы", description: "Вопросы и ответы", pinned: false },
  { id: "cta", label: "Запись", description: "Финальный призыв записаться", pinned: false },
] as const satisfies readonly SectionMeta[];

export type HomeSectionId = (typeof HOME_SECTIONS)[number]["id"];

const SECTION_IDS = HOME_SECTIONS.map((section) => section.id) as [HomeSectionId, ...HomeSectionId[]];

/** Hero and stats share the pinned opening scene, so they always come first, in this order. */
export const PINNED_SECTION_IDS: readonly HomeSectionId[] = HOME_SECTIONS.filter((section) => section.pinned).map(
  (section) => section.id
);

export const sectionsSchema = z
  .array(z.object({ id: z.enum(SECTION_IDS), visible: z.boolean() }))
  .max(SECTION_IDS.length, "Слишком много секций");

export type SectionSetting = z.infer<typeof sectionsSchema>[number];

/** Every known section exactly once: pinned ones first, then the saved order, then any new ones. */
export function normalizeSections(saved: readonly SectionSetting[]): SectionSetting[] {
  const visible = new Map(saved.map((section) => [section.id, section.visible]));
  const order = [...new Set<HomeSectionId>([...PINNED_SECTION_IDS, ...saved.map((section) => section.id), ...SECTION_IDS])];
  return order.map((id) => ({ id, visible: visible.get(id) ?? true }));
}

export const DEFAULT_SECTIONS: SectionSetting[] = normalizeSections([]);

/* ── Animations ──────────────────────────────────────────────────────────────────────── */

export const ANIMATION_OPTIONS = [
  {
    key: "intro",
    label: "Заставка при первом входе",
    description: "Логотип и счётчик 000 → 100 перед первым показом сайта. Показывается один раз за сессию.",
    where: "Все страницы сайта",
  },
  {
    key: "pageTransition",
    label: "Шторка между страницами",
    description: "Тёмная шторка с логотипом при переходе по ссылкам внутри сайта.",
    where: "Переходы между страницами",
  },
  {
    key: "heroScene",
    label: "Сцена первого экрана",
    description:
      "При прокрутке первый экран закрепляется: карточка отчёта едет в центр, недели проходят, выходит крупный заголовок. Без неё — лёгкий параллакс.",
    where: "Главная, первый экран",
  },
  {
    key: "hero3d",
    label: "3D-созвездие",
    description: "Объёмная WebGL-сцена за карточкой отчёта. Без неё показывается плоская SVG-версия.",
    where: "Главная, первый экран",
  },
  {
    key: "scrollReveals",
    label: "Появление при прокрутке",
    description: "Блоки плавно поднимаются, заголовки выезжают по строкам, цифры прокручиваются как счётчик.",
    where: "Все секции",
  },
  {
    key: "cursor",
    label: "Курсор-спутник",
    description: "Кольцо, которое следует за курсором, и лёгкое притяжение кнопок.",
    where: "Компьютеры с мышью",
  },
] as const;

export type AnimationKey = (typeof ANIMATION_OPTIONS)[number]["key"];

export const animationsSchema = z.object({
  intro: z.boolean(),
  pageTransition: z.boolean(),
  heroScene: z.boolean(),
  hero3d: z.boolean(),
  scrollReveals: z.boolean(),
  cursor: z.boolean(),
}) satisfies z.ZodType<Record<AnimationKey, boolean>>;

export type AnimationSettings = z.infer<typeof animationsSchema>;

export const DEFAULT_ANIMATIONS: AnimationSettings = {
  intro: true,
  pageTransition: true,
  heroScene: true,
  hero3d: true,
  scrollReveals: true,
  cursor: true,
};

/* ── Contacts ────────────────────────────────────────────────────────────────────────── */

export const contactsSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(5, "Укажите номер телефона")
    .max(40, "Слишком длинный номер")
    .regex(/^[+\d\s()-]+$/, "В номере могут быть только цифры, пробелы, +, скобки и дефис"),
  email: z.string().trim().email("Введите корректный email"),
  address: z.string().trim().min(2, "Укажите адрес").max(160, "Слишком длинный адрес"),
  hours: z.string().trim().max(120, "Слишком длинный текст"),
});

export type ContactSettings = z.infer<typeof contactsSchema>;

export const DEFAULT_CONTACTS: ContactSettings = {
  phone: "+993 12 345 678",
  email: "hello@bilim.tm",
  address: "Ашхабад, Туркменистан",
  hours: "Пн–Пт, 9:00–18:00",
};

/** A `tel:` link that dials the number however it is formatted for display. */
export const phoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/* ── Languages ───────────────────────────────────────────────────────────────────────── */

export const LANGUAGE_META: Record<Locale, { flag: string; label: string }> = {
  ru: { flag: "🇷🇺", label: "Русский" },
  en: { flag: "🇬🇧", label: "English" },
  tm: { flag: "🇹🇲", label: "Türkmençe" },
};

const localeSchema = z.enum(locales);

export const languagesSchema = z
  .object({
    enabled: z.array(localeSchema).min(1, "Оставьте включённым хотя бы один язык"),
    defaultLocale: localeSchema,
  })
  .refine((value) => value.enabled.includes(value.defaultLocale), {
    message: "Основной язык должен быть включён",
    path: ["defaultLocale"],
  })
  .transform((value) => ({ ...value, enabled: locales.filter((locale) => value.enabled.includes(locale)) }));

export type LanguageSettings = z.infer<typeof languagesSchema>;

export const DEFAULT_LANGUAGES: LanguageSettings = { enabled: [...locales], defaultLocale: "ru" };

/* ── Hero report card ────────────────────────────────────────────────────────────────── */

const topicLabel = z.string().trim().min(1, "Заполните название темы на всех языках").max(48, "Название темы слишком длинное");

export const heroReportSchema = z.object({
  checkpoints: z
    .array(
      z.object({
        week: z.number().int("Неделя — целое число").min(1, "Неделя начинается с 1").max(52, "Не больше 52 недель"),
        score: z.number().int("Балл — целое число").min(0, "Балл от 0 до 100").max(100, "Балл от 0 до 100"),
      })
    )
    .min(2, "Нужно минимум две точки на графике")
    .max(8, "Не больше восьми точек")
    .refine(
      (list) => list.every((point, index) => index === 0 || point.week > list[index - 1].week),
      "Недели должны идти по возрастанию"
    ),
  topics: z
    .array(
      z.object({
        label: z.object({ ru: topicLabel, en: topicLabel, tm: topicLabel }),
        from: z.number().int().min(0, "Проценты от 0 до 100").max(100, "Проценты от 0 до 100"),
        to: z.number().int().min(0, "Проценты от 0 до 100").max(100, "Проценты от 0 до 100"),
      })
    )
    .max(4, "Не больше четырёх тем — больше не поместится в карточку"),
});

export type HeroReportSettings = z.infer<typeof heroReportSchema>;

export const DEFAULT_HERO_REPORT: HeroReportSettings = {
  checkpoints: [
    { week: 1, score: 58 },
    { week: 4, score: 55 },
    { week: 8, score: 66 },
    { week: 12, score: 74 },
  ],
  topics: [
    { label: { ru: "Дроби и проценты", en: "Fractions & percentages", tm: "Droblar we göterimler" }, from: 35, to: 90 },
    { label: { ru: "Уравнения", en: "Equations", tm: "Deňlemeler" }, from: 20, to: 70 },
    { label: { ru: "Геометрия", en: "Geometry", tm: "Geometriýa" }, from: 10, to: 45 },
  ],
};

/* ── Texts ───────────────────────────────────────────────────────────────────────────── */

/** Names and hints for the dictionary groups, in the order the texts page lists them. */
export const TEXT_GROUP_META: Record<string, { label: string; description: string }> = {
  nav: { label: "Меню и шапка", description: "Пункты меню, кнопки входа и записи" },
  hero: { label: "Первый экран", description: "Заголовок, подзаголовок, кнопки и подписи карточки отчёта" },
  stats: { label: "Цифры доверия", description: "Подписи под цифрами" },
  quickActions: { label: "Быстрые действия", description: "Запись онлайн и проверка баллов" },
  journey: { label: "Путь ученика", description: "Этапы с 8 по 11 класс" },
  learningExperience: { label: "Почему мы", description: "Как устроено обучение" },
  howItWorks: { label: "Как проходит подготовка", description: "Шаги подготовки" },
  results: { label: "Результаты учеников", description: "Заголовки и подписи блока с баллами" },
  dashboard: { label: "Кабинет родителя", description: "Тексты превью личного кабинета" },
  gridZoom: { label: "Все предметы", description: "Названия предметов и заголовок" },
  directions: { label: "Направления", description: "Группы направлений и мини-тест подбора курса" },
  lesson: { label: "Как устроена подготовка", description: "Этапы складывания знаний" },
  popularCourses: { label: "Популярные курсы", description: "Заголовок блока" },
  instructors: { label: "Преподаватели", description: "Заголовок блока" },
  summit: { label: "Вершина", description: "Тексты сцены с горой" },
  testimonials: { label: "Отзывы", description: "Заголовок блока отзывов" },
  marquee: { label: "Бегущая строка", description: "Слова в строке" },
  faq: { label: "Частые вопросы", description: "Вопросы и ответы" },
  finalCta: { label: "Финальный призыв", description: "Блок записи внизу главной" },
  story: { label: "Навигация по разделам", description: "Подписи точек сбоку страницы" },
  footer: { label: "Подвал сайта", description: "Описание, колонки ссылок, копирайт" },
};

export const MAX_TEXT_LENGTH = 4000;
const MAX_LIST_LENGTH = 60;

/**
 * Whether `value` has the same shape as the shipped `template`: same keys, strings where
 * strings are, and list items shaped like the template's first item. Lists may grow or
 * shrink, which is what lets the admin add and remove FAQ items, stages and so on.
 */
export function conformsTo(template: unknown, value: unknown): boolean {
  if (template === null) return value === null || (typeof value === "string" && value.length <= MAX_TEXT_LENGTH);
  if (typeof template === "string") return typeof value === "string" && value.length <= MAX_TEXT_LENGTH;
  if (typeof template === "number" || typeof template === "boolean") return typeof value === typeof template;
  if (Array.isArray(template)) {
    return (
      Array.isArray(value) &&
      value.length <= MAX_LIST_LENGTH &&
      (template.length === 0 ? value.length === 0 : value.every((item) => conformsTo(template[0], item)))
    );
  }
  if (isPlainObject(template)) {
    if (!isPlainObject(value)) return false;
    const keys = Object.keys(template);
    return keys.every((key) => conformsTo(template[key], value[key])) && Object.keys(value).every((key) => keys.includes(key));
  }
  return false;
}

/** Lays `override` over `base`: objects merge key by key, anything else is replaced. */
export function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined) return base;
  if (isPlainObject(base)) {
    if (!isPlainObject(override)) return base;
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
      if (key in base) result[key] = deepMerge(base[key], value);
    }
    return result as T;
  }
  return override as T;
}

/** How many editable strings a text group holds. */
export function countTextFields(value: unknown): number {
  if (typeof value === "string" || value === null) return 1;
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countTextFields(item), 0);
  if (isPlainObject(value)) return Object.values(value).reduce<number>((sum, item) => sum + countTextFields(item), 0);
  return 0;
}
