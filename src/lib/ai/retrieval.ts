import { normalize, tokens } from "@/lib/ai/text";

/*
 * Local retrieval for the assistant: BM25 over course and FAQ documents, plus a small query
 * parser for the things parents usually say — the child's age or school grade, and whether
 * they ask about contacts, enrolment, results, prices or the schedule.
 */

export type Intent = "contacts" | "enrollment" | "results" | "price" | "schedule";

export type QueryInfo = {
  age: number | null;
  intents: Intent[];
  tokens: string[];
};

const INTENT_PATTERNS: Record<Intent, RegExp> = {
  contacts: /(адрес|где наход|где вы|телефон|контакт|связат|позвон|address|where are|located|phone|contact|call you|salgy|nirede|telefon|habarlaş|jaň)/u,
  enrollment: /(запис|оплат|документ|регистрац|свидетельств|enrol|enroll|sign up|register|pay|payment|document|ýazyl|ýazdyr|töleg|resminama|şahadatnama)/u,
  results: /(балл|результат|оценк|успеваем|прогресс|score|result|progress|marks|bal|netije|baha)/u,
  price: /(цен|стоим|сколько стоит|дешев|дорог|скидк|price|cost|how much|cheap|discount|baha|näçe|arzan|gymmat)/u,
  schedule: /(расписан|когда|старт|начало|время заняти|schedule|when|start|timetable|tertip|haçan|başlan)/u,
};

const AGE_PATTERN =
  /(\d{1,2})\s*(?:-?(?:ти|ми|ни|х|и))?\s*(?:лет|год|года|годик|years?|yrs?|yo|ýaş|yaş|ýaşynda|ýaşly|ýaşar)/u;
const AGE_PREFIX_PATTERN = /(?:возраст|age|aged|ýaşy)\s*[:\-]?\s*(\d{1,2})/u;
const GRADE_PATTERN =
  /(\d{1,2})\s*(?:-?(?:й|ый|ой|ом|м|th|st|nd|rd|nji|njy|nju|njı))?\s*(?:класс|кл\.|grade|form|synp)|(?:grade|класс|synp)\s*(\d{1,2})/u;

/** A school grade is roughly age minus six, as in Turkmen and Russian schools. */
const GRADE_TO_AGE = 6;

export function parseQuery(text: string): QueryInfo {
  const normalized = normalize(text);
  let age: number | null = null;

  const ageMatch = normalized.match(AGE_PATTERN) ?? normalized.match(AGE_PREFIX_PATTERN);
  if (ageMatch) age = Number(ageMatch[1]);
  if (age == null) {
    const gradeMatch = normalized.match(GRADE_PATTERN);
    const grade = gradeMatch ? Number(gradeMatch[1] ?? gradeMatch[2]) : null;
    if (grade && grade >= 1 && grade <= 12) age = grade + GRADE_TO_AGE;
  }
  if (age != null && (age < 3 || age > 20)) age = null;

  const intents = (Object.keys(INTENT_PATTERNS) as Intent[]).filter((intent) => INTENT_PATTERNS[intent].test(normalized));
  return { age, intents, tokens: tokens(text) };
}

/* ── BM25 ─────────────────────────────────────────────────────────────────────────── */

export type IndexedDoc<T> = { item: T; tokens: string[] };

export type SearchIndex<T> = {
  docs: { item: T; tf: Map<string, number>; length: number }[];
  df: Map<string, number>;
  avgLength: number;
};

/** `fields` pairs text with a weight; a weight of 3 counts the text three times. */
export function buildIndex<T>(items: T[], fields: (item: T) => [text: string, weight: number][]): SearchIndex<T> {
  const df = new Map<string, number>();
  const docs = items.map((item) => {
    const tf = new Map<string, number>();
    let length = 0;
    for (const [text, weight] of fields(item)) {
      for (const token of tokens(text)) {
        tf.set(token, (tf.get(token) ?? 0) + weight);
        length += weight;
      }
    }
    for (const token of tf.keys()) df.set(token, (df.get(token) ?? 0) + 1);
    return { item, tf, length };
  });
  const avgLength = docs.reduce((sum, doc) => sum + doc.length, 0) / Math.max(1, docs.length);
  return { docs, df, avgLength };
}

const K1 = 1.2;
const B = 0.75;

export function search<T>(index: SearchIndex<T>, queryTokens: string[]) {
  const unique = [...new Set(queryTokens)];
  const n = index.docs.length;
  return index.docs
    .map((doc) => {
      let score = 0;
      for (const token of unique) {
        const tf = doc.tf.get(token);
        if (!tf) continue;
        const df = index.df.get(token) ?? 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        // Concept matches ("#math") are what cross languages, so they count a little more.
        const boost = token.startsWith("#") ? 1.5 : 1;
        score += boost * idf * ((tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * doc.length) / index.avgLength)));
      }
      return { item: doc.item, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score);
}
