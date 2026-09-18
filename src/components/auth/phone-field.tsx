"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  normalizePhone,
  DEFAULT_COUNTRY_CODE,
  OPERATOR_PREFIXES,
} from "@/lib/phone";
import { useI18n } from "@/components/i18n-provider";

/** Operator prefix plus six subscriber digits — "65 123456". */
const NATIONAL_LENGTH = 8;

/** Groups typed digits as "65 12 34 56" so a long number stays readable. */
function groupDigits(digits: string): string {
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

/** Width of a full number once grouped — "65 12 34 56" is 11 characters. */
const GROUPED_LENGTH = groupDigits("0".repeat(NATIONAL_LENGTH)).length;

/**
 * Phone entry for Turkmen numbers. The "+993" country code is fixed furniture
 * rather than something to type, so a parent only enters the eight digits that
 * vary: an operator prefix (61-65, 71, 72) and six subscriber digits.
 *
 * Validation waits for blur — nothing turns red while a parent is still
 * mid-number. The message appears only once they have moved on and the number
 * is genuinely unusable.
 */
export function PhoneField({
  name = "phone",
  defaultValue = "",
  label,
  autoFocus,
  disabled,
}: {
  name?: string;
  defaultValue?: string;
  label?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [digits, setDigits] = useState(() => nationalDigits(defaultValue));
  const [touched, setTouched] = useState(false);

  const normalized = normalizePhone(`${DEFAULT_COUNTRY_CODE}${digits}`);
  const invalid = touched && digits.length > 0 && !normalized;
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${name}-input`}>{label ?? t.auth.phone}</Label>
      <div className="relative">
        <Phone
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-sm tabular-nums text-muted"
        >
          +{DEFAULT_COUNTRY_CODE}
        </span>
        {/*
         * The visible field holds only the national part; the request needs E.164.
         * An unusable number is still submitted with its country code so the server
         * answers "check the number" rather than "the number is missing".
         */}
        <input
          type="hidden"
          name={name}
          value={normalized ?? (digits ? `${DEFAULT_COUNTRY_CODE}${digits}` : "")}
        />
        <Input
          id={`${name}-input`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          disabled={disabled}
          required
          maxLength={GROUPED_LENGTH}
          placeholder="65 12 34 56"
          value={groupDigits(digits)}
          onChange={(event) =>
            setDigits(event.target.value.replace(/\D/g, "").slice(0, NATIONAL_LENGTH))
          }
          onBlur={() => setTouched(true)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={cn(
            "pl-[5.25rem] tabular-nums",
            invalid && "border-rose focus-visible:ring-rose"
          )}
        />
      </div>
      {invalid && (
        <p id={errorId} className="text-xs text-rose">
          {digits.length === NATIONAL_LENGTH
            ? t.auth.phonePrefixHint.replace(
                "{prefixes}",
                OPERATOR_PREFIXES.join(", ")
              )
            : t.auth.phoneInvalidHint}
        </p>
      )}
    </div>
  );
}

/** Pulls the eight national digits out of a stored or prefilled number. */
function nationalDigits(value: string): string {
  const all = value.replace(/\D/g, "");
  const national = all.startsWith(DEFAULT_COUNTRY_CODE)
    ? all.slice(DEFAULT_COUNTRY_CODE.length)
    : all;
  return national.slice(0, NATIONAL_LENGTH);
}
