"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { loginAction, googleSignInAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneLoginForm } from "@/components/auth/phone-login-form";

export function LoginForm({
  googleEnabled,
  callbackUrl,
}: {
  googleEnabled: boolean;
  callbackUrl?: string;
}) {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-ink">С возвращением</h1>
        <p className="mt-1 text-sm text-muted">
          Войдите, чтобы увидеть успехи вашего ребёнка
        </p>
      </div>

      {/* Phone is first: most parents arrive from a mobile and have no password. */}
      <Tabs defaultValue="phone">
        <TabsList className="w-full">
          <TabsTrigger value="phone" className="flex-1">
            По номеру телефона
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1">
            По email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phone">
          <PhoneLoginForm callbackUrl={callbackUrl} />
        </TabsContent>

        <TabsContent value="email">
          <form action={formAction} className="flex flex-col gap-4">
            {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-brand-ink hover:underline"
                >
                  Забыли пароль?
                </Link>
              </div>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" disabled={isPending} className="mt-2">
              {isPending ? "Входим..." : "Войти"}
            </Button>
          </form>

          {googleEnabled && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-border" /> или{" "}
                <span className="h-px flex-1 bg-border" />
              </div>
              <form action={googleSignInAction}>
                <Button type="submit" variant="outline" className="w-full">
                  Войти через Google
                </Button>
              </form>
            </>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-muted">
        Нет аккаунта?{" "}
        <Link href="/register" className="font-semibold text-brand-ink hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
