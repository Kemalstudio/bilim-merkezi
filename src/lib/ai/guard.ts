/**
 * Output checks for generated text. A small model can "round" a price or invent a start date,
 * and a parent would act on it — so every number in an answer must already appear in the data
 * the model was given (or in the parent's own message). Anything else fails the answer, and the
 * caller falls back to text built directly from the data.
 */

const NUMBER = /\d+(?:[.,]\d+)?/g;

/** Small counts ("2 steps", "3 courses") are harmless and come up naturally. */
const ALWAYS_ALLOWED = new Set(Array.from({ length: 11 }, (_, index) => String(index)));

function numbersIn(text: string) {
  return (text.match(NUMBER) ?? []).flatMap((raw) => {
    const value = raw.replace(",", ".");
    // "120.00" and "120" are the same price.
    const whole = value.replace(/\.0+$/, "");
    return whole === value ? [value] : [value, whole];
  });
}

export function allowedNumbers(...sources: string[]) {
  const allowed = new Set(ALWAYS_ALLOWED);
  for (const source of sources) {
    for (const number of numbersIn(source)) allowed.add(number);
    // Ranges like "15–20" and dates like "2026-09-17" are split by the pattern already.
  }
  return allowed;
}

/** The numbers in `answer` that the sources do not contain. */
export function unsupportedNumbers(answer: string, allowed: Set<string>) {
  return [...new Set(numbersIn(answer))].filter((number) => {
    if (allowed.has(number)) return false;
    // A thousands separator ("1 200") splits a number in two; accept its parts when joined exist.
    return !allowed.has(number.replace(/\.0+$/, ""));
  });
}

/** Keeps generated text plain: no markup, no links, bounded length. */
export function sanitizeAnswer(text: string, maxLength = 1500) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|`{1,3}/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/https?:\/\/\S+/g, "")
    .trim()
    .slice(0, maxLength);
}
