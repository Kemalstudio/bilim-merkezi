import type { Metadata } from "next";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatPhone, realEmail } from "@/lib/phone";
import { getI18n } from "@/lib/i18n/server";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.account.settingsMeta };
}

export default async function AccountSettingsPage() {
  const sessionUser = await requireUser();
  const [user, { t }] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      select: { name: true, email: true, phone: true, passwordHash: true },
    }),
    getI18n(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl font-bold text-ink">{t.account.settingsTitle}</h1>
      <ProfileForm
        defaultName={user.name ?? ""}
        email={realEmail(user.email)}
        phone={user.phone ? formatPhone(user.phone) : null}
      />
      {user.passwordHash && <PasswordForm />}
    </div>
  );
}
