import "server-only";

/*
 * Language-model backends, all streamed over plain fetch (no SDKs):
 *
 * - `ollama`  — a local model through Ollama (default http://127.0.0.1:11434). Free, private,
 *               no internet needed; with a GPU a 7B model answers in a second or two.
 * - `openai`  — any OpenAI-compatible server: LM Studio, llama.cpp, vLLM, or a hosted API
 *               (OPENAI_BASE_URL, OPENAI_API_KEY).
 * - `anthropic` — Claude through the Messages API (ANTHROPIC_API_KEY).
 *
 * AI_PROVIDER picks one; `auto` (the default) uses the first that is reachable in that order,
 * and `off` disables generation — the assistant then answers from local search alone.
 */

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type GenerateOptions = {
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  signal: AbortSignal;
};

export type Provider = {
  name: "ollama" | "openai" | "anthropic";
  model: string;
  stream(options: GenerateOptions): AsyncGenerator<string>;
  health(): Promise<{ ok: boolean; detail: string }>;
};

const env = (name: string) => process.env[name]?.trim() || undefined;

/** Splits a streamed body into lines, whatever chunk boundaries the network produced. */
async function* lines(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) yield line;
      }
    }
    if (buffer.trim()) yield buffer.trim();
  } finally {
    reader.releaseLock();
  }
}

async function ensureOk(response: Response, label: string) {
  if (response.ok && response.body) return response.body;
  const text = await response.text().catch(() => "");
  throw new Error(`${label} responded ${response.status}: ${text.slice(0, 200)}`);
}

/* ── Ollama ───────────────────────────────────────────────────────────────────────── */

function ollama(): Provider {
  const base = (env("OLLAMA_URL") ?? "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = env("AI_MODEL") ?? "qwen2.5:7b";
  return {
    name: "ollama",
    model,
    async *stream({ system, messages, maxTokens, temperature, signal }) {
      const response = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          stream: true,
          // Keeps the model in GPU memory between questions, so only the first one waits for loading.
          keep_alive: "30m",
          messages: [{ role: "system", content: system }, ...messages],
          options: { temperature, num_predict: maxTokens, num_ctx: 8192 },
        }),
        signal,
      });
      for await (const line of lines(await ensureOk(response, "Ollama"))) {
        const event = JSON.parse(line) as { message?: { content?: string }; done?: boolean; error?: string };
        if (event.error) throw new Error(`Ollama: ${event.error}`);
        if (event.message?.content) yield event.message.content;
        if (event.done) return;
      }
    },
    async health() {
      try {
        const response = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(1500) });
        if (!response.ok) return { ok: false, detail: `Ollama ответил ${response.status}` };
        const { models } = (await response.json()) as { models?: { name: string }[] };
        const names = (models ?? []).map((item) => item.name);
        const installed = names.some((name) => name === model || name === `${model}:latest` || name.startsWith(`${model}:`));
        return installed
          ? { ok: true, detail: `Ollama на ${base}, модель ${model}` }
          : { ok: false, detail: `Ollama работает, но модели ${model} нет. Выполните: ollama pull ${model}` };
      } catch {
        return { ok: false, detail: `Ollama недоступна на ${base}` };
      }
    },
  };
}

/* ── OpenAI-compatible ────────────────────────────────────────────────────────────── */

function openaiCompatible(): Provider | null {
  const base = env("OPENAI_BASE_URL")?.replace(/\/$/, "");
  if (!base) return null;
  const key = env("OPENAI_API_KEY");
  const model = env("AI_MODEL") ?? "local-model";
  const headers = { "content-type": "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}) };
  return {
    name: "openai",
    model,
    async *stream({ system, messages, maxTokens, temperature, signal }) {
      const response = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          stream: true,
          temperature,
          max_tokens: maxTokens,
          messages: [{ role: "system", content: system }, ...messages],
        }),
        signal,
      });
      for await (const line of lines(await ensureOk(response, "OpenAI-compatible server"))) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        const event = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const text = event.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    },
    async health() {
      try {
        const response = await fetch(`${base}/models`, { headers, signal: AbortSignal.timeout(1500) });
        return response.ok
          ? { ok: true, detail: `OpenAI-совместимый сервер ${base}, модель ${model}` }
          : { ok: false, detail: `${base} ответил ${response.status}` };
      } catch {
        return { ok: false, detail: `${base} недоступен` };
      }
    },
  };
}

/* ── Anthropic ────────────────────────────────────────────────────────────────────── */

function anthropic(): Provider | null {
  const key = env("ANTHROPIC_API_KEY");
  if (!key) return null;
  const model = env("ANTHROPIC_MODEL") ?? "claude-haiku-4-5";
  return {
    name: "anthropic",
    model,
    async *stream({ system, messages, maxTokens, temperature, signal }) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, system, messages, max_tokens: maxTokens, temperature, stream: true }),
        signal,
      });
      for await (const line of lines(await ensureOk(response, "Anthropic"))) {
        if (!line.startsWith("data:")) continue;
        const event = JSON.parse(line.slice(5)) as {
          type: string;
          delta?: { type?: string; text?: string };
          error?: { message?: string };
        };
        if (event.type === "content_block_delta" && event.delta?.text) yield event.delta.text;
        if (event.type === "error") throw new Error(`Anthropic: ${event.error?.message ?? "error"}`);
        if (event.type === "message_stop") return;
      }
    },
    async health() {
      return { ok: true, detail: `Claude (${model}) через API — ключ задан` };
    },
  };
}

/* ── selection ────────────────────────────────────────────────────────────────────── */

export type ProviderChoice = { provider: Provider | null; reason: string };

let autoCache: { at: number; choice: ProviderChoice } | null = null;
const AUTO_TTL_MS = 30_000;

export function providerSetting() {
  return (env("AI_PROVIDER") ?? "auto").toLowerCase();
}

/** The backend to generate with right now, or null for local-search-only answers. */
export async function resolveProvider(): Promise<ProviderChoice> {
  const setting = providerSetting();
  if (setting === "off" || setting === "local") return { provider: null, reason: "Генерация выключена (AI_PROVIDER=off)" };
  if (setting === "ollama") return { provider: ollama(), reason: "AI_PROVIDER=ollama" };
  if (setting === "openai") {
    const provider = openaiCompatible();
    return { provider, reason: provider ? "AI_PROVIDER=openai" : "OPENAI_BASE_URL не задан" };
  }
  if (setting === "anthropic") {
    const provider = anthropic();
    return { provider, reason: provider ? "AI_PROVIDER=anthropic" : "ANTHROPIC_API_KEY не задан" };
  }

  // auto: probe once in a while rather than on every message.
  if (autoCache && Date.now() - autoCache.at < AUTO_TTL_MS) return autoCache.choice;
  let choice: ProviderChoice = { provider: null, reason: "Ни одна модель не доступна — работает локальный поиск" };
  for (const candidate of [ollama(), openaiCompatible(), anthropic()]) {
    if (!candidate) continue;
    const health = await candidate.health();
    if (health.ok) {
      choice = { provider: candidate, reason: health.detail };
      break;
    }
  }
  autoCache = { at: Date.now(), choice };
  return choice;
}

/** Every configured backend with its current status, for the admin page. */
export async function describeProviders() {
  const candidates = [ollama(), openaiCompatible(), anthropic()].filter((item): item is Provider => item !== null);
  return Promise.all(
    candidates.map(async (candidate) => ({ name: candidate.name, model: candidate.model, ...(await candidate.health()) }))
  );
}

export function resetProviderCache() {
  autoCache = null;
}
