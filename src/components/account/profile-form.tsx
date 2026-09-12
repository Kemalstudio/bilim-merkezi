"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ProfileForm({ defaultName, email }: { defaultName: string; email: string | null }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, undefined);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-semibold text-ink">Профиль</h2>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email ?? ""} disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Имя</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}
