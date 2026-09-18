import { z } from "zod";
import { getI18n } from "@/lib/i18n/server";
import { getAssistantSettings } from "@/lib/site-settings";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { answer } from "@/lib/ai/assistant";

// Streams model output, so it must never be cached or prerendered.
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .min(1)
    .max(16)
    .refine((messages) => messages.at(-1)?.role === "user", "The last message must come from the user")
    .refine((messages) => (messages.at(-1)?.content.length ?? 0) <= 600, "The question is too long"),
});

const json = (status: number, message: string) =>
  Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * POST /api/assistant — the course advisor. Replies with newline-delimited JSON events
 * (see AssistantEvent): start, text deltas, an optional replacement, course cards, done.
 */
export async function POST(request: Request) {
  const { t, f, locale } = await getI18n();

  // Only the site's own pages may use it — otherwise it is a free model endpoint for anyone.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return json(403, "Forbidden");
  }

  if (!(await getAssistantSettings()).enabled) {
    return json(503, t.assistant.disabled);
  }

  const ip = await getClientIp();
  const [minute, day] = await Promise.all([
    rateLimit(`assistant:${ip}`, 12, 60_000),
    rateLimit(`assistant-day:${ip}`, 150, 24 * 60 * 60_000),
  ]);
  if (!minute.success || !day.success) {
    return json(429, t.assistant.rateLimited);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, t.assistant.error);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return json(400, t.assistant.error);
  }

  const encoder = new TextEncoder();
  const events = answer({ locale, t, f, messages: parsed.data.messages, signal: request.signal });

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      } catch (error) {
        console.error("[assistant] request failed", error);
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", message: t.assistant.error })}\n`));
        controller.close();
      }
    },
    async cancel() {
      await events.return(undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
