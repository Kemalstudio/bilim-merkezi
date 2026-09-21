"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  changeEmailAction,
  confirmPhoneChangeAction,
  requestPhoneChangeCodeAction,
  type SettingsState,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneField } from "@/components/auth/phone-field";
import { SmsCodeStep } from "@/components/account/settings/sms-code-step";
import { useI18n } from "@/components/i18n-provider";

/** A read-only line showing a contact, with the action to change it beside it. */
function ContactRow({
  icon: Icon,
  label,
  value,
  empty,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
  empty: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-ink-soft">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
        <p className={value ? "truncate text-sm font-semibold text-ink" : "text-sm text-muted"}>{value ?? empty}</p>
      </div>
    </div>
  );
}

/** Password proof for changes that could hand the account to someone else. */
function PasswordProof({ disabled }: { disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="currentPassword">{t.settings.contacts.passwordConfirm}</Label>
      <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required disabled={disabled} />
      <p className="text-xs text-muted">{t.settings.contacts.passwordConfirmHint}</p>
    </div>
  );
}

export function PhoneChange({ phone, hasPassword }: { phone: string | null; hasPassword: boolean }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (previous: SettingsState, formData: FormData) => {
      const result = await confirmPhoneChangeAction(previous, formData);
      if (result?.success) setEditing(false);
      return result;
    },
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  function requestCode() {
    const form = formRef.current;
    if (!form) return Promise.resolve({ status: "error" as const, error: t.errors.generic });
    return requestPhoneChangeCodeAction(new FormData(form));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <ContactRow icon={Phone} label={t.settings.contacts.phone} value={phone} empty={t.settings.contacts.phoneNone} />
        </div>
        {!editing && (
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            {phone ? t.settings.contacts.phoneChange : t.settings.contacts.phoneAdd}
          </Button>
        )}
      </div>

      {editing && (
        <form ref={formRef} action={formAction} className="flex max-w-md flex-col gap-4 rounded-2xl bg-surface-sunken/60 p-4 sm:p-5">
          {/* A disabled field is left out of the submitted form, so the fields stay editable; a code
              is only good for the number it was sent to, and the server checks exactly that. */}
          <div className="flex flex-col gap-4">
            <PhoneField name="phone" label={t.settings.contacts.newPhone} autoFocus />
            {hasPassword && <PasswordProof />}
          </div>
          <SmsCodeStep
            request={requestCode}
            sendLabel={t.settings.contacts.sendCode}
            disabled={isPending}
          >
            <Button type="submit" disabled={isPending} className="self-start">
              {isPending ? t.common.saving : t.settings.contacts.confirmPhone}
            </Button>
          </SmsCodeStep>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="self-start text-xs font-semibold text-muted transition-colors hover:text-ink"
          >
            {t.settings.profile.cancel}
          </button>
        </form>
      )}
    </div>
  );
}

export function EmailChange({ email, hasPassword }: { email: string | null; hasPassword: boolean }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (previous: SettingsState, formData: FormData) => {
      const result = await changeEmailAction(previous, formData);
      if (result?.success) setEditing(false);
      return result;
    },
    undefined
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <ContactRow icon={Mail} label={t.settings.contacts.email} value={email} empty={t.settings.contacts.emailNone} />
        </div>
        {!editing && (
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            {email ? t.settings.contacts.emailChange : t.settings.contacts.emailAdd}
          </Button>
        )}
      </div>

      {editing && (
        <form action={formAction} className="flex max-w-md flex-col gap-4 rounded-2xl bg-surface-sunken/60 p-4 sm:p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t.settings.contacts.newEmail}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required autoFocus disabled={isPending} />
            <p className="text-xs text-muted">{t.settings.contacts.emailHint}</p>
          </div>
          {hasPassword && <PasswordProof disabled={isPending} />}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? t.common.saving : t.common.save}
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-semibold text-muted transition-colors hover:text-ink"
            >
              {t.settings.profile.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
