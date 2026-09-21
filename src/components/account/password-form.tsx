"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { changePasswordAction } from "@/actions/profile";
import { requestSecurityCodeAction, setPasswordAction } from "@/actions/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SmsCodeStep } from "@/components/account/settings/sms-code-step";
import { useI18n } from "@/components/i18n-provider";

/** Change the password of an account that has one. */
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
    <form ref={formRef} action={formAction} className="flex max-w-md flex-col gap-4">
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

/**
 * A first password for an account that signs in by SMS or Google. When the account has a phone,
 * the number's owner confirms it with a code — a session alone must not be able to add a new
 * way into the account.
 */
export function SetPasswordForm({ hasPhone }: { hasPhone: boolean }) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(setPasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  // Without a phone there is nothing to text a code to, so the password fields show at once.
  const [unlocked, setUnlocked] = useState(!hasPhone);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-md flex-col gap-4">
      {hasPhone ? (
        <SmsCodeStep
          request={() => requestSecurityCodeAction("PASSWORD_SET")}
          sendLabel={t.settings.contacts.sendCode}
          disabled={isPending}
          onStateChange={setUnlocked}
          onSkip={() => setUnlocked(true)}
        >
          <PasswordFields disabled={isPending} />
        </SmsCodeStep>
      ) : (
        unlocked && <PasswordFields disabled={isPending} />
      )}
      {unlocked && (
        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? t.common.saving : t.settings.security.setPassword}
        </Button>
      )}
    </form>
  );
}

function PasswordFields({ disabled }: { disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">{t.account.newPassword}</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required disabled={disabled} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmNewPassword">{t.account.repeatNewPassword}</Label>
        <Input id="confirmNewPassword" name="confirmNewPassword" type="password" autoComplete="new-password" required disabled={disabled} />
      </div>
    </>
  );
}
