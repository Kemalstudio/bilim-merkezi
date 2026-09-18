"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, googleSignInAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n-provider";

export function RegisterForm({ googleEnabled, callbackUrl }: { googleEnabled: boolean; callbackUrl?: string }) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(registerAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t.auth.registerTitle}</h1>
        <p className="mt-1 text-sm text-muted">
          {t.auth.registerSubtitle}
        </p>
      </div>

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

      <form action={formAction} className="flex flex-col gap-4">
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t.auth.yourName}</Label>
          <Input id="name" name="name" placeholder={t.auth.namePlaceholder} autoComplete="name" minLength={2} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t.auth.password}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={t.auth.passwordPlaceholder}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">{t.auth.repeatPassword}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>
        {state?.error && (
          <p role="alert" className="rounded-xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={isPending} className="mt-2">
          {isPending ? t.auth.creating : t.auth.register}
        </Button>
      </form>

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
