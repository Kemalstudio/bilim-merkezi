"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { OTP_LENGTH } from "@/lib/otp-constants";
import { tpl } from "@/lib/i18n/format";
import { useI18n } from "@/components/i18n-provider";

/**
 * Segmented code field. Renders one box per digit for legibility, but keeps a
 * single hidden input as the form value so the server sees a plain string.
 * Paste, backspace and arrow keys all behave the way people expect from a
 * bank-app code field.
 */
export function OtpInput({
  name = "code",
  onComplete,
  disabled,
  autoFocus = true,
}: {
  name?: string;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (code.length === OTP_LENGTH) onComplete?.(code);
    // `onComplete` is intentionally excluded: it fires once per completed code,
    // not on every re-render that hands us a new closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function write(index: number, value: string) {
    const chars = value.replace(/\D/g, "").split("");
    if (chars.length === 0) return;

    setDigits((current) => {
      const next = [...current];
      chars.forEach((char, offset) => {
        if (index + offset < OTP_LENGTH) next[index + offset] = char;
      });
      return next;
    });

    const landing = Math.min(index + chars.length, OTP_LENGTH - 1);
    refs.current[landing]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      setDigits((current) => {
        const next = [...current];
        if (next[index]) {
          next[index] = "";
        } else if (index > 0) {
          next[index - 1] = "";
          refs.current[index - 1]?.focus();
        }
        return next;
      });
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={code} />
      <div className="flex justify-between gap-2" role="group" aria-label={t.auth.code}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={digit}
            disabled={disabled}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            id={index === 0 ? name : undefined}
            aria-label={tpl(t.auth.codeDigit, { n: index + 1, total: OTP_LENGTH })}
            maxLength={OTP_LENGTH}
            onChange={(event) => write(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onFocus={(event) => event.target.select()}
            className={cn(
              "h-14 w-full min-w-0 rounded-xl border border-border bg-surface text-center font-display text-xl font-bold text-ink",
              "transition-[border-color,box-shadow] duration-200",
              "focus-visible:border-brand-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-start",
              "disabled:cursor-not-allowed disabled:opacity-50",
              digit && "border-brand-start/60"
            )}
          />
        ))}
      </div>
    </div>
  );
}
