"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { registerAction, requestRegistrationCodeAction, googleSignInAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneField } from "@/components/auth/phone-field";
import { OtpInput } from "@/components/auth/otp-input";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/otp-constants";
import { tpl } from "@/lib/i18n/format";
import { useI18n } from "@/components/i18n-provider";

type Details = { name: string; phone: string; email: string; password: string; confirmPassword: string };

const EMPTY_DETAILS: Details = { name: "", phone: "", email: "", password: "", confirmPassword: "" };

/**
 * Two steps: the parent's details, then the code texted to their number. The account is
 * created only in the second step, so a number nobody can receive SMS on never gets one.
 */
export function RegisterForm({ googleEnabled, callbackUrl }: { googleEnabled: boolean; callbackUrl?: string }) {
  const { t } = useI18n();
  const [state, formAction, isConfirming] = useActionState(registerAction, undefined);
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [sentTo, setSentTo] = useState<{ phone: string; maskedPhone: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isRequesting, startRequest] = useTransition();

  function requestCode(formData: FormData) {
    const entered = Object.fromEntries(
      Object.keys(EMPTY_DETAILS).map((key) => [key, String(formData.get(key) ?? "")])
    ) as Details;
    setDetails(entered);

    startRequest(async () => {
      const result = await requestRegistrationCodeAction(formData);
      if (result.status !== "sent") {
        toast.error(result.error);
        return;
      }
      setSentTo({ phone: result.phone, maskedPhone: result.maskedPhone });
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      if (result.simulated) toast.info(t.auth.simulated, { duration: 8000 });
    });
  }

  function resendCode() {
    const formData = new FormData();
    for (const [key, value] of Object.entries(details)) formData.set(key, value);
    requestCode(formData);
  }

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t.auth.registerTitle}</h1>
        <p className="mt-1 text-sm text-muted">
          {sentTo ? tpl(t.auth.registerCodeStep, { phone: sentTo.maskedPhone }) : t.auth.registerSubtitle}
        </p>
      </div>

      {sentTo ? (
        <>
          <div className="flex items-start gap-3 rounded-xl bg-surface-sunken p-3">
            <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
            <p className="text-xs text-ink-soft">{tpl(t.auth.codeSentTo, { phone: sentTo.maskedPhone })}</p>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
            {Object.entries(details).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={key === "phone" ? sentTo.phone : value} />
            ))}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">{t.auth.code}</Label>
              <OtpInput disabled={isConfirming} />
            </div>
            {state?.error && (
              <p role="alert" className="rounded-xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={isConfirming}>
              {isConfirming ? t.auth.creating : t.auth.confirmRegistration}
            </Button>
          </form>

          <div className="flex items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="font-semibold text-muted transition-colors hover:text-ink"
            >
              {t.auth.editDetails}
            </button>
            <button
              type="button"
              onClick={resendCode}
              disabled={cooldown > 0 || isRequesting}
              className="font-semibold text-brand-ink transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
              {cooldown > 0 ? tpl(t.auth.resendIn, { seconds: cooldown }) : t.auth.resend}
            </button>
          </div>
        </>
      ) : (
        <>
          {googleEnabled && (
            <>
              <form action={googleSignInAction}>
                {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
                <Button type="submit" variant="outline" className="w-full">
                  {t.auth.googleRegister}
                </Button>
              </form>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-border" /> {t.auth.or} <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form action={requestCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{t.auth.yourName}</Label>
              <Input
                id="name"
                name="name"
                defaultValue={details.name}
                placeholder={t.auth.namePlaceholder}
                autoComplete="name"
                minLength={2}
                required
                disabled={isRequesting}
              />
            </div>
            <PhoneField defaultValue={details.phone} disabled={isRequesting} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t.auth.emailOptional}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={details.email}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isRequesting}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue={details.password}
                placeholder={t.auth.passwordPlaceholder}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                disabled={isRequesting}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">{t.auth.repeatPassword}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                defaultValue={details.confirmPassword}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                disabled={isRequesting}
              />
            </div>
            <p className="text-xs text-muted">{t.auth.registerSmsHint}</p>
            <Button type="submit" disabled={isRequesting} className="mt-1">
              {isRequesting ? t.auth.sendingCode : t.auth.getCode}
            </Button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-muted">
        {t.auth.haveAccount}{" "}
        <Link
          href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
          className="font-semibold text-brand-ink hover:underline"
        >
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
