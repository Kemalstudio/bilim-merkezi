"use server";

import { requireUser } from "@/lib/rbac";
import { getChildDetail } from "@/lib/children-data";
import { rateLimit } from "@/lib/rate-limit";
import { getAssistantSettings } from "@/lib/site-settings";
import { getI18n } from "@/lib/i18n/server";
import { resolveProvider } from "@/lib/ai/providers";
import { allowedNumbers, sanitizeAnswer, unsupportedNumbers } from "@/lib/ai/guard";
import { composeProgress, computeProgress, progressPrompt } from "@/lib/ai/insight";

export type InsightResult = { text: string; mode: "model" | "local" } | { error: string };

const TIMEOUT_MS = 45_000;

/** A short explanation of one child's exam results, for their parent only. */
export async function explainProgressAction(childId: string): Promise<InsightResult> {
  const user = await requireUser();
  const { t, f, locale } = await getI18n();

  if (!(await getAssistantSettings()).enabled) return { error: t.assistant.disabled };
  if (!(await rateLimit(`insight:${user.id}`, 10, 10 * 60_000)).success) return { error: t.errors.tooManyRequests };

  // Scoped by parent: another family's child id simply is not found.
  const child = await getChildDetail(childId, user.id);
  if (!child) return { error: t.errors.childNotFound };

  const facts = computeProgress(child.exams);
  if (!facts) return { error: t.account.insight.needExams };

  const local = composeProgress(facts, child.firstName, t, f);
  const { provider } = await resolveProvider();
  if (!provider) return { text: local, mode: "local" };

  const { system, data } = progressPrompt(locale, child.firstName, child.exams, facts, f);
  try {
    let text = "";
    for await (const delta of provider.stream({
      system,
      messages: [{ role: "user", content: data }],
      maxTokens: 300,
      temperature: 0.3,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })) {
      text += delta;
    }
    const clean = sanitizeAnswer(text, 900);
    // Dates are written out in the prompt, so their day and year numbers are allowed too.
    const unsupported = unsupportedNumbers(clean, allowedNumbers(data));
    if (!clean || unsupported.length > 0) {
      console.info(JSON.stringify({ event: "insight", mode: "model-rejected", unsupported: unsupported.length }));
      return { text: local, mode: "local" };
    }
    return { text: clean, mode: "model" };
  } catch (error) {
    console.error("[insight] model failed, using the computed summary", error);
    return { text: local, mode: "local" };
  }
}
