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

/**
 * Password recovery over the same SMS code path as sign-in: number → code →
 * new password. No email round-trip, which matters when the account was created
 * by phone and has only a placeholder address.
 */
export function ForgotPasswordForm() {
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
        toast.error(
          result?.status === "error" ? result.error : "Не удалось отправить код"
        );
        return;
      }

      setRequestState({ phone: result.phone, maskedPhone: result.maskedPhone });
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      if (result.simulated) {
        toast.info("SMS-шлюз не подключён — код напечатан в консоли сервера.", {
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
        <h1 className="font-display text-2xl font-bold text-ink">Пароль обновлён</h1>
        <p className="text-sm text-muted">
          Теперь войдите с новым паролем — или просто по номеру телефона.
        </p>
        <Button asChild className="mt-2 w-full">
          <Link href="/login">Перейти ко входу</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Восстановление доступа</h1>
        <p className="mt-1 text-sm text-muted">
          {sent
            ? "Введите код из SMS и придумайте новый пароль"
            : "Укажите номер телефона, привязанный к аккаунту"}
        </p>
      </div>

      {!sent ? (
        <form action={requestCode} className="flex flex-col gap-4">
          <input type="hidden" name="purpose" value="recovery" />
          <PhoneField autoFocus disabled={isRequesting} />
          <Button type="submit" disabled={isRequesting}>
            {isRequesting ? "Отправляем код..." : "Получить код"}
          </Button>
        </form>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-xl bg-surface-sunken p-3">
            <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
            <p className="text-xs text-ink-soft">
              Если этот номер зарегистрирован, код придёт на{" "}
              <span className="font-semibold text-ink">{requestState.maskedPhone}</span>.
            </p>
          </div>

          <form action={resetFormAction} className="flex flex-col gap-4">
            <input type="hidden" name="phone" value={requestState.phone} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Код из SMS</Label>
              <OtpInput disabled={isResetting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Новый пароль</Label>
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
              <Label htmlFor="confirmPassword">Повторите пароль</Label>
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
              {isResetting ? "Сохраняем..." : "Сохранить новый пароль"}
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
              {cooldown > 0
                ? `Отправить код повторно через ${cooldown} с`
                : "Отправить код повторно"}
            </button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-muted">
        Вспомнили пароль?{" "}
        <Link href="/login" className="font-semibold text-brand-ink hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
