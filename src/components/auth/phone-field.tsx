"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { normalizePhone, DEFAULT_COUNTRY_CODE } from "@/lib/phone";

/**
 * Phone entry with validation that waits for blur. Nothing turns red while a
 * parent is still mid-number — the message appears only once they have moved on
 * and the number is genuinely unusable.
 */
export function PhoneField({
  name = "phone",
  defaultValue = "",
  label = "Номер телефона",
  autoFocus,
  disabled,
}: {
  name?: string;
  defaultValue?: string;
  label?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [touched, setTouched] = useState(false);

  const invalid = touched && value.trim().length > 0 && !normalizePhone(value);
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Phone
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
        <Input
          id={name}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          autoFocus={autoFocus}
          disabled={disabled}
          required
          placeholder={`+${DEFAULT_COUNTRY_CODE} 65 12 34 56`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={cn("pl-11", invalid && "border-rose focus-visible:ring-rose")}
        />
      </div>
      {invalid && (
        <p id={errorId} className="text-xs text-rose">
          Проверьте номер — например, +993 65 12 34 56
        </p>
      )}
    </div>
  );
}
