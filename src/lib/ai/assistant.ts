import "server-only";

import type { Locale } from "@/lib/i18n/config";
import type { Ui } from "@/lib/i18n/ui";
import type { Formatter } from "@/lib/i18n/format";
import { getKnowledge } from "@/lib/ai/knowledge";
import { resolveProvider, type ChatMessage } from "@/lib/ai/providers";
import { allowedNumbers, sanitizeAnswer, unsupportedNumbers } from "@/lib/ai/guard";
import { buildContext, cardsFor, composeLocalAnswer, planAnswer, systemPrompt, type CourseCard } from "@/lib/ai/answer";

export type AssistantEvent =
  | { type: "start"; mode: "model" | "local" }
  | { type: "delta"; text: string }
  /** The streamed text failed a check and is replaced by an answer built from the data. */
  | { type: "replace"; text: string }
  | { type: "courses"; courses: CourseCard[] }
  | { type: "done" }
  | { type: "error"; message: string };

const FIRST_TOKEN_TIMEOUT_MS = 25_000;
const TOTAL_TIMEOUT_MS = 60_000;

/**
 * Answers one parent message. Always yields a usable answer: from the model when one is
 * available and its text passes the checks, otherwise from local search.
 */
export async function* answer(options: {
  locale: Locale;
  t: Ui;
  f: Formatter;
  messages: ChatMessage[];
  signal: AbortSignal;
}): AsyncGenerator<AssistantEvent> {
  const { locale, t, f, messages, signal } = options;
  const started = Date.now();
  const knowledge = await getKnowledge(locale);
  const plan = planAnswer(knowledge, messages);
  const local = composeLocalAnswer(plan, knowledge, t, f);
  const { provider } = await resolveProvider();

  const log = (mode: string, extra: Record<string, unknown> = {}) =>
    // Content is never logged — only what is needed to watch latency and failure rates.
    console.info(
      JSON.stringify({ event: "assistant", mode, locale, provider: provider?.name ?? null, ms: Date.now() - started, courses: plan.courses.length, ...extra })
    );

  if (!provider) {
    yield { type: "start", mode: "local" };
    yield { type: "delta", text: local };
    yield { type: "courses", courses: cardsFor(plan, f) };
    yield { type: "done" };
    log("local");
    return;
  }

  const context = buildContext(plan, knowledge, t, f);
  const conversation = messages.slice(-8);
  // The context rides along with the latest question, so earlier turns stay short.
  const prompt: ChatMessage[] = [
    ...conversation.slice(0, -1),
    { role: "user", content: `${context}\n\nParent's message:\n${conversation.at(-1)?.content ?? ""}` },
  ];

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort);
  const totalTimer = setTimeout(abort, TOTAL_TIMEOUT_MS);
  let firstTokenTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(abort, FIRST_TOKEN_TIMEOUT_MS);

  let text = "";
  try {
    yield { type: "start", mode: "model" };
    for await (const delta of provider.stream({
      system: systemPrompt(locale),
      messages: prompt,
      maxTokens: 450,
      temperature: 0.3,
      signal: controller.signal,
    })) {
      if (firstTokenTimer) {
        clearTimeout(firstTokenTimer);
        firstTokenTimer = undefined;
      }
      text += delta;
      yield { type: "delta", text: delta };
    }

    const clean = sanitizeAnswer(text);
    const allowed = allowedNumbers(context, ...messages.map((message) => message.content));
    const unsupported = unsupportedNumbers(clean, allowed);
    if (!clean || unsupported.length > 0) {
      yield { type: "replace", text: local };
      yield { type: "courses", courses: cardsFor(plan, f) };
      log("model-rejected", { unsupported: unsupported.length, empty: !clean });
    } else {
      if (clean !== text) yield { type: "replace", text: clean };
      yield { type: "courses", courses: cardsFor(plan, f, clean) };
      log("model");
    }
    yield { type: "done" };
  } catch (error) {
    if (signal.aborted) return;
    console.error("[assistant] model failed, answering from local search", error);
    // Whatever was streamed is replaced: a half answer is worse than a complete local one.
    yield { type: "replace", text: local };
    yield { type: "courses", courses: cardsFor(plan, f) };
    yield { type: "done" };
    log("model-failed");
  } finally {
    clearTimeout(totalTimer);
    if (firstTokenTimer) clearTimeout(firstTokenTimer);
    signal.removeEventListener("abort", abort);
  }
}
