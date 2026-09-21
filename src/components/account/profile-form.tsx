"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

/** The name shown in the header, in reviews and on the parent's cabinet. */
export function ProfileForm({ defaultName }: { defaultName: string }) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(updateProfileAction, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t.settings.profile.name}</Label>
        <Input id="name" name="name" defaultValue={defaultName} autoComplete="name" minLength={2} maxLength={80} required />
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? t.common.saving : t.common.save}
      </Button>
    </form>
  );
}
