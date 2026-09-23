"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteAccountAction, requestSecurityCodeAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { SmsCodeStep } from "@/components/account/settings/sms-code-step";
import { useI18n } from "@/components/i18n-provider";

/**
 * Deleting the account is confirmed the same way the account is protected: with the password if
 * there is one, otherwise with a code texted to the number on file, and always with a tick that
 * says the person understands it cannot be undone.
 */
export function DeleteAccount({ hasPassword, hasPhone, isStaff }: { hasPassword: boolean; hasPhone: boolean; isStaff: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(deleteAccountAction, undefined);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  if (isStaff) return <p className="text-sm text-muted">{t.settings.data.staffNote}</p>;

  const needsCode = !hasPassword && hasPhone;

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <ResponsiveDialogTrigger asChild>
        <Button type="button" variant="outline" className="self-start border-rose/40 text-rose hover:border-rose hover:bg-rose/5">
          {t.settings.data.deleteButton}
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.settings.data.deleteConfirmTitle}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t.settings.data.deleteConfirmText}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {hasPassword && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delete-password">{t.settings.contacts.passwordConfirm}</Label>
              <Input id="delete-password" name="currentPassword" type="password" autoComplete="current-password" required disabled={isPending} />
            </div>
          )}
          {needsCode && (
            <SmsCodeStep
              request={() => requestSecurityCodeAction("ACCOUNT_DELETE")}
              sendLabel={t.settings.contacts.sendCode}
              disabled={isPending}
            />
          )}
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-ink-soft">
            <input
              type="checkbox"
              name="confirm"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              required
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-rose)]"
            />
            {t.settings.data.deleteCheckbox}
          </label>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                {t.settings.profile.cancel}
              </Button>
            </ResponsiveDialogClose>
            <Button type="submit" variant="destructive" disabled={isPending || !confirmed}>
              {isPending ? t.common.saving : t.settings.data.deleteSubmit}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
