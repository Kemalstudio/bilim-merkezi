"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { requestOtpAction, verifyOtpAction } from "@/actions/phone-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneField } from "@/components/auth/phone-field";
import { OtpInput } from "@/components/auth/otp-input";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/otp-constants";
import { tpl } from "@/lib/i18n/format";
import { useI18n } from "@/components/i18n-provider";

type SentCode = { phone: string; maskedPhone: string };

/**
 * Two-step phone sign-in: number, then code. Step two replaces step one in
 * place rather than navigating, so the number stays on screen and a wrong digit
 * costs one tap to fix.
 */
export function PhoneLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const { t } = useI18n();
  const [sent, setSent] = useState<SentCode | null>(null);
  const [editingNumber, setEditingNumber] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isRequesting, startRequest] = useTransition();
  const [isVerifying, startVerify] = useTransition();
  const verifyFormRef = useRef<HTMLFormElement>(null);

  const onCodeStep = sent !== null && !editingNumber;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function requestCode(formData: FormData) {
    startRequest(async () => {
      const result = await requestOtpAction(undefined, formData);
      if (!result || result.status !== "sent") {
        toast.error(result?.status === "error" ? result.error : t.auth.sendFailed);
        return;
      }
      setSent({ phone: result.phone, maskedPhone: result.maskedPhone });
      setEditingNumber(false);
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      toast.success(tpl(t.auth.codeSent, { phone: result.maskedPhone }));
      if (result.simulated) {
        toast.info(t.auth.simulated, {
          duration: 8000,
        });
      }
    });
  }

  function verifyCode(formData: FormData) {
    startVerify(async () => {
      // A successful sign-in redirects, so anything returned here is a failure.
      const result = await verifyOtpAction(undefined, formData);
      if (result?.error) toast.error(result.error);
    });
  }

  if (!onCodeStep) {
    return (
      <form action={requestCode} className="flex flex-col gap-4">
        <PhoneField autoFocus disabled={isRequesting} defaultValue={sent?.phone ?? ""} />
        <p className="text-xs text-muted">{t.auth.sendCodeHint}</p>
        <Button type="submit" disabled={isRequesting} className="mt-1">
          {isRequesting ? t.auth.sendingCode : t.auth.getCode}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-xl bg-surface-sunken p-3">
        <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
        <p className="text-xs text-ink-soft">
          {tpl(t.auth.codeSentTo, { phone: sent.maskedPhone })}
        </p>
      </div>

      <form ref={verifyFormRef} action={verifyCode} className="flex flex-col gap-4">
        <input type="hidden" name="phone" value={sent.phone} />
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

        {/* The name comes first: a complete code submits the form on its own. */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t.auth.nameQuestion}</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder={t.auth.nameOnlyNew}
            disabled={isVerifying}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">{t.auth.code}</Label>
          <OtpInput
            disabled={isVerifying}
            onComplete={() => verifyFormRef.current?.requestSubmit()}
          />
        </div>

        <Button type="submit" disabled={isVerifying}>
          {isVerifying ? t.auth.checking : t.auth.signIn}
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs">
        <form action={requestCode}>
          <input type="hidden" name="phone" value={sent.phone} />
          <button
            type="submit"
            disabled={cooldown > 0 || isRequesting}
            className="font-semibold text-brand-ink transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
          >
            {cooldown > 0 ? tpl(t.auth.resendIn, { seconds: cooldown }) : t.auth.resend}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setEditingNumber(true)}
          className="inline-flex items-center gap-1 text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden className="h-3 w-3" /> {t.auth.otherNumber}
        </button>
      </div>
    </div>
  );
}
