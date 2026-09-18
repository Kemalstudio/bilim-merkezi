"use client";

import { useState, useTransition } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingSaver } from "@/components/admin/use-setting-saver";
import { saveSiteSettingAction } from "@/actions/admin-site";
import type { AssistantSettings } from "@/lib/site-settings-schema";
import type { AssistantEvent } from "@/lib/ai/assistant";
import type { CourseCard } from "@/lib/ai/answer";

export function AssistantToggle({ initial }: { initial: AssistantSettings }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const { pending, run } = useSettingSaver();

  function change(next: boolean) {
    setEnabled(next);
    run(
      () => saveSiteSettingAction("assistant", { enabled: next }),
      next ? "Помощник включён" : "Помощник выключен",
    );
  }

  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-panel text-accent">
        <Bot aria-hidden className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display font-bold text-ink">ИИ-помощник на сайте</span>
        <span className="mt-1 block text-sm text-muted">
          Чат подбора курса на публичных страницах и в кабинете, а также «Разбор прогресса» в профиле ребёнка.
        </span>
      </span>
      <Switch checked={enabled} onCheckedChange={change} disabled={pending} aria-label="ИИ-помощник на сайте" />
    </label>
  );
}

type TestResult = { mode: string; text: string; courses: CourseCard[]; ms: number };

/** Sends one question through the same endpoint visitors use and shows how it was answered. */
export function AssistantTester() {
  const [question, setQuestion] = useState("Сыну 11 лет, хочет заниматься программированием");
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function ask() {
    setError(null);
    startTransition(async () => {
      const started = performance.now();
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `Ошибка ${response.status}`);
        }
        const events = (await response.text())
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line) as AssistantEvent);
        let mode = "—";
        let text = "";
        let courses: CourseCard[] = [];
        for (const event of events) {
          if (event.type === "start") mode = event.mode;
          if (event.type === "delta") text += event.text;
          if (event.type === "replace") {
            text = event.text;
            mode = `${mode} → проверенный локальный ответ`;
          }
          if (event.type === "courses") courses = event.courses;
          if (event.type === "error") throw new Error(event.message);
        }
        setResult({ mode, text, courses, ms: Math.round(performance.now() - started) });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Не удалось получить ответ");
      }
    });
  }

  return (
    <div className="rounded-[1.4rem] border border-border bg-surface p-5 shadow-glow-sm">
      <h2 className="font-display text-lg font-bold text-ink">Проверить ответ</h2>
      <p className="mt-1 text-sm text-muted">Вопрос уходит в тот же API, что и у посетителей, на языке, выбранном на сайте.</p>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          ask();
        }}
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="assistant-test">Вопрос</Label>
          <Input id="assistant-test" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={600} />
        </div>
        <Button type="submit" disabled={isPending || !question.trim()}>
          <Send aria-hidden className="h-4 w-4" /> {isPending ? "Ждём ответ..." : "Спросить"}
        </Button>
      </form>
      {error && <p className="mt-3 text-sm text-rose">{error}</p>}
      {result && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-surface-sunken p-4">
          <p className="text-xs font-semibold text-muted">
            Режим: {result.mode === "model" ? "языковая модель" : result.mode === "local" ? "локальный поиск" : result.mode} ·{" "}
            {result.ms} мс
          </p>
          <p className="whitespace-pre-line text-sm leading-6 text-ink">{result.text}</p>
          {result.courses.length > 0 && (
            <p className="text-xs text-muted">Карточки: {result.courses.map((course) => course.title).join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
