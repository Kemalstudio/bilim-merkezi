"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowUp, RotateCcw, Sparkles, Square, UserRound, X } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import type { AssistantEvent } from "@/lib/ai/assistant";
import type { CourseCard } from "@/lib/ai/answer";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  courses?: CourseCard[];
  failed?: boolean;
};

const STORAGE_KEY = "bilim-assistant";
const MAX_INPUT = 600;

const newId = () => Math.random().toString(36).slice(2);

function loadStored(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Message[]) : [];
    return Array.isArray(parsed) ? parsed.slice(-20) : [];
  } catch {
    return [];
  }
}

/**
 * The course advisor: a launcher in the corner and a chat panel. Answers stream in as they are
 * generated; course suggestions arrive as cards with real links. The conversation survives
 * navigation within the tab (sessionStorage) and is never sent anywhere but our own API.
 */
export function AssistantWidget() {
  const { t } = useI18n();
  const a = t.assistant;
  const [open, setOpen] = useState(false);
  // Nothing that depends on the stored conversation renders until the panel opens, so reading
  // storage in the initializer cannot cause a hydration mismatch.
  const [messages, setMessages] = useState<Message[]>(() => (typeof window === "undefined" ? [] : loadStored()));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (busy) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {}
  }, [messages, busy]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  const update = (id: string, change: (message: Message) => Message) =>
    setMessages((current) => current.map((message) => (message.id === id ? change(message) : message)));

  async function send(text: string) {
    const question = text.trim().slice(0, MAX_INPUT);
    if (!question || busy) return;

    const user: Message = { id: newId(), role: "user", content: question };
    const reply: Message = { id: newId(), role: "assistant", content: "" };
    const history = [...messages.filter((message) => !message.failed), user];
    setMessages([...messages, user, reply]);
    setInput("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-12).map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? a.error);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline: number;
        while ((newline = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line) continue;
          const event = JSON.parse(line) as AssistantEvent;
          if (event.type === "delta") update(reply.id, (message) => ({ ...message, content: message.content + event.text }));
          else if (event.type === "replace") update(reply.id, (message) => ({ ...message, content: event.text }));
          else if (event.type === "courses") update(reply.id, (message) => ({ ...message, courses: event.courses }));
          else if (event.type === "error") throw new Error(event.message);
        }
      }
    } catch (error) {
      if (controller.signal.aborted) {
        update(reply.id, (message) => (message.content ? message : { ...message, content: "…", failed: true }));
      } else {
        const message = error instanceof Error && error.message ? error.message : a.error;
        update(reply.id, (current) => ({ ...current, content: message, failed: true }));
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(input);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    inputRef.current?.focus();
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="assistant-panel"
        className={cn(
          "fixed bottom-4 right-4 z-[60] flex h-14 items-center gap-2 rounded-full bg-panel pl-4 pr-5 text-sm font-bold text-white shadow-glow-lg transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-6 sm:right-6",
          open && "pointer-events-none translate-y-2 opacity-0 sm:pointer-events-auto sm:translate-y-0 sm:opacity-100"
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[#0b2233]">
          {open ? <X aria-hidden className="h-4 w-4" /> : <Sparkles aria-hidden className="h-4 w-4" />}
        </span>
        <span className="hidden sm:inline">{open ? a.close : a.open}</span>
        <span className="sr-only sm:hidden">{open ? a.close : a.open}</span>
      </button>

      {open && (
        <section
          id="assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-title"
          onKeyDown={(event) => event.key === "Escape" && close()}
          className="fixed inset-x-0 bottom-0 z-[70] flex h-[min(100dvh,720px)] flex-col overflow-hidden border border-border bg-surface shadow-glow-lg animate-panel-in sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(640px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-[1.4rem]"
        >
          <header className="flex items-start gap-3 bg-panel px-4 py-3.5 text-white">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-[#0b2233]">
              <Sparkles aria-hidden className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="assistant-title" className="font-display text-base font-bold leading-tight">
                {a.title}
              </h2>
              <p className="mt-0.5 text-xs text-white/60">{a.subtitle}</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                aria-label={a.reset}
                title={a.reset}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <RotateCcw aria-hidden className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label={a.close}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-busy={busy}>
            <div className="flex flex-col gap-3">
              <Bubble role="assistant" label={a.bot}>
                {a.greeting}
              </Bubble>

              {messages.length === 0 && (
                <ul className="flex flex-wrap gap-2 pl-9" aria-label={a.subtitle}>
                  {a.suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => void send(suggestion)}
                        className="rounded-full border border-border bg-surface px-3 py-1.5 text-left text-xs font-semibold text-ink-soft transition-colors hover:border-brand/40 hover:text-ink"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {messages.map((message) => (
                <div key={message.id} className="flex flex-col gap-2">
                  <Bubble role={message.role} label={message.role === "user" ? a.you : a.bot} failed={message.failed}>
                    {message.content || (
                      <span className="inline-flex items-center gap-2 text-muted">
                        <span className="flex gap-1" aria-hidden>
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                        </span>
                        {a.thinking}
                      </span>
                    )}
                  </Bubble>
                  {message.courses && message.courses.length > 0 && (
                    <ul className="flex flex-col gap-2 pl-9">
                      {message.courses.map((course) => (
                        <li key={course.slug}>
                          <Link
                            href={`/courses/${course.slug}`}
                            className="group block rounded-2xl border border-border bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-glow-sm"
                          >
                            <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-brand-ink">{course.category}</p>
                            <p className="mt-0.5 text-sm font-bold leading-snug text-ink group-hover:text-brand-ink">{course.title}</p>
                            <p className="mt-1 text-xs text-muted">
                              {[course.age, course.schedule, course.price].filter(Boolean).join(" · ")}
                            </p>
                            <p className="mt-1.5 text-xs font-bold text-brand-ink">{a.details} →</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="border-t border-border bg-surface px-3 pb-3 pt-2">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-sunken/60 p-1.5 focus-within:border-brand/50">
              <label htmlFor="assistant-input" className="sr-only">
                {a.inputLabel}
              </label>
              <textarea
                id="assistant-input"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT))}
                onKeyDown={onInputKeyDown}
                placeholder={a.placeholder}
                rows={1}
                maxLength={MAX_INPUT}
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm text-ink outline-none placeholder:text-muted [field-sizing:content]"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  aria-label={t.common.cancel}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-background transition-transform active:scale-95"
                >
                  <Square aria-hidden className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label={a.send}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-[#0b2233] transition-transform active:scale-95 disabled:opacity-40"
                >
                  <ArrowUp aria-hidden className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="px-1 pt-2 text-[0.68rem] leading-4 text-muted">{a.disclaimer}</p>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({
  role,
  label,
  failed,
  children,
}: {
  role: "user" | "assistant";
  label: string;
  failed?: boolean;
  children: React.ReactNode;
}) {
  const mine = role === "user";
  return (
    <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
      <span
        aria-hidden
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          mine ? "bg-surface-sunken text-ink-soft" : "bg-accent text-[#0b2233]"
        )}
      >
        {mine ? <UserRound className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </span>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-6",
          mine ? "rounded-br-md bg-panel text-white" : "rounded-bl-md bg-surface-sunken text-ink",
          failed && "text-rose"
        )}
      >
        <span className="sr-only">{label}: </span>
        {children}
      </div>
    </div>
  );
}
