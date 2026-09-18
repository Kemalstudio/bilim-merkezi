/**
 * Text processing for local search: tokenising, light stemming for Russian, Turkmen and
 * English, and cross-language concepts so "matematika", "математике" and "maths" meet.
 * Deterministic and dependency-free — it runs in-process in a fraction of a millisecond.
 */

const STOPWORDS = new Set(
  (
    "и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее мне было вот от меня еще нет о из ему " +
    "теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они " +
    "тут где есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого " +
    "какой совсем ним здесь этом один почти мой тем чтобы нее сейчас были куда зачем всех никогда можно при наконец два об другой хоть " +
    "после над больше тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть " +
    "том нельзя такой им более всегда конечно всю между хочу хотим хочет нужно нужен нужна подскажите пожалуйста есть ли какие какой " +
    "the a an and or of to in on for with is are was be my our your i we you it that this what which do does can have has please " +
    "we'd there any some about how me want need looking " +
    "we bu şu we-de hem üçin bilen näme haýsy barmy bar ýok men biz siz meniň biziň barada nähili " +
    "лет год года годика класс класса классе сын сына дочь дочери ребенок ребенка ребенку дети детей курс курсы курсов " +
    "years year old grade son daughter child children kid kids course courses " +
    "ýaş ýaşynda ýaşly synp synpda oglum gyzym çaga çagam kurs kurslar kursy"
  ).split(/\s+/)
);

// Longest suffixes first; a stem keeps at least three letters.
const RU_SUFFIXES = [
  "иями", "ями", "ами", "ией", "иям", "ием", "иях", "ого", "его", "ому", "ему", "ыми", "ими", "ешь", "ишь",
  "ать", "ять", "ить", "еть", "ова", "ева", "ией", "ость", "ости",
  "ее", "ие", "ые", "ое", "ей", "ий", "ый", "ой", "ем", "им", "ым", "ом", "ах", "ях", "ую", "юю", "ая", "яя", "ов", "ев", "ам", "ям",
  "а", "я", "о", "е", "и", "ы", "у", "ю", "ь", "й",
].sort((a, b) => b.length - a.length);

const TK_SUFFIXES = [
  "larynyň", "leriniň", "larynda", "lerinde", "lary", "leri", "lar", "ler", "nyň", "niň", "ynda", "inde",
  "dan", "den", "ymy", "imi", "yny", "ini", "yň", "iň", "da", "de", "ny", "ni", "sy", "si", "ym", "im", "a", "e", "y", "i",
].sort((a, b) => b.length - a.length);

function stripSuffix(word: string, suffixes: string[], minStem: number) {
  for (const suffix of suffixes) {
    if (word.length - suffix.length >= minStem && word.endsWith(suffix)) return word.slice(0, -suffix.length);
  }
  return word;
}

export function stem(word: string) {
  if (/[а-я]/.test(word)) return stripSuffix(word, RU_SUFFIXES, 3);
  if (/[äçňöşüýž]/.test(word)) return stripSuffix(word, TK_SUFFIXES, 3);
  // Latin without Turkmen letters: Turkmen plural endings first, then English ones.
  const turkmen = stripSuffix(word, ["lary", "leri", "lar", "ler"], 3);
  return turkmen !== word ? turkmen : stemEnglish(word);
}

/** A few Porter-style rules: enough for "courses"/"course" and "drawing"/"draw" to meet. */
function stemEnglish(word: string) {
  let result = word;
  if (result.length > 4 && result.endsWith("ies")) result = `${result.slice(0, -3)}y`;
  else if (/(ss|sh|ch|x|z)es$/.test(result)) result = result.slice(0, -2);
  else if (result.length > 3 && result.endsWith("s") && !result.endsWith("ss")) result = result.slice(0, -1);
  if (result.length > 5 && result.endsWith("ing")) result = result.slice(0, -3);
  else if (result.length > 4 && result.endsWith("ed")) result = result.slice(0, -2);
  return result.length > 3 ? result.replace(/e$/, "") : result;
}

export function normalize(text: string) {
  return text.toLowerCase().replace(/ё/g, "е").normalize("NFC");
}

/** Words of the text, lower-cased; numbers are kept for age and grade detection. */
export function words(text: string) {
  return normalize(text).match(/[\p{L}\p{N}]+/gu) ?? [];
}

/**
 * Concepts shared across the three languages. A word that starts with any listed prefix adds
 * the concept token, on both the query and the document side.
 */
const CONCEPTS: Record<string, string[]> = {
  math: ["математ", "алгебр", "геометр", "арифмет", "дроб", "уравнен", "math", "algebra", "geometr", "arithmet", "matemat", "algebr", "geometri"],
  mental: ["ментальн", "абакус", "устн", "mental", "abacus", "akyl"],
  english: ["англ", "english", "iňlis", "inlis", "ingliz"],
  korean: ["корей", "korean", "koreý", "korey"],
  languages: ["язык", "иностран", "language", "dil", "daşary"],
  programming: ["программ", "код", "кодинг", "разработ", "program", "coding", "code", "developer", "programmir"],
  web: ["веб", "сайт", "html", "css", "javascript", "web", "website", "saýt"],
  python: ["python", "питон", "pyton"],
  ai: ["искусствен", "нейросет", "ии", "ai", "neural", "machine", "emeli", "neýron"],
  design: ["дизайн", "figma", "интерфейс", "design", "dizaýn", "dizayn"],
  art: ["рисова", "живопис", "художеств", "акварел", "рисун", "draw", "paint", "art", "surat", "çekme"],
  chess: ["шахмат", "chess", "şahmat", "sahmat"],
  science: ["наук", "естествен", "science", "ylym", "tebigy"],
  chemistry: ["хими", "chemi", "himiýa", "himiya"],
  biology: ["биолог", "biolog"],
  physics: ["физик", "physic", "fizika"],
  speaking: ["выступлен", "публичн", "оратор", "коммуникац", "speak", "çykyş", "gepleş"],
  exam: ["экзамен", "егэ", "огэ", "олимпиад", "exam", "olympiad", "synag", "olimpiada"],
  beginner: ["начина", "нуля", "новичк", "beginner", "scratch", "başlangyç", "noldan"],
  logic: ["логик", "мышлен", "logic", "thinking", "logika", "pikirlen"],
  business: ["бизнес", "предприним", "финанс", "business", "entrepreneur", "financ", "telekeçi", "biznes"],
};

const CONCEPT_ENTRIES = Object.entries(CONCEPTS);

export function conceptsOf(wordList: string[]) {
  const found = new Set<string>();
  for (const word of wordList) {
    for (const [concept, prefixes] of CONCEPT_ENTRIES) {
      if (prefixes.some((prefix) => word.startsWith(prefix))) found.add(`#${concept}`);
    }
  }
  return [...found];
}

/** Search tokens: stems of meaningful words plus concept tokens. */
export function tokens(text: string) {
  const list = words(text).filter((word) => !STOPWORDS.has(word) && !/^\d+$/.test(word));
  return [...list.filter((word) => word.length > 1).map(stem), ...conceptsOf(list)];
}
