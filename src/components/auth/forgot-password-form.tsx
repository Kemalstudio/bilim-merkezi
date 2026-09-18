"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { requestOtpAction, resetPasswordAction } from "@/actions/phone-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneField } from "@/components/auth/phone-field";
import { OtpInput } from "@/components/auth/otp-input";
import { LottieIcon } from "@/components/shared/lottie-icon";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/otp-constants";
import { tpl } from "@/lib/i18n/format";
import { useI18n } from "@/components/i18n-provider";

/**
 * Password recovery over the same SMS code path as sign-in: number → code →
 * new password. No email round-trip, which matters when the account was created
 * by phone and has only a placeholder address.
 */
export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [resetState, resetFormAction, isResetting] = useActionState(
    resetPasswordAction,
    undefined
  );
  const [requestState, setRequestState] = useState<{
    phone: string;
    maskedPhone: string;
  } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isRequesting, startRequest] = useTransition();
  const sent = requestState !== null;

  function requestCode(formData: FormData) {
    startRequest(async () => {
      const result = await requestOtpAction(undefined, formData);
      if (!result || result.status !== "sent") {
        toast.error(result?.status === "error" ? result.error : t.auth.sendFailed);
        return;
      }

      setRequestState({ phone: result.phone, maskedPhone: result.maskedPhone });
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      if (result.simulated) {
        toast.info(t.auth.simulated, {
          duration: 8000,
        });
      }
    });
  }

  useEffect(() => {
    if (resetState?.error) toast.error(resetState.error);
  }, [resetState]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (resetState?.success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <LottieIcon src="/lottie/success.json" trigger="once" playTo={0.7} className="h-20 w-20" />
        <h1 className="font-display text-2xl font-bold text-ink">{t.auth.passwordUpdated}</h1>
        <p className="text-sm text-muted">
          {t.auth.passwordUpdatedText}
        </p>
        <Button asChild className="mt-2 w-full">
          <Link href="/login">{t.auth.toLogin}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t.auth.recoveryTitle}</h1>
        <p className="mt-1 text-sm text-muted">
          {sent ? t.auth.recoveryCodeStep : t.auth.recoveryPhoneStep}
        </p>
      </div>

      {!sent ? (
        <form action={requestCode} className="flex flex-col gap-4">
          <input type="hidden" name="purpose" value="recovery" />
          <PhoneField autoFocus disabled={isRequesting} />
          <Button type="submit" disabled={isRequesting}>
            {isRequesting ? t.auth.sendingCode : t.auth.getCode}
          </Button>
        </form>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-xl bg-surface-sunken p-3">
            <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
            <p className="text-xs text-ink-soft">
              {tpl(t.auth.codeIfRegistered, { phone: requestState.maskedPhone })}
            </p>
          </div>

          <form action={resetFormAction} className="flex flex-col gap-4">
            <input type="hidden" name="phone" value={requestState.phone} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">{t.auth.code}</Label>
              <OtpInput disabled={isResetting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t.auth.newPassword}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={isResetting}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">{t.auth.repeatPassword}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={isResetting}
              />
            </div>
            <Button type="submit" disabled={isResetting}>
              {isResetting ? t.common.saving : t.auth.saveNewPassword}
            </Button>
          </form>

          <form action={requestCode} className="text-center">
            <input type="hidden" name="purpose" value="recovery" />
            <input type="hidden" name="phone" value={requestState.phone} />
            <button
              type="submit"
              disabled={cooldown > 0 || isRequesting}
              className="text-xs font-semibold text-brand-ink transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
              {cooldown > 0 ? tpl(t.auth.resendIn, { seconds: cooldown }) : t.auth.resend}
            </button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-muted">
        {t.auth.rememberPassword}{" "}
        <Link href="/login" className="font-semibold text-brand-ink hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
