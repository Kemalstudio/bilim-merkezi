"use client";

import { useActionState } from "react";
import { resetPasswordWithLinkAction } from "@/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tpl } from "@/lib/i18n/format";
import { useI18n } from "@/components/i18n-provider";

/** The form behind an emailed or admin-made link; on success the parent lands in the cabinet. */
export function ResetPasswordForm({ token, account }: { token: string; account: string }) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(resetPasswordWithLinkAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{t.auth.resetTitle}</h1>
        <p className="mt-1 text-sm text-muted">{tpl(t.auth.resetSubtitle, { account })}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t.auth.newPassword}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={t.auth.passwordPlaceholder}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            autoFocus
            disabled={isPending}
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
            disabled={isPending}
          />
        </div>
        {state?.error && (
          <p role="alert" className="rounded-xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? t.common.saving : t.auth.saveNewPassword}
        </Button>
      </form>
    </div>
  );
}
