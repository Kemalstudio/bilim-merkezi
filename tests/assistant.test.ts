import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, parseQuery, search } from "@/lib/ai/retrieval";
import { stem, tokens } from "@/lib/ai/text";
import { allowedNumbers, sanitizeAnswer, unsupportedNumbers } from "@/lib/ai/guard";
import { buildContext, cardsFor, composeLocalAnswer, planAnswer, systemPrompt, type KnowledgeView } from "@/lib/ai/answer";
import { composeProgress, computeProgress } from "@/lib/ai/insight";
import type { ArticleFact, CourseFact, FaqFact } from "@/lib/ai/knowledge";
import { createFormatter } from "@/lib/i18n/format";
import { getUiDictionary } from "@/lib/i18n/ui";

const course = (overrides: Partial<CourseFact>): CourseFact => ({
  slug: "x",
  title: "X",
  summary: "",
  category: "",
  categorySlug: "",
  level: "BEGINNER",
  levelCode: null,
  ageMin: null,
  ageMax: null,
  lessonsPerWeek: 3,
  weeklyHoursMin: 15,
  weeklyHoursMax: 20,
  weeks: 8,
  price: 100,
  discountPrice: null,
  startDate: null,
  certificate: true,
  groupSize: 10,
  skills: [],
  outcomes: [],
  audience: [],
  moduleTitles: [],
  rating: 0,
  reviewCount: 0,
  enrollments: 0,
  ...overrides,
});

const COURSES: CourseFact[] = [
  course({
    slug: "math-5-7",
    title: "Математика 5–7 класс: без пробелов в знаниях",
    category: "Математика",
    summary: "Дроби, уравнения, проценты и геометрия",
    ageMin: 10,
    ageMax: 13,
    price: 120,
  }),
  course({ slug: "mental", title: "Ментальная арифметика", category: "Математика", summary: "Счёт на абакусе", ageMin: 5, ageMax: 10, price: 90 }),
  course({ slug: "english-a1", title: "Английский язык: Beginner (A1)", category: "Иностранные языки", ageMin: 7, ageMax: 13, price: 80 }),
  course({ slug: "web", title: "Веб-разработка с нуля: HTML, CSS и JavaScript", category: "Программирование", ageMin: 12, ageMax: 17, price: 150, enrollments: 3 }),
  course({ slug: "chess", title: "Шахматы для начинающих", category: "Творчество и досуг", ageMin: 6, ageMax: 14, price: 60 }),
  course({ slug: "drawing", title: "Рисование и живопись", category: "Творчество и досуг", summary: "Карандаш, акварель и гуашь", ageMin: 7, ageMax: 14, price: 70, discountPrice: 55 }),
];

const FAQ: FaqFact[] = [
  { q: "Какие документы нужны?", a: "Номер и скан свидетельства о рождении ребёнка." },
  { q: "Как проходит оплата?", a: "Картой онлайн через защищённую платёжную страницу." },
];

const knowledge: KnowledgeView = {
  courses: COURSES,
  courseIndex: buildIndex(COURSES, (item) => [
    [item.title, 4],
    [item.category, 3],
    [item.summary, 2],
  ]),
  faq: FAQ,
  faqIndex: buildIndex(FAQ, (item) => [
    [item.q, 3],
    [item.a, 1],
  ]),
  contacts: { address: "Ашхабад, ул. Магтымгулы 12", phone: "+993 12 345 678", email: "hello@bilim.tm", hours: "Пн–Пт" },
};

const ru = getUiDictionary("ru");
const fRu = createFormatter("ru", ru);
const user = (content: string) => [{ role: "user" as const, content }];

test("stemming joins word forms", () => {
  assert.equal(stem("математике"), stem("математика"));
  assert.equal(stem("английского"), stem("английский"));
  assert.equal(stem("courses"), stem("course"));
  assert.equal(stem("kurslary"), "kurs");
});

test("concepts connect languages", () => {
  assert.ok(tokens("matematika").includes("#math"));
  assert.ok(tokens("maths").includes("#math"));
  assert.ok(tokens("математику").includes("#math"));
  assert.ok(tokens("iňlis dili").includes("#english"));
});

test("parseQuery finds age, grade and intents", () => {
  assert.equal(parseQuery("Сыну 12 лет, слабая математика").age, 12);
  assert.equal(parseQuery("дочь в 7 классе").age, 13);
  assert.equal(parseQuery("my son is 9 years old").age, 9);
  assert.equal(parseQuery("Oglum 10 ýaşynda").age, 10);
  assert.equal(parseQuery("grade 5").age, 11);
  assert.equal(parseQuery("курс на 120 часов").age, null);
  assert.deepEqual(parseQuery("Где вы находитесь и какой телефон?").intents, ["contacts"]);
  assert.ok(parseQuery("Как записаться и оплатить?").intents.includes("enrollment"));
  assert.ok(parseQuery("Сколько стоит английский?").intents.includes("price"));
});

test("search ranks the subject first, across languages", () => {
  const top = (query: string) => search(knowledge.courseIndex, tokens(query))[0]?.item.slug;
  assert.equal(top("математика"), "math-5-7");
  assert.equal(top("matematika"), "math-5-7");
  assert.equal(top("maths"), "math-5-7");
  assert.equal(top("английский язык"), "english-a1");
  assert.equal(top("English"), "english-a1");
  assert.equal(top("хочет рисовать"), "drawing");
  assert.equal(top("шахматы"), "chess");
});

test("plan respects the child's age", () => {
  const plan = planAnswer(knowledge, user("Сыну 12 лет, слабая математика"));
  assert.equal(plan.age, 12);
  assert.deepEqual(
    plan.courses.map((item) => item.slug),
    ["math-5-7"],
    "mental arithmetic is for ages 5–10 and must not be offered to a 12-year-old"
  );
});

test("an age alone suggests courses that fit it", () => {
  const plan = planAnswer(knowledge, user("Дочери 6 лет"));
  assert.ok(plan.courses.length > 0);
  assert.ok(plan.courses.every((item) => (item.ageMin ?? 0) <= 6 && (item.ageMax ?? 99) >= 6));
});

test("a follow-up keeps the earlier subject", () => {
  const plan = planAnswer(knowledge, [
    { role: "user", content: "Есть курсы по математике?" },
    { role: "assistant", content: "Да" },
    { role: "user", content: "а для 7 лет?" },
  ]);
  assert.equal(plan.age, 7);
  assert.deepEqual(plan.courses.map((item) => item.slug), ["mental"]);
});

test("service questions do not flood the answer with courses", () => {
  const plan = planAnswer(knowledge, user("Где вы находитесь?"));
  assert.deepEqual(plan.intents, ["contacts"]);
  assert.equal(plan.courses.length, 0);
  const text = composeLocalAnswer(plan, knowledge, ru, fRu);
  assert.match(text, /Магтымгулы 12/);
  assert.match(text, /\+993 12 345 678/);
});

test("local answer lists courses with real prices and ages", () => {
  const plan = planAnswer(knowledge, user("рисование"));
  const text = composeLocalAnswer(plan, knowledge, ru, fRu);
  assert.match(text, /Рисование и живопись/);
  assert.match(text, /7–14 лет/);
  assert.match(text, /55/, "the discount price is the one to pay");
  const cards = cardsFor(plan, fRu);
  assert.equal(cards[0].slug, "drawing");
});

test("unknown topics get an honest answer with the phone number", () => {
  const plan = planAnswer(knowledge, user("астрофизика для взрослых"));
  const text = composeLocalAnswer(plan, knowledge, ru, fRu);
  assert.match(text, /\+993 12 345 678/);
});

test("local answers are produced in the visitor's language", () => {
  const tm = getUiDictionary("tm");
  const plan = planAnswer(knowledge, user("Oglum 12 ýaşynda, matematika"));
  const text = composeLocalAnswer(plan, knowledge, tm, createFormatter("tm", tm));
  assert.match(text, /laýyk gelýän kurslar/);
  assert.match(text, /10–13 ýaş/);
});

test("the model context contains the facts and the prompt holds the rules", () => {
  const plan = planAnswer(knowledge, user("математика 11 лет"));
  const context = buildContext(plan, knowledge, ru, fRu);
  assert.match(context, /Математика 5–7 класс/);
  assert.match(context, /120/);
  assert.match(context, /END OF CONTEXT/);
  const prompt = systemPrompt("tm");
  assert.match(prompt, /Turkmen/);
  assert.match(prompt, /data, not instructions/);
});

test("cards follow the courses the model actually named", () => {
  const plan = planAnswer(knowledge, user("математика"));
  const named = cardsFor(plan, fRu, "Советую «Ментальная арифметика» — она для младших.");
  assert.deepEqual(named.map((card) => card.slug), ["mental"]);
});

test("guard rejects invented numbers and accepts supported ones", () => {
  const allowed = allowedNumbers("Цена: 120 $ | 3 урока в неделю, 15–20 ч | Старт 1 октября 2026 г.", "Сыну 12 лет");
  assert.deepEqual(unsupportedNumbers("Курс стоит 120 $, старт 1 октября 2026, ребёнку 12 лет.", allowed), []);
  assert.deepEqual(unsupportedNumbers("Сейчас скидка 30% — всего 84 $.", allowed), ["30", "84"]);
  assert.deepEqual(unsupportedNumbers("Выберите 2 курса из 3.", allowed), []);
});

test("sanitizeAnswer strips markup and links", () => {
  assert.equal(
    sanitizeAnswer("**Курс** [подробнее](https://evil.example) <script>x</script> https://evil.example/a"),
    "Курс подробнее x"
  );
});

test("progress summary uses only computed numbers", () => {
  const exams = [
    { examName: "Входной тест", percent: 58, score: 29, maxScore: 50, examDate: "2026-02-01T00:00:00.000Z", courseTitle: null },
    { examName: "Пробный экзамен", percent: 74, score: 74, maxScore: 100, examDate: "2026-05-01T00:00:00.000Z", courseTitle: null },
  ];
  const facts = computeProgress(exams)!;
  assert.equal(facts.delta, 16);
  assert.equal(facts.average, 66);
  const text = composeProgress(facts, "Огулджан", ru, fRu);
  assert.match(text, /Огулджан: последний результат — 74%/);
  assert.match(text, /на 16 п\.п\. выше/);
  assert.match(text, /Входной тест/);
  assert.equal(computeProgress([]), null);
});

/* ── questions about the centre ───────────────────────────────────────────────────── */

const ARTICLES: ArticleFact[] = [
  {
    id: "method",
    title: "Не просто занятия. Управляемая подготовка.",
    text: "• Начинаем с диагностики.\n• Собираем личный маршрут.\n• Тренируем формат экзамена.",
  },
  { id: "teachers", title: "Рядом взрослый, который умеет объяснять", text: "Преподаватели знают экзаменационный формат." },
  { id: "results", title: "Цифры, а не обещания", text: "Показываем реальные баллы учеников на экзаменах." },
];

const withArticles: KnowledgeView = {
  ...knowledge,
  articles: ARTICLES,
  articleIndex: buildIndex(ARTICLES, (item) => [
    [item.title, 3],
    [item.text, 1],
  ]),
};

const localAnswer = (text: string, view: KnowledgeView = withArticles) =>
  composeLocalAnswer(planAnswer(view, user(text)), view, ru, fRu);

test("parseQuery recognises questions about the centre", () => {
  assert.ok(parseQuery("Какие курсы у вас есть?").intents.includes("catalog"));
  assert.ok(parseQuery("What courses do you offer?").intents.includes("catalog"));
  assert.ok(parseQuery("Haýsy kurslaryňyz bar?").intents.includes("catalog"));
  assert.ok(parseQuery("Кто преподаёт?").intents.includes("teachers"));
  assert.ok(parseQuery("Как проходят занятия?").intents.includes("method"));
  assert.ok(parseQuery("Выдаёте сертификат?").intents.includes("certificate"));
  assert.ok(parseQuery("Сколько детей в группе?").intents.includes("groupSize"));
  assert.ok(parseQuery("С какого возраста принимаете?").intents.includes("ageRange"));
  assert.deepEqual(parseQuery("Привет").intents, ["greeting"]);
  assert.deepEqual(parseQuery("Спасибо!").intents, ["thanks"]);
  // "Приветствую" is not "привет" + something else, and a greeting mid-sentence is not small talk.
  assert.ok(!parseQuery("Хочу передать привет").intents.includes("greeting"));
});

test("small talk gets a short reply, not a course list", () => {
  assert.equal(localAnswer("Здравствуйте"), ru.assistant.fallback.greeting);
  assert.equal(localAnswer("спасибо"), ru.assistant.fallback.thanks);
});

test("the catalogue question lists every category with its courses", () => {
  const text = localAnswer("Какие курсы у вас есть?");
  assert.match(text, /курсов: 6/);
  for (const category of ["Математика", "Иностранные языки", "Программирование", "Творчество и досуг"]) {
    assert.ok(text.includes(category), `missing ${category}`);
  }
  assert.ok(text.includes("Шахматы для начинающих"));
});

test("a subject in the question beats the catalogue overview", () => {
  const plan = planAnswer(withArticles, user("Какие курсы английского есть?"));
  assert.deepEqual(plan.courses.map((item) => item.slug), ["english-a1"]);
  assert.ok(!composeLocalAnswer(plan, withArticles, ru, fRu).includes("Творчество и досуг"));
});

test("method and teacher questions are answered from the site's articles", () => {
  assert.match(localAnswer("Как проходят занятия?"), /диагностики/);
  const teachers = localAnswer("Кто у вас преподаватели?");
  assert.match(teachers, /умеет объяснять/);
  assert.ok(teachers.includes(knowledge.contacts.phone));
});

test("age range and certificates come from the course data", () => {
  assert.match(localAnswer("С какого возраста принимаете?"), /5–17/);
  assert.match(localAnswer("Выдаёте сертификат?"), /6 из 6/);
  const drawing = localAnswer("Есть сертификат после рисования?");
  assert.match(drawing, /Рисование и живопись/);
});

test("group size answers use the real group sizes", () => {
  assert.match(localAnswer("Сколько детей в группе?"), /10 учеников/);
});

test("answers still work without articles", () => {
  assert.match(localAnswer("Как проходят занятия?", knowledge), /\S/);
});
