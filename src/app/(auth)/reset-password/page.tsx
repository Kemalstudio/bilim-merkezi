import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { findResetAccount } from "@/lib/password-reset";
import { maskPhone, realEmail } from "@/lib/phone";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  // The token is in the address: keep it out of search engines and of Referer headers.
  return { title: t.auth.resetTitle, robots: { index: false, follow: false }, referrer: "no-referrer" };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [{ token = "" }, { t }] = await Promise.all([searchParams, getI18n()]);
  const account = await findResetAccount(token);

  if (!account) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose/10 text-rose">
          <LinkIcon aria-hidden className="h-6 w-6" />
        </span>
        <h1 className="font-display text-2xl font-bold text-ink">{t.auth.resetInvalidTitle}</h1>
        <p className="text-sm text-muted">{t.auth.resetInvalidText}</p>
        <Button asChild className="mt-2 w-full">
          <Link href="/forgot-password">{t.auth.requestNewLink}</Link>
        </Button>
      </div>
    );
  }

  const label = realEmail(account.email) ?? (account.phone ? maskPhone(account.phone) : "");
  return <ResetPasswordForm token={token} account={label} />;
}
