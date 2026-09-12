"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { changePasswordAction } from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex max-w-md flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
    >
      <h2 className="font-display text-lg font-semibold text-ink">Смена пароля</h2>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Текущий пароль</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Новый пароль</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmNewPassword">Повторите новый пароль</Label>
        <Input id="confirmNewPassword" name="confirmNewPassword" type="password" required />
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Сохранение..." : "Изменить пароль"}
      </Button>
    </form>
  );
}
