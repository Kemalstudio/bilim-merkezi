"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, googleSignInAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneLoginForm } from "@/components/auth/phone-login-form";
import { useI18n } from "@/components/i18n-provider";

export function LoginForm({
  googleEnabled,
  callbackUrl,
}: {
  googleEnabled: boolean;
  callbackUrl?: string;
}) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t.auth.loginTitle}</h1>
        <p className="mt-1 text-sm text-muted">
          {t.auth.loginSubtitle}
        </p>
      </div>

      {/* Phone is first: most parents arrive from a mobile and have no password. */}
      <Tabs defaultValue="phone">
        <TabsList className="w-full">
          <TabsTrigger value="phone" className="flex-1">
            {t.auth.tabPhone}
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1">
            {t.auth.tabPassword}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phone">
          <PhoneLoginForm callbackUrl={callbackUrl} />
        </TabsContent>

        <TabsContent value="email">
          <form action={formAction} className="flex flex-col gap-4">
            {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login">{t.auth.loginField}</Label>
              <Input
                id="login"
                name="login"
                type="text"
                inputMode="email"
                placeholder={t.auth.loginPlaceholder}
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t.auth.password}</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-brand-ink hover:underline"
                >
                  {t.auth.forgot}
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            {state?.error && (
              <p role="alert" className="rounded-xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={isPending} className="mt-2">
              {isPending ? t.auth.signingIn : t.auth.signIn}
            </Button>
          </form>

          {googleEnabled && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-border" /> {t.auth.or}{" "}
                <span className="h-px flex-1 bg-border" />
              </div>
              <form action={googleSignInAction}>
                {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
                <Button type="submit" variant="outline" className="w-full">
                  {t.auth.google}
                </Button>
              </form>
            </>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-muted">
        {t.auth.noAccount}{" "}
        <Link
          href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"}
          className="font-semibold text-brand-ink hover:underline"
        >
          {t.auth.register}
        </Link>
      </p>
    </div>
  );
}
