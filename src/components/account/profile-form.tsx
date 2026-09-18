"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export function ProfileForm({
  defaultName,
  email,
  phone,
}: {
  defaultName: string;
  email: string | null;
  phone: string | null;
}) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(updateProfileAction, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-semibold text-ink">{t.account.profile}</h2>
      {email && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input id="email" value={email} disabled />
        </div>
      )}
      {phone && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{t.account.loginPhone}</Label>
          <Input id="phone" value={phone} disabled />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t.account.name}</Label>
        <Input id="name" name="name" defaultValue={defaultName} autoComplete="name" minLength={2} required />
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? t.common.saving : t.common.save}
      </Button>
    </form>
  );
}
