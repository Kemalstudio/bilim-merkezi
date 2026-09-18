"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { changePasswordAction } from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export function PasswordForm() {
  const { t } = useI18n();
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
      <h2 className="font-display text-lg font-semibold text-ink">{t.account.passwordTitle}</h2>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">{t.account.currentPassword}</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">{t.account.newPassword}</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmNewPassword">{t.account.repeatNewPassword}</Label>
        <Input id="confirmNewPassword" name="confirmNewPassword" type="password" autoComplete="new-password" required />
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? t.common.saving : t.account.changePassword}
      </Button>
    </form>
  );
}
