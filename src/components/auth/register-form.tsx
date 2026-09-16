"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { registerAction, googleSignInAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, formAction, isPending] = useActionState(registerAction, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Создать аккаунт</h1>
        <p className="mt-1 text-sm text-muted">Начните учиться уже сегодня — это бесплатно</p>
      </div>

      {googleEnabled && (
        <>
          <form action={googleSignInAction}>
            <Button type="submit" variant="outline" className="w-full">
              Зарегистрироваться через Google
            </Button>
          </form>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" /> или <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Имя</Label>
          <Input id="name" name="name" placeholder="Ваше имя" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" name="password" type="password" placeholder="Минимум 8 символов" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" required />
        </div>
        <Button type="submit" disabled={isPending} className="mt-2">
          {isPending ? "Создаём аккаунт..." : "Зарегистрироваться"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-semibold text-brand-ink hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
