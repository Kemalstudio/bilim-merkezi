import type { Metadata } from "next";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { getAssistantSettings } from "@/lib/site-settings";
import { describeProviders, providerSetting, resetProviderCache, resolveProvider } from "@/lib/ai/providers";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AssistantTester, AssistantToggle } from "@/components/admin/site/assistant-form";

export const metadata: Metadata = { title: "ИИ-помощник" };
export const dynamic = "force-dynamic";

export default async function SiteAssistantPage() {
  await requireRole("ADMIN");
  // Always a fresh probe here, so the page reflects a model that was just installed.
  resetProviderCache();
  const [settings, providers, active] = await Promise.all([getAssistantSettings(), describeProviders(), resolveProvider()]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Сайт"
        title="ИИ-помощник"
        description="Помощник подбирает курсы и отвечает на вопросы только по данным сайта: каталогу, частым вопросам и контактам. Без модели он отвечает сам по найденным курсам — сайт работает в любом случае."
      />

      <AssistantToggle initial={settings} />

      <section className="rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm">
        <h2 className="font-display text-lg font-bold text-ink">Сейчас отвечает</h2>
        <p className="mt-2 flex items-center gap-2 text-sm text-ink">
          {active.provider ? (
            <CheckCircle2 aria-hidden className="h-4 w-4 text-emerald" />
          ) : (
            <CircleAlert aria-hidden className="h-4 w-4 text-amber" />
          )}
          {active.provider ? `Языковая модель: ${active.provider.name}, ${active.provider.model}` : "Локальный поиск без модели"}
        </p>
        <p className="mt-1 text-xs text-muted">
          {active.reason} · AI_PROVIDER={providerSetting()}
        </p>

        <ul className="mt-4 flex flex-col divide-y divide-border rounded-xl border border-border">
          {providers.map((provider) => (
            <li key={provider.name} className="flex items-start gap-3 px-4 py-3 text-sm">
              {provider.ok ? (
                <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
              ) : (
                <CircleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
              )}
              <span>
                <span className="font-semibold text-ink">{provider.name}</span>
                <span className="text-muted"> · {provider.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <AssistantTester />

      <section className="rounded-[1.4rem] border border-border bg-surface p-5 text-sm leading-6 text-ink-soft shadow-glow-sm">
        <h2 className="font-display text-lg font-bold text-ink">Как подключить локальную модель</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
          <li>
            Установите Ollama: <code className="rounded bg-surface-sunken px-1.5 py-0.5">winget install Ollama.Ollama</code>
          </li>
          <li>
            Скачайте модель (≈4,7 ГБ, нужна видеокарта от 6 ГБ):{" "}
            <code className="rounded bg-surface-sunken px-1.5 py-0.5">ollama pull qwen2.5:7b</code>
          </li>
          <li>
            Без видеокарты возьмите модель поменьше: <code className="rounded bg-surface-sunken px-1.5 py-0.5">ollama pull qwen2.5:3b</code> и
            укажите <code className="rounded bg-surface-sunken px-1.5 py-0.5">AI_MODEL=qwen2.5:3b</code> в .env.
          </li>
          <li>Обновите эту страницу — статус станет зелёным, перезапуск сайта не нужен.</li>
        </ol>
        <p className="mt-3 text-xs text-muted">
          Другие варианты в .env: AI_PROVIDER=openai с OPENAI_BASE_URL (LM Studio, llama.cpp) или AI_PROVIDER=anthropic с
          ANTHROPIC_API_KEY. AI_PROVIDER=off отключает модель — остаётся локальный поиск.
        </p>
      </section>
    </div>
  );
}
