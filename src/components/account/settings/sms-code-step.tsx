"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/auth/otp-input";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/otp-constants";
import { tpl } from "@/lib/i18n/format";
import { useI18n } from "@/components/i18n-provider";
import type { CodeRequestState } from "@/actions/settings";

/**
 * The "get a code, then type it" part shared by the phone change, the first password and the
 * account deletion. It only asks for and shows the code; the surrounding form decides what
 * the code unlocks and submits it under the field name `code`.
 *
 * `request` sends the SMS. When it answers `not-needed` (the account has no phone), the step
 * calls `onSkip` so the parent can carry on without a code.
 */
export function SmsCodeStep({
  request,
  sendLabel,
  disabled,
  onStateChange,
  onSkip,
  children,
}: {
  request: () => Promise<CodeRequestState>;
  sendLabel: string;
  disabled?: boolean;
  /** Lets the parent know whether a code has been sent, e.g. to reveal the rest of the form. */
  onStateChange?: (sent: boolean) => void;
  onSkip?: () => void;
  /** Rendered once the code has been sent — typically the fields the code unlocks. */
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isSending, startSending] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function send() {
    startSending(async () => {
      const result = await request();
      if (result.status === "error") {
        toast.error(result.error);
        return;
      }
      if (result.status === "not-needed") {
        onSkip?.();
        return;
      }
      setSentTo(result.maskedPhone);
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      onStateChange?.(true);
      if (result.simulated) toast.info(t.auth.simulated, { duration: 8000 });
    });
  }

  if (!sentTo) {
    return (
      <Button type="button" variant="outline" onClick={send} disabled={disabled || isSending} className="self-start">
        {isSending ? t.settings.contacts.sendingCode : sendLabel}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-xl bg-surface-sunken p-3">
        <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
        <p className="text-xs leading-5 text-ink-soft">{tpl(t.settings.contacts.codeSentTo, { phone: sentTo })}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">{t.auth.code}</Label>
        <OtpInput disabled={disabled} />
      </div>
      {children}
      <button
        type="button"
        onClick={send}
        disabled={cooldown > 0 || isSending}
        className="self-start text-xs font-semibold text-brand-ink transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
      >
        {cooldown > 0 ? tpl(t.auth.resendIn, { seconds: cooldown }) : t.auth.resend}
      </button>
    </div>
  );
}
